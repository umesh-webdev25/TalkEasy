import os
import uuid
import logging
from fastapi import Request, HTTPException, Depends, UploadFile, File, Path
from typing import Optional

from models.chat_schema import VoiceChatResponse, ChatHistoryResponse, ErrorType
from utils.constants import get_fallback_message
from database.database_service import DatabaseService
from services.llm_service import LLMService
from services.stt_service import STTService
from services.tts_service import TTSService
from utils.dependencies import get_database_service, get_llm_service, get_stt_service, get_tts_service
from config.state import global_state, initialize_services
from middleware.jwt_middleware import get_current_user_id

logger = logging.getLogger(__name__)

async def get_chat_history_endpoint(
    session_id: str = Path(..., description="Session ID"),
    database_service: DatabaseService = Depends(get_database_service)
):
    try:
        if not database_service:
            return ChatHistoryResponse(
                success=False,
                session_id=session_id,
                messages=[],
                message_count=0,
                error="Database service not available"
            )
            
        chat_history = await database_service.get_chat_history(session_id)
        return ChatHistoryResponse(
            success=True,
            session_id=session_id,
            messages=chat_history,
            message_count=len(chat_history)
        )
    except Exception as e:
        logger.error(f"Error getting chat history for session {session_id}: {str(e)}")
        return ChatHistoryResponse(
            success=False,
            session_id=session_id,
            messages=[],
            message_count=0,
            error=str(e)
        )

async def get_all_chat_histories_endpoint(
    request: Request,
    database_service: DatabaseService = Depends(get_database_service),
    user_id: Optional[str] = Depends(get_current_user_id)
):
    try:
        if not database_service:
            return {"success": False, "chat_histories": [], "error": "Database service not available"}

        histories = await database_service.get_all_chat_histories()

        if user_id:
            filtered = []
            for s in histories:
                sid_user = None
                if isinstance(s, dict):
                    sid_user = s.get("user_id")
                    if not sid_user:
                        sid_user = s.get("session_owner") or s.get("owner")
                    if not sid_user and isinstance(s.get("messages"), dict):
                        sid_user = s.get("messages").get("user_id")

                if sid_user == user_id:
                    filtered.append(s)

            histories = filtered

        def normalize_session(sess):
            try:
                sess_copy = dict(sess)
            except Exception:
                return sess

            msgs = sess_copy.get("messages") or []
            norm_msgs = []
            for m in msgs:
                try:
                    m_copy = dict(m)
                except Exception:
                    m_copy = m
                ts = m_copy.get("timestamp")
                try:
                    if hasattr(ts, "isoformat"):
                        m_copy["timestamp"] = ts.isoformat()
                except Exception:
                    pass
                norm_msgs.append(m_copy)
            sess_copy["messages"] = norm_msgs

            lu = sess_copy.get("last_updated")
            try:
                if hasattr(lu, "isoformat"):
                    sess_copy["last_updated"] = lu.isoformat()
            except Exception:
                pass

            return sess_copy

        normalized = [normalize_session(s) for s in histories]
        return {"success": True, "chat_histories": normalized}
    except Exception as e:
        logger.error(f"Error getting all chat histories: {str(e)}")
        return {"success": False, "chat_histories": [], "error": str(e)}

async def search_chat_messages(
    query: str,
    session_id: Optional[str] = None,
    database_service: DatabaseService = Depends(get_database_service),
    user_id: Optional[str] = Depends(get_current_user_id)
):
    try:
        if not database_service:
            return {"success": False, "results": [], "error": "Database service not available"}
            
        results = await database_service.search_messages(query, session_id, user_id)
        
        # Normalize timestamps in results
        for r in results:
            msg = r.get("message", {})
            ts = msg.get("timestamp")
            if hasattr(ts, "isoformat"):
                msg["timestamp"] = ts.isoformat()
            ca = r.get("created_at")
            if hasattr(ca, "isoformat"):
                r["created_at"] = ca.isoformat()
                
        return {"success": True, "results": results, "count": len(results)}
    except Exception as e:
        logger.error(f"Error searching chat messages: {str(e)}")
        return {"success": False, "results": [], "error": str(e)}

