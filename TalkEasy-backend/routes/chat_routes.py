from fastapi import APIRouter
from controllers import chat_controller
from models.chat_schema import ChatHistoryResponse, VoiceChatResponse

router = APIRouter(prefix="/agent/chat", tags=["chat"])

router.get("/all")(chat_controller.get_all_chat_histories_endpoint)
router.get("/search")(chat_controller.search_chat_messages)
router.get("/{session_id}/history", response_model=ChatHistoryResponse)(chat_controller.get_chat_history_endpoint)
router.delete("/{session_id}/history")(chat_controller.clear_session_history)
router.post("/{session_id}/text")(chat_controller.chat_with_agent_text)
router.post("/{session_id}", response_model=VoiceChatResponse)(chat_controller.chat_with_agent)
