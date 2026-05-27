import json
import asyncio
import logging
from datetime import datetime
from typing import Dict, Optional
from fastapi import WebSocket

from config.state import global_state
from websocket.audio_socket import manager
from services.custom_web_search_service import custom_web_search_service as web_search_service

logger = logging.getLogger(__name__)

# Global locks to prevent concurrent LLM streaming for the same session
session_locks: Dict[str, asyncio.Lock] = {}

async def handle_llm_streaming(user_message: str, session_id: str, websocket: WebSocket, web_search_enabled: bool = False, websocket_user_id: Optional[str] = None, language: str = 'auto'):
    """Handle LLM streaming response and send to Murf WebSocket for TTS"""
    
    # Dependencies retrieved from global state inside function to avoid circular imports during startup
    llm_service = global_state.llm_service
    murf_websocket_service = global_state.murf_websocket_service
    database_service = global_state.database_service

    if session_id not in session_locks:
        session_locks[session_id] = asyncio.Lock()
    
    async with session_locks[session_id]:
        accumulated_response = ""
        audio_chunk_count = 0
        total_audio_size = 0
        
        try:
            try:
                if not database_service:
                    chat_history = []
                else:
                    chat_history = await database_service.get_chat_history(session_id)
                    if websocket_user_id:
                        try:
                            save_success = await database_service.add_message_to_history(session_id, "user", user_message, user_id=websocket_user_id)
                        except Exception:
                            save_success = await database_service.add_message_to_history(session_id, "user", user_message)
                    else:
                        save_success = False
            except Exception as e:
                logger.error(f"Chat history error: {str(e)}")
                chat_history = []
            
            start_message = {
                "type": "llm_streaming_start",
                "message": "LLM is generating response...",
                "user_message": user_message,
                "web_search_enabled": web_search_enabled,
                "timestamp": datetime.now().isoformat()
            }
            await manager.send_personal_message(json.dumps(start_message), websocket)
            
            try:
                await murf_websocket_service.connect()
                
                async def llm_text_stream():
                    nonlocal accumulated_response
                    
                    web_search_results = ""
                    if web_search_enabled and web_search_service and web_search_service.is_configured():
                        try:
                            logger.info(f"🔍 Performing web search for: {user_message}")
                            search_results = await web_search_service.search_web(user_message, max_results=3)
                            web_search_results = web_search_service.format_search_results(search_results, user_message)
                            logger.info(f"✅ Web search completed with {len(search_results)} results")
                            
                            yield web_search_results
                            
                        except Exception as search_error:
                            logger.error(f"Web search failed: {search_error}")
                            web_search_results = f"Web search unavailable: {str(search_error)}"
                            yield web_search_results
                            return
                    
                    llm_stream = llm_service.generate_streaming_response(user_message, chat_history, web_search_results if web_search_enabled else None, language=language)
                    async for chunk in llm_stream:
                        if chunk:
                            accumulated_response += chunk
                            chunk_message = {
                                "type": "llm_streaming_chunk",
                                "chunk": chunk,
                                "accumulated_length": len(accumulated_response),
                                "timestamp": datetime.now().isoformat()
                            }
                            await manager.send_personal_message(json.dumps(chunk_message), websocket)
                            yield chunk
                    
                    if not accumulated_response.strip():
                        logger.error(f"❌ Empty accumulated response for: '{user_message}'")
                        raise Exception("Empty response from LLM stream")
                
                tts_start_message = {
                    "type": "tts_streaming_start", 
                    "message": "Starting TTS streaming with Murf WebSocket...",
                    "timestamp": datetime.now().isoformat()
                }
                await manager.send_personal_message(json.dumps(tts_start_message), websocket)
                
                async for audio_response in murf_websocket_service.stream_text_to_audio(llm_text_stream()):
                    if audio_response["type"] == "audio_chunk":
                        audio_chunk_count += 1
                        total_audio_size += audio_response["chunk_size"]
                        
                        audio_message = {
                            "type": "tts_audio_chunk",
                            "audio_base64": audio_response["audio_base64"],
                            "chunk_number": audio_response["chunk_number"],
                            "chunk_size": audio_response["chunk_size"],
                            "total_size": audio_response["total_size"],
                            "is_final": audio_response["is_final"],
                            "timestamp": audio_response["timestamp"]
                        }
                        await manager.send_personal_message(json.dumps(audio_message), websocket)
                        
                        if audio_response["is_final"]:
                            break
                    
                    elif audio_response["type"] == "status":
                        status_message = {
                            "type": "tts_status",
                            "data": audio_response["data"],
                            "timestamp": audio_response["timestamp"]
                        }
                        await manager.send_personal_message(json.dumps(status_message), websocket)
                
            except Exception as e:
                logger.error(f"Error with Murf WebSocket streaming: {str(e)}")
                error_message = {
                    "type": "tts_streaming_error",
                    "message": f"Error with Murf WebSocket: {str(e)}",
                    "timestamp": datetime.now().isoformat()
                }
                await manager.send_personal_message(json.dumps(error_message), websocket)
            
            finally:
                try:
                    await murf_websocket_service.disconnect()
                except Exception as e:
                    logger.error(f"Error disconnecting from Murf WebSocket: {str(e)}")
            
            try:
                if database_service and accumulated_response and websocket_user_id:
                    try:
                        save_success = await database_service.add_message_to_history(session_id, "assistant", accumulated_response, user_id=websocket_user_id)
                    except Exception:
                        save_success = await database_service.add_message_to_history(session_id, "assistant", accumulated_response)
            except Exception as e:
                logger.error(f"Failed to save assistant response to history: {str(e)}")
            
            complete_message = {
                "type": "llm_streaming_complete",
                "message": "LLM response and TTS streaming completed",
                "complete_response": accumulated_response,
                "total_length": len(accumulated_response),
                "audio_chunks_received": audio_chunk_count,
                "total_audio_size": total_audio_size,
                "session_id": session_id,
                "web_search_enabled": web_search_enabled,
                "timestamp": datetime.now().isoformat()
            }
            await manager.send_personal_message(json.dumps(complete_message), websocket)
            
        except Exception as e:
            logger.error(f"Error in LLM streaming: {str(e)}")
            error_message = {
                "type": "llm_streaming_error",
                "message": f"Error generating LLM response: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
            await manager.send_personal_message(json.dumps(error_message), websocket)
        
        finally:
            if session_id in session_locks:
                del session_locks[session_id]
