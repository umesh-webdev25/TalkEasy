import logging
from fastapi import HTTPException
from models.config_schema import APIKeyConfig
from config.state import initialize_services, global_state

logger = logging.getLogger(__name__)

async def update_configuration(config: APIKeyConfig):
    try:
        initialize_services(config)
        
        return {
            "success": True,
            "message": "Configuration updated successfully",
            "services_initialized": {
                "stt": global_state.stt_service is not None,
                "llm": global_state.llm_service is not None,
                "tts": global_state.tts_service is not None,
                "database": global_state.database_service is not None,
                "assemblyai_streaming": global_state.assemblyai_streaming_service is not None,
                "murf_websocket": global_state.murf_websocket_service is not None
            }
        }
    except Exception as e:
        logger.error(f"Error updating configuration: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update configuration: {str(e)}")
