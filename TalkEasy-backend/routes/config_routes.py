from fastapi import APIRouter
from controllers import config_controller

router = APIRouter(prefix="/api/config", tags=["config"])

router.post("")(config_controller.update_configuration)
