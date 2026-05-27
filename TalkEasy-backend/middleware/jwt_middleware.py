from fastapi import Request, HTTPException, Depends
from services.auth_service import auth_service
from typing import Optional

def get_current_user_id(request: Request) -> Optional[str]:
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth and isinstance(auth, str) and auth.lower().startswith("bearer "):
        token = auth.split(None, 1)[1]
        payload = auth_service.verify_token(token)
        if payload and payload.get("user_id"):
            return payload.get("user_id")
    return None

def require_auth(user_id: Optional[str] = Depends(get_current_user_id)) -> str:
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user_id
