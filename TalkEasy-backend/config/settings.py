import os
from typing import Optional
from dotenv import load_dotenv
from models.config_schema import APIKeyConfig
import logging

logger = logging.getLogger(__name__)

# Load env variables globally
load_dotenv()

# We will define a global configuration holding the current API keys
# This will be replaced by the app state in a better dependency injection structure later, 
# but for now we keep it similar to the original initialize_services behavior

def get_initial_config() -> APIKeyConfig:
    return APIKeyConfig(
        personas=["default", "pirate", "developer", "cowboy", "robot"],
        selected_persona=os.getenv("AGENT_PERSONA", "default"),
        gemini_api_key=os.getenv("GEMINI_API_KEY"),
        assemblyai_api_key=os.getenv("ASSEMBLYAI_API_KEY"),
        murf_api_key=os.getenv("MURF_API_KEY"),
        murf_voice_id=os.getenv("MURF_VOICE_ID", "en-US-amara"),
        mongodb_url=os.getenv("MONGODB_URL")
    )
