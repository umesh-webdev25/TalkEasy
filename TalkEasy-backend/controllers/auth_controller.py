import os
import json
import asyncio
import logging
from fastapi import Request, HTTPException, Depends
from fastapi.responses import HTMLResponse
from services.auth_service import auth_service
from database.database_service import DatabaseService
from services.email_service import EmailService
from utils.dependencies import get_database_service, get_email_service, get_oauth
from middleware.jwt_middleware import require_auth
from authlib.integrations.starlette_client import OAuth

logger = logging.getLogger(__name__)

async def signup(request: Request, email_service: EmailService = Depends(get_email_service), database_service: DatabaseService = Depends(get_database_service)):
    body = await request.json()
    email = body.get("email", "").strip().lower()
    first_name = body.get("first_name", "")
    last_name = body.get("last_name", "")
    password = body.get("password", "")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    validation = auth_service.validate_email(email)
    if not validation.get("is_valid"):
        raise HTTPException(status_code=400, detail=validation.get("error") or "Invalid email")
    normalized_email = validation.get("normalized_email")

    require_deliv = os.getenv('REQUIRE_EMAIL_DELIVERABILITY', 'false').lower() in ('1', 'true', 'yes')
    if require_deliv:
        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, auth_service.check_email_deliverability, normalized_email)
            if not result.get('ok'):
                raise HTTPException(status_code=400, detail=f"Email deliverability check failed: {result.get('reason')}")
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Email deliverability pre-check failed (continuing): {e}")

    try:
        user = await auth_service.create_user(normalized_email, first_name, last_name, password)
    except ValueError as ve:
        raise HTTPException(status_code=409, detail=str(ve))
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Failed to create user")

    try:
        if email_service and email_service.is_configured():
            subject = "Welcome to TalkEasy"
            body_text = f"Hi {first_name or ''},\n\nThanks for signing up for TalkEasy. Your account has been created.\n\nRegards,\nTalkEasy Team"
            loop = asyncio.get_event_loop()
            loop.run_in_executor(None, email_service.send_email, normalized_email, subject, body_text)
        else:
            logger.info("EmailService not configured - skipping welcome email")
    except Exception as e:
        logger.warning(f"Failed to send welcome email: {e}")

    try:
        async def _deliverability_check_runner(email_to_check, user_obj):
            try:
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(None, auth_service.check_email_deliverability, email_to_check)
                ok = result.get('ok')
                reason = result.get('reason')
                if not ok:
                    logger.warning(f"Email deliverability check failed for {email_to_check}: {reason}")
                    try:
                        if database_service and database_service.is_connected():
                            await database_service.db.users.update_one({'email': email_to_check}, {'$set': {'email_deliverable': False, 'email_deliverable_reason': reason}})
                    except Exception:
                        pass
                else:
                    try:
                        if database_service and database_service.is_connected():
                            await database_service.db.users.update_one({'email': email_to_check}, {'$set': {'email_deliverable': True}})
                    except Exception:
                        pass
            except Exception as ex:
                logger.warning(f"Deliverability check failed: {ex}")

        asyncio.create_task(_deliverability_check_runner(normalized_email, user))
    except Exception as e:
        logger.warning(f"Failed to schedule deliverability check: {e}")

    return {"success": True, "message": "User created successfully", "user_id": user.get("id")}


