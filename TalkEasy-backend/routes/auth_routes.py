from fastapi import APIRouter
from controllers import auth_controller
from fastapi.responses import HTMLResponse

router = APIRouter(prefix="/auth", tags=["auth"])

router.post("/signup")(auth_controller.signup)
router.post("/login")(auth_controller.login)
router.post("/logout")(auth_controller.logout)
router.get("/me")(auth_controller.get_me)
router.get("/users")(auth_controller.get_all_users)
router.get("/user/{user_id}")(auth_controller.get_user_by_id)
router.get("/login/google")(auth_controller.auth_login_google)
router.get("/callback/google", response_class=HTMLResponse)(auth_controller.auth_callback_google)
router.post("/migrate-session")(auth_controller.migrate_session)
