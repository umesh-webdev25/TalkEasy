from fastapi import APIRouter
from controllers import persona_controller
from models.chat_schema import WebSearchResponse

router = APIRouter(prefix="/api", tags=["persona"])

router.post("/persona/switch")(persona_controller.switch_persona)
router.post("/web-search", response_model=WebSearchResponse)(persona_controller.search_web_endpoint)
