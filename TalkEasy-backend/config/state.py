import os
import asyncio
import logging
from typing import Optional
from authlib.integrations.starlette_client import OAuth

from models.config_schema import APIKeyConfig
from services.stt_service import STTService
from services.llm_service import LLMService
from services.tts_service import TTSService
# pyrefly: ignore [missing-import]
from database.database_service import DatabaseService
from services.assemblyai_streaming_service import AssemblyAIStreamingService
from services.murf_websocket_service import MurfWebSocketService
from services.email_service import EmailService
from services.auth_service import auth_service

logger = logging.getLogger(__name__)

class GlobalState:
    def __init__(self):
        self.stt_service: Optional[STTService] = None
        self.llm_service: Optional[LLMService] = None
        self.tts_service: Optional[TTSService] = None
        self.database_service: Optional[DatabaseService] = None
        self.assemblyai_streaming_service: Optional[AssemblyAIStreamingService] = None
        self.murf_websocket_service: Optional[MurfWebSocketService] = None
        self.email_service: Optional[EmailService] = None
        self.oauth: Optional[OAuth] = None

global_state = GlobalState()

def initialize_oauth():
    global_state.oauth = OAuth()
    google_client_id = os.getenv('GOOGLE_CLIENT_ID')
    google_client_secret = os.getenv('GOOGLE_CLIENT_SECRET')

    if google_client_id and google_client_secret:
        global_state.oauth.register(
            name='google',
            client_id=google_client_id,
            client_secret=google_client_secret,
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={'scope': 'openid email profile'},
        )
    else:
        global_state.oauth = None

def initialize_services(config: APIKeyConfig = None) -> APIKeyConfig:
    if config is None:
        config = APIKeyConfig(
            personas=["default", "pirate", "developer", "cowboy", "robot"],
            selected_persona=os.getenv("AGENT_PERSONA", "default"),
            gemini_api_key=os.getenv("GEMINI_API_KEY"),
            assemblyai_api_key=os.getenv("ASSEMBLYAI_API_KEY"),
            murf_api_key=os.getenv("MURF_API_KEY"),
            murf_voice_id=os.getenv("MURF_VOICE_ID", "en-US-amara"),
            mongodb_url=os.getenv("MONGODB_URL")
        )

    try:
        if config.assemblyai_api_key:
            try:
                global_state.stt_service = STTService(config.assemblyai_api_key)
            except Exception as e:
                logger.error(f"Failed to initialize STTService: {e}")
                global_state.stt_service = None

            try:
                global_state.assemblyai_streaming_service = AssemblyAIStreamingService(config.assemblyai_api_key)
            except Exception as e:
                logger.error(f"Failed to initialize AssemblyAIStreamingService: {e}")
                global_state.assemblyai_streaming_service = None
        else:
            global_state.stt_service = None
            global_state.assemblyai_streaming_service = None

        if config.gemini_api_key:
            try:
                global_state.llm_service = LLMService(config.gemini_api_key, persona=config.selected_persona)
            except Exception as e:
                logger.error(f"Failed to initialize LLMService: {e}")
                global_state.llm_service = None
        else:
            global_state.llm_service = None

        if config.murf_api_key:
            try:
                global_state.tts_service = TTSService(config.murf_api_key, voice_id=config.murf_voice_id)
            except Exception as e:
                logger.error(f"Failed to initialize TTSService: {e}")
                global_state.tts_service = None
            try:
                global_state.murf_websocket_service = MurfWebSocketService(config.murf_api_key, voice_id=config.murf_voice_id)
            except Exception as e:
                logger.error(f"Failed to initialize MurfWebSocketService: {e}")
                global_state.murf_websocket_service = None
        else:
            global_state.tts_service = None
            global_state.murf_websocket_service = None

        try:
            global_state.database_service = DatabaseService(config.mongodb_url)
        except Exception as e:
            logger.error(f"Failed to initialize DatabaseService: {e}")
            global_state.database_service = None

        try:
            global_state.email_service = EmailService()
        except Exception as e:
            logger.error(f"Failed to initialize EmailService: {e}")
            global_state.email_service = None

        try:
            auth_service.db = global_state.database_service
        except Exception:
            pass

        if global_state.llm_service and config.selected_persona:
            try:
                global_state.llm_service.set_persona(config.selected_persona)
            except Exception:
                pass

        return config

    except Exception as e:
        logger.error(f"Unexpected error while initializing services: {e}")
        return config

async def initialize_all_services():
    config = initialize_services()
    try:
        initialize_oauth()
    except Exception as e:
        logger.error(f"Error initializing oauth: {e}")
        
    if global_state.database_service:
        try:
            db_connected = await global_state.database_service.connect()
            if db_connected:
                logger.info("✅ Database service connected successfully")
            else:
                logger.warning("⚠️ Database service running in fallback mode")
        except Exception as e:
            logger.error(f"❌ Database service initialization error: {e}")
    else:
        logger.error("❌ Database service not initialized")
        
async def shutdown_all_services():
    if global_state.database_service:
        await global_state.database_service.close()
