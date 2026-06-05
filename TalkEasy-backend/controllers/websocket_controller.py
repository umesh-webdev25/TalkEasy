import os
import json
import uuid
import logging
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect

from config.state import global_state
from websocket.audio_socket import manager
from websocket.streaming_socket import handle_llm_streaming
from middleware.websocket_auth import get_websocket_user_id

logger = logging.getLogger(__name__)

async def audio_stream_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    
    query_params = dict(websocket.query_params)
    session_id = query_params.get('session_id')
    
    websocket_user_id = get_websocket_user_id(websocket)
    web_search_enabled = query_params.get('web_search', 'false').lower() == 'true'
    lang_param = query_params.get('lang', 'auto').lower()
    
    if not session_id:
        session_id = str(uuid.uuid4())
    
    audio_filename = f"streamed_audio_{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.wav"
    audio_filepath = os.path.join("streamed_audio", audio_filename)
    os.makedirs("streamed_audio", exist_ok=True)
    is_websocket_active = True
    last_processed_transcript = ""
    last_processing_time = 0
    
    async def transcription_callback(transcript_data):
        nonlocal last_processed_transcript, last_processing_time
        try:
            if is_websocket_active and manager.is_connected(websocket):
                if transcript_data.get("type") == "final_transcript":
                    await manager.send_personal_message(json.dumps(transcript_data), websocket)
                    final_text = transcript_data.get('text', '').strip()
                    
                    normalized_current = final_text.lower().strip('.,!?;: ')
                    normalized_last = last_processed_transcript.lower().strip('.,!?;: ')
                    
                    current_time = datetime.now().timestamp()
                    time_since_last = current_time - last_processing_time
                    
                    if (final_text and 
                        normalized_current != normalized_last and 
                        len(normalized_current) > 0 and 
                        time_since_last >= 2.0 and
                        global_state.llm_service):
                        
                        last_processed_transcript = final_text
                        last_processing_time = current_time

                        await handle_llm_streaming(final_text, session_id, websocket, web_search_enabled, websocket_user_id, language=lang_param)
                        
        except Exception as e:
            logger.error(f"Error sending transcription: {e}")

    assemblyai_ready = False
    
    try:
        if global_state.assemblyai_streaming_service:
            global_state.assemblyai_streaming_service.set_transcription_callback(transcription_callback)
            async def safe_websocket_callback(msg):
                nonlocal assemblyai_ready
                if is_websocket_active and manager.is_connected(websocket):
                    if msg.get("type") == "transcription_ready":
                        assemblyai_ready = True
                        logger.info(f"✅ AssemblyAI streaming service is ready for session {session_id}")
                    elif msg.get("type") == "transcription_error":
                        assemblyai_ready = False
                        logger.error(f"❌ AssemblyAI streaming error: {msg.get('message')}")
                    return await manager.send_personal_message(json.dumps(msg), websocket)
                return None
            
            stream_started = await global_state.assemblyai_streaming_service.start_streaming_transcription(
                websocket_callback=safe_websocket_callback
            )
            
            if not stream_started:
                logger.warning("Failed to start AssemblyAI streaming service")
            
        welcome_message = {
            "type": "audio_stream_ready",
            "message": "Audio streaming endpoint ready with AssemblyAI transcription. Send binary audio data.",
            "session_id": session_id,
            "audio_filename": audio_filename,
            "transcription_enabled": global_state.assemblyai_streaming_service is not None,
            "transcription_ready": assemblyai_ready,
            "web_search_enabled": web_search_enabled,
            "timestamp": datetime.now().isoformat()
        }
        await manager.send_personal_message(json.dumps(welcome_message), websocket)
        
        try:
            with open(audio_filepath, "wb") as audio_file:
                chunk_count = 0
                total_bytes = 0
                
                while True:
                    try:
                        message = await websocket.receive()
                        
                        if "text" in message:
                            text_data = message["text"]
                            
                            try:
                                command_data = json.loads(text_data)
                                if isinstance(command_data, dict):
                                    if command_data.get("type") == "session_id":
                                        new_session_id = command_data.get("session_id")
                                        if new_session_id and new_session_id != session_id:
                                            logger.info(f"Updating session_id from {session_id} to {new_session_id}")
                                            session_id = new_session_id
                                            audio_filename = f"streamed_audio_{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.wav"
                                            audio_filepath = os.path.join("streamed_audio", audio_filename)
                                    elif command_data.get("type") == "web_search_toggle":
                                        web_search_enabled = command_data.get("enabled", False)
                                        logger.info(f"Web search {'enabled' if web_search_enabled else 'disabled'}")
                                    continue
                            except json.JSONDecodeError:
                                pass
                            
                            command = text_data
                            
                            if command == "start_streaming":
                                response = {
                                    "type": "command_response",
                                    "message": "Ready to receive audio chunks with real-time transcription",
                                    "status": "streaming_ready"
                                }
                                await manager.send_personal_message(json.dumps(response), websocket)
                                
                            elif command == "stop_streaming":
                                response = {
                                    "type": "command_response",
                                    "message": "Stopping audio stream",
                                    "status": "streaming_stopped"
                                }
                                await manager.send_personal_message(json.dumps(response), websocket)
                                
                                if global_state.assemblyai_streaming_service:
                                    async def safe_stop_callback(msg):
                                        if manager.is_connected(websocket):
                                            return await manager.send_personal_message(json.dumps(msg), websocket)
                                        return None
                                break
                        
                        elif "bytes" in message:
                            audio_chunk = message["bytes"]
                            chunk_count += 1
                            total_bytes += len(audio_chunk)
                            
                            audio_file.write(audio_chunk)
                            
                            if (global_state.assemblyai_streaming_service and 
                                is_websocket_active and 
                                assemblyai_ready and 
                                global_state.assemblyai_streaming_service.is_ready_for_audio()):
                                await global_state.assemblyai_streaming_service.send_audio_chunk(audio_chunk)
                            
                            if chunk_count % 50 == 0:
                                chunk_response = {
                                    "type": "audio_chunk_received",
                                    "chunk_number": chunk_count,
                                    "total_bytes": total_bytes,
                                    "transcription_active": assemblyai_ready and global_state.assemblyai_streaming_service.is_active() if global_state.assemblyai_streaming_service else False,
                                    "timestamp": datetime.now().isoformat()
                                }
                                await manager.send_personal_message(json.dumps(chunk_response), websocket)
                    
                    except WebSocketDisconnect:
                        break
                    except Exception as e:
                        logger.error(f"Error processing audio chunk: {e}")
                        break
            
            final_response = {
                "type": "audio_stream_complete",
                "message": f"Audio stream completed. Total chunks: {chunk_count}, Total bytes: {total_bytes}",
                "session_id": session_id,
                "audio_filename": audio_filename,
                "total_chunks": chunk_count,
                "total_bytes": total_bytes,
                "timestamp": datetime.now().isoformat()
            }
            await manager.send_personal_message(json.dumps(final_response), websocket)
        finally:
            if os.path.exists(audio_filepath):
                try:
                    os.remove(audio_filepath)
                    logger.info(f"🧹 Cleaned up temporary audio file: {audio_filepath}")
                except Exception as e:
                    logger.error(f"⚠️ Failed to cleanup audio file {audio_filepath}: {e}")
        
    except WebSocketDisconnect:
        is_websocket_active = False
        manager.disconnect(websocket)
    except Exception as e:
        is_websocket_active = False
        logger.error(f"Audio streaming WebSocket error: {e}")
        manager.disconnect(websocket)
    finally:
        is_websocket_active = False
        if global_state.assemblyai_streaming_service:
            await global_state.assemblyai_streaming_service.stop_streaming_transcription()
