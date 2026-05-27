from fastapi import APIRouter
from controllers import user_controller
from fastapi.responses import HTMLResponse

router = APIRouter(tags=["user_views"])

router.get("/", response_class=HTMLResponse)(user_controller.root)
router.get("/auth/login", response_class=HTMLResponse)(user_controller.login_page)
router.get("/auth/register", response_class=HTMLResponse)(user_controller.register_page)