async def clear_session_history(
    session_id: str = Path(..., description="Session ID"),
    database_service: DatabaseService = Depends(get_database_service)
):
    try:
        if not database_service:
            return {"success": False, "message": "Database service not available"}
            
        success = await database_service.clear_session_history(session_id)
        if success:
            logger.info(f"Chat history cleared for session: {session_id}")
            return {"success": True, "message": f"Chat history cleared for session {session_id}"}
        else:
            return {"success": False, "message": f"Failed to clear chat history for session {session_id}"}
    except Exception as e:
        logger.error(f"Error clearing session history for {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def chat_with_agent_text(
    request: Request,
    session_id: str,
    database_service: DatabaseService = Depends(get_database_service),
    llm_service: LLMService = Depends(get_llm_service),
    user_id: Optional[str] = Depends(get_current_user_id)
):
    try:
        body = await request.json()
        text = body.get("text", "")
        
        if not text:
            return {"success": False, "message": "Text required"}
            
        chat_history = await database_service.get_chat_history(session_id) if database_service else []
        if database_service:
            await database_service.add_message_to_history(session_id, "user", text, user_id=user_id)
            
        response_text = await llm_service.generate_response(text, chat_history)
        
        if database_service:
            await database_service.add_message_to_history(session_id, "assistant", response_text, user_id=user_id)
            
        return {
            "success": True,
            "message": "Chat processed successfully",
            "llm_response": response_text,
            "session_id": session_id
        }
    except Exception as e:
        logger.error(f"Error in text chat: {e}")
        return {"success": False, "message": str(e), "error": True}

async def chat_with_agent(
    request: Request,
    session_id: str = Path(..., description="Session ID"),
    audio: UploadFile = File(..., description="Audio file for voice input"),
    database_service: DatabaseService = Depends(get_database_service),
    llm_service: LLMService = Depends(get_llm_service),
    stt_service: STTService = Depends(get_stt_service),
    tts_service: TTSService = Depends(get_tts_service),
    user_id: Optional[str] = Depends(get_current_user_id)
):
    transcribed_text = ""
    response_text = ""
    audio_url = None
    temp_audio_path = None
    
    try:
        # Validate services availability
        config = initialize_services()
        if not config.are_keys_valid:
            missing_keys = config.validate_keys()
            error_message = get_fallback_message(ErrorType.API_KEYS_MISSING)
            fallback_audio = await tts_service.generate_fallback_audio(error_message) if tts_service else None
            return VoiceChatResponse(
                success=False,
                message=error_message,
                transcription="",
                llm_response=error_message,
                audio_url=fallback_audio,
                session_id=session_id,
                error_type=ErrorType.API_KEYS_MISSING
            )
        
        audio_content = await audio.read()
        temp_audio_path = f"temp_audio_{session_id}_{uuid.uuid4().hex}.wav"
        
        with open(temp_audio_path, "wb") as temp_file:
            temp_file.write(audio_content)
        
        transcribed_text = await stt_service.transcribe_audio(temp_audio_path)
        
        if not database_service:
            chat_history = []
            user_save_success = False
            assistant_save_success = False
        else:
            chat_history = await database_service.get_chat_history(session_id)
            user_save_success = await database_service.add_message_to_history(session_id, "user", transcribed_text, user_id=user_id)
        
        response_text = await llm_service.generate_response(transcribed_text, chat_history)
        
        if database_service:
            assistant_save_success = await database_service.add_message_to_history(session_id, "assistant", response_text, user_id=user_id)
        
        audio_url = await tts_service.generate_audio(response_text, session_id)
        
        return VoiceChatResponse(
            success=True,
            message="Voice chat processed successfully",
            transcription=transcribed_text,
            llm_response=response_text,
            audio_url=audio_url,
            session_id=session_id
        )
        
    except Exception as e:
        logger.error(f"Error in chat_with_agent for session {session_id}: {str(e)}")
        
        if not transcribed_text:
            error_type = ErrorType.STT_ERROR
            error_message = get_fallback_message(ErrorType.STT_ERROR)
        elif not response_text:
            error_type = ErrorType.LLM_ERROR
            error_message = get_fallback_message(ErrorType.LLM_ERROR)
        elif not audio_url:
            error_type = ErrorType.TTS_ERROR
            error_message = get_fallback_message(ErrorType.TTS_ERROR)
        else:
            error_type = ErrorType.GENERAL_ERROR
            error_message = get_fallback_message(ErrorType.GENERAL_ERROR)
        
        fallback_audio = await tts_service.generate_fallback_audio(error_message) if tts_service else None
        
        return VoiceChatResponse(
            success=False,
            message=error_message,
            transcription=transcribed_text,
            llm_response=response_text or error_message,
            audio_url=fallback_audio,
            session_id=session_id,
            error_type=error_type
        )
    
    finally:
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except Exception as e:
                logger.warning(f"Failed to delete temp file {temp_audio_path}: {str(e)}")
