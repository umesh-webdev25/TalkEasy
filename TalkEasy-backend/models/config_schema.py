from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class BackendStatusResponse(BaseModel):
    status: str = Field(..., description="Status of the backend")
    services: Dict[str, bool] = Field(..., description="Status of individual services")
    timestamp: str = Field(..., description="Timestamp of the status check")

class APIKeyConfig(BaseModel):
    personas: List[str] = Field(default_factory=lambda: ["default", "pirate", "developer", "cowboy", "robot"], description="List of available personas")
    selected_persona: Optional[str] = None
    gemini_api_key: Optional[str] = None
    assemblyai_api_key: Optional[str] = None
    murf_api_key: Optional[str] = None
    murf_voice_id: Optional[str] = None
    mongodb_url: Optional[str] = None

    def validate_keys(self) -> List[str]:
        missing_keys = []
        if not self.gemini_api_key or self.gemini_api_key == "your_gemini_api_key_here":
            missing_keys.append("GEMINI_API_KEY")
        if not self.assemblyai_api_key or self.assemblyai_api_key == "your_assemblyai_api_key_here":
            missing_keys.append("ASSEMBLYAI_API_KEY")
        if not self.murf_api_key or self.murf_api_key == "your_murf_api_key_here":
            missing_keys.append("MURF_API_KEY")
        return missing_keys

    @property
    def are_keys_valid(self) -> bool:
        return len(self.validate_keys()) == 0