async def login(request: Request):
    body = await request.json()
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    validation = auth_service.validate_email(email)
    if not validation.get("is_valid"):
        raise HTTPException(status_code=400, detail=validation.get("error") or "Invalid email")
    email = validation.get("normalized_email")

    try:
        found_user = await auth_service.get_user_by_email(email)
        if found_user:
            logger.info(f"Login attempt for existing user: {email}")
        else:
            logger.info(f"Login attempt for unknown user: {email}")
    except Exception as e:
        logger.warning(f"Error checking user existence for login debugging: {e}")

    user = await auth_service.authenticate_user(email, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = auth_service.create_access_token({"sub": user.get("email"), "user_id": user.get("id")})
    refresh_token = auth_service.create_refresh_token({"sub": user.get("email"), "user_id": user.get("id")})

    return {
        "success": True,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {"id": user.get("id"), "email": user.get("email"), "first_name": user.get("first_name"), "last_name": user.get("last_name")}
    }


async def logout(request: Request, database_service: DatabaseService = Depends(get_database_service)):
    try:
        token = None
        auth_header = request.headers.get('authorization')
        try:
            logger.info(f"Logout request received. headers={dict(request.headers)}")
        except Exception:
            logger.info("Logout request received (failed to stringify headers)")

        body = {}
        try:
            if request.headers.get('content-type', '').startswith('application/json'):
                body = await request.json()
        except Exception as e:
            logger.info(f"Failed to parse logout request JSON body: {e}")

        try:
            logger.info(f"Logout request json body: {body}")
        except Exception:
            pass

        if auth_header and auth_header.lower().startswith('bearer '):
            token = auth_header.split(None, 1)[1]
        else:
            token = body.get('token')

        payload = None
        if token:
            try:
                payload = auth_service.verify_token(token)
            except Exception:
                payload = None

            try:
                revoked = auth_service.revoke_token(token)
                logger.info(f"Token revoke attempted: {revoked}")
            except Exception as e:
                logger.warning(f"Token revoke error: {e}")

            try:
                if database_service and database_service.is_connected():
                    exp_ts = None
                    try:
                        exp_ts = int(payload.get('exp')) if payload and payload.get('exp') else None
                    except Exception:
                        exp_ts = None

                    try:
                        await database_service.add_revoked_token(token, exp_ts)
                        logger.info('Persisted revoked token to DB')
                    except Exception as db_e:
                        logger.warning(f'Failed to persist revoked token to DB: {db_e}')
            except Exception:
                pass

        try:
            if payload and database_service and payload.get('user_id'):
                await database_service.update_user_last_login(payload.get('user_id'))
        except Exception:
            pass

        return {"success": True, "message": "Logged out"}
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return {"success": False, "message": "Logout failed"}


async def auth_login_google(request: Request, oauth: OAuth = Depends(get_oauth)):
    if not oauth:
        raise HTTPException(status_code=503, detail="OAuth not configured")
    redirect_uri = os.getenv('OAUTH_REDIRECT_URI', 'http://127.0.0.1:8000/auth/callback/google')
    return await oauth.google.authorize_redirect(request, redirect_uri)


async def auth_callback_google(request: Request, oauth: OAuth = Depends(get_oauth), database_service: DatabaseService = Depends(get_database_service)):
    if not oauth:
        raise HTTPException(status_code=503, detail="OAuth not configured")

    try:
        token = await oauth.google.authorize_access_token(request)
        userinfo = await oauth.google.parse_id_token(request, token)
    except Exception as e:
        logger.error(f"Google OAuth callback error: {e}")
        raise HTTPException(status_code=400, detail="OAuth failed")

    email = (userinfo.get('email') or '').lower()
    first = userinfo.get('given_name') or ''
    last = userinfo.get('family_name') or ''

    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")

    validation = auth_service.validate_email(email)
    if not validation.get("is_valid"):
        logger.warning(f"Google OAuth returned invalid email: {email}")
        raise HTTPException(status_code=400, detail=validation.get("error") or "Invalid email from OAuth provider")
    email = validation.get("normalized_email")

    existing = await auth_service.get_user_by_email(email)
    if not existing:
        try:
            user = await auth_service.create_user(email, first, last, os.urandom(16).hex())
            if database_service and database_service.is_connected():
                try:
                    await database_service.db.users.update_one({'email': email}, {'$set': {'email_verified': True}})
                except Exception:
                    pass
        except Exception as e:
            logger.error(f"Failed to create OAuth user: {e}")
            raise HTTPException(status_code=500, detail="Failed to create user")
        user_obj = user
    else:
        user_obj = existing

    access_token = auth_service.create_access_token({"sub": email, "user_id": user_obj.get('id')})
    refresh_token = auth_service.create_refresh_token({"sub": email, "user_id": user_obj.get('id')})

    access_js = json.dumps(access_token)
    refresh_js = json.dumps(refresh_token)
    user_js = json.dumps({
        "id": user_obj.get('id'),
        "email": user_obj.get('email'),
        "first_name": user_obj.get('first_name'),
        "last_name": user_obj.get('last_name')
    })
    html = (
        "<!doctype html>"
        "<html>"
        "  <head><meta charset=\"utf-8\"><title>Login successful</title></head>"
        "  <body>"
        "    <script>"
        f"      try {{ localStorage.setItem('access_token', {access_js}); localStorage.setItem('refresh_token', {refresh_js}); localStorage.setItem('user', {user_js}); }} catch(e){{}};"
        "      window.location.href = '/';"
        "    </script>"
        "  </body>"
        "</html>"
    )
    return HTMLResponse(html)





async def get_me(request: Request, user_id: str = Depends(require_auth)):
    user = await auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Remove sensitive data
    user.pop("password_hash", None)
    user.pop("password", None)
    return {"success": True, "user": user}

async def get_all_users(request: Request, user_id: str = Depends(require_auth)):
    users = await auth_service.get_all_users()
    
    # Remove sensitive data
    for u in users:
        u.pop("password_hash", None)
        u.pop("password", None)
        
    return {"success": True, "users": users}
async def get_user_by_id(request: Request, user_id: str = Depends(require_auth)):
    """Fetch user details by explicit user ID (requires auth)."""
    user = await auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Remove sensitive data
    user.pop("password_hash", None)
    user.pop("password", None)
    return {"success": True, "user": user}


async def migrate_session(request: Request):
    raise HTTPException(status_code=404, detail="Not Found")
