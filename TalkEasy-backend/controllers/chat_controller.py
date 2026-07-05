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

async def toggle_star_endpoint(
    request: Request,
    session_id: str = Path(..., description="Session ID"),
    database_service: DatabaseService = Depends(get_database_service)
):
    try:
        if not database_service:
            return {"success": False, "message": "Database service not available"}
        body = await request.json()
        is_starred = body.get("isStarred", False)
        
        success = await database_service.toggle_star_session(session_id, is_starred)
        return {"success": success}
    except Exception as e:
        logger.error(f"Error toggling star for {session_id}: {str(e)}")
        return {"success": False, "message": str(e)}

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
        tool_type = body.get("toolType", "")
        
        if not text:
            return {"success": False, "message": "Text required"}
            
        # Define tool-specific system prompts (expanding based on requirements)
        tool_prompts = {
            "translator": "You are a professional translator. Translate text accurately while preserving meaning and tone.",
            "meeting_notes": "You are a meeting assistant. Generate summaries, action items, decisions, and next steps.",
            "email_writer": "You are a professional email writing assistant.",
            "code_assistant": "You are an expert software engineer and coding assistant.",
            "document_summarizer": "You are an expert document summarization assistant. Create concise summaries and extract key points.",
            "pdf_analyzer": "You are an expert PDF analysis assistant. Answer questions about uploaded PDF documents and provide summaries."
        }

        chat_history = await database_service.get_chat_history(session_id) if database_service else []
        
        # Determine toolType. Either from current request, or DB if it's already an active session
        session_info = {}
        if database_service and not tool_type:
            if database_service.db is not None:
                session_doc = await database_service.db.chat_sessions.find_one({"session_id": session_id})
                if session_doc and "toolType" in session_doc:
                    tool_type = session_doc["toolType"]

        system_prompt_override = None
        if tool_type and tool_type in tool_prompts:
            system_prompt_override = tool_prompts[tool_type]

        # Save the toolType in the session if it's the first message and not already saved
        if database_service and not chat_history and tool_type:
            if database_service.db is not None:
                 await database_service.db.chat_sessions.update_one(
                     {"session_id": session_id},
                     {"$set": {"toolType": tool_type}},
                     upsert=True
                 )

        # Inject Document Context if any files are linked to this session
        final_text = text
        if database_service:
            session_files = await database_service.get_files_by_session(session_id)
            if session_files:
                doc_context = ""
                for file_info in session_files:
                    if file_info.get("extractedText"):
                        doc_context += f"--- Document: {file_info.get('fileName')} ---\n{file_info.get('extractedText')}\n\n"
                
                if doc_context:
                    # We inject it transparently into the LLM prompt, but we shouldn't save this giant text into the user's chat history directly
                    final_text = f"Document Content:\n{doc_context}\n\nUser Question:\n{text}"

        if database_service:
            await database_service.add_message_to_history(session_id, "user", text, user_id=user_id)
            
        try:
            response_text = await llm_service.generate_response(final_text, chat_history, system_prompt_override=system_prompt_override)
        except Exception as llm_error:
            logger.error(f"LLM generation failed: {llm_error}")
            response_text = "I'm sorry, I am currently experiencing API limits or technical difficulties. Please try again later."
            if database_service:
                await database_service.add_message_to_history(session_id, "assistant", response_text, user_id=user_id)
            return {
                "success": True,  # Return true so frontend displays the AI error message
                "message": str(llm_error),
                "llm_response": response_text,
                "session_id": session_id,
                "error": True
            }
        
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
        
        tool_prompts = {
            "translator": "You are a professional translator. Translate text accurately while preserving meaning and tone.",
            "meeting_notes": "You are a meeting assistant. Generate summaries, action items, decisions, and next steps.",
            "email_writer": "You are a professional email writing assistant.",
            "code_assistant": "You are an expert software engineer and coding assistant.",
            "document_summarizer": "You are an expert document summarization assistant. Create concise summaries and extract key points.",
            "pdf_analyzer": "You are an expert PDF analysis assistant. Answer questions about uploaded PDF documents and provide summaries."
        }

        if not database_service:
            chat_history = []
            user_save_success = False
            assistant_save_success = False
            tool_type = None
        else:
            chat_history = await database_service.get_chat_history(session_id)
            user_save_success = await database_service.add_message_to_history(session_id, "user", transcribed_text, user_id=user_id)
            
            tool_type = None
            if database_service.db is not None:
                session_doc = await database_service.db.chat_sessions.find_one({"session_id": session_id})
                if session_doc and "toolType" in session_doc:
                    tool_type = session_doc["toolType"]

        system_prompt_override = None
        if tool_type and tool_type in tool_prompts:
            system_prompt_override = tool_prompts[tool_type]

        final_text = transcribed_text
        if database_service:
            session_files = await database_service.get_files_by_session(session_id)
            if session_files:
                doc_context = ""
                for file_info in session_files:
                    if file_info.get("extractedText"):
                        doc_context += f"--- Document: {file_info.get('fileName')} ---\n{file_info.get('extractedText')}\n\n"
                
                if doc_context:
                    final_text = f"Document Content:\n{doc_context}\n\nUser Question:\n{transcribed_text}"

        response_text = await llm_service.generate_response(final_text, chat_history, system_prompt_override=system_prompt_override)
        
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
        
        if database_service and transcribed_text:
            try:
                await database_service.add_message_to_history(session_id, "assistant", error_message, user_id=user_id)
            except Exception as db_err:
                logger.error(f"Failed to save fallback error to DB: {db_err}")
        
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
