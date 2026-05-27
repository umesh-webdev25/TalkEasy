from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class SessionStatsResponse(BaseModel):
    success: bool = Field(..., description="Whether the request was successful")
    session_id: str = Field(..., description="Session ID")
    message_count: int = Field(..., description="Total number of messages")
    created_at: Optional[datetime] = Field(None, description="Session creation timestamp")
    last_activity: Optional[datetime] = Field(None, description="Last activity timestamp")
    total_user_messages: int = Field(..., description="Number of user messages")
    total_assistant_messages: int = Field(..., description="Number of assistant messages")

class UserSessionInfo(BaseModel):
    session_id: str = Field(..., description="Session ID")
    created_at: Optional[datetime] = Field(None, description="Session creation timestamp")
    message_count: int = Field(..., description="Total number of messages")
    last_activity: Optional[datetime] = Field(None, description="Last activity timestamp")

class UserSessionsResponse(BaseModel):
    success: bool = Field(..., description="Whether the request was successful")
    sessions: List[UserSessionInfo] = Field(default_factory=list, description="List of user sessions")
    total_sessions: int = Field(..., description="Total number of sessions")
