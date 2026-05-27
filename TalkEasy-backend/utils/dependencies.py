from fastapi import HTTPException
from config.state import global_state

async def get_stt_service():
    if not global_state.stt_service:
        raise HTTPException(status_code=500, detail="STT service not available")
    return global_state.stt_service

async def get_llm_service():
    if not global_state.llm_service:
        raise HTTPException(status_code=500, detail="LLM service not available")
    return global_state.llm_service

async def get_tts_service():
    if not global_state.tts_service:
        raise HTTPException(status_code=500, detail="TTS service not available")
    return global_state.tts_service

async def get_database_service():
    if not global_state.database_service:
        raise HTTPException(status_code=500, detail="Database service not available")
    return global_state.database_service

async def get_assemblyai_streaming_service():
    if not global_state.assemblyai_streaming_service:
        raise HTTPException(status_code=500, detail="AssemblyAI Streaming service not available")
    return global_state.assemblyai_streaming_service

async def get_murf_websocket_service():
    if not global_state.murf_websocket_service:
        raise HTTPException(status_code=500, detail="Murf Websocket service not available")
    return global_state.murf_websocket_service

async def get_email_service():
    if not global_state.email_service:
        raise HTTPException(status_code=500, detail="Email service not available")
    return global_state.email_service

async def get_oauth():
    if not global_state.oauth:
        raise HTTPException(status_code=503, detail="OAuth not configured")
    return global_state.oauth
