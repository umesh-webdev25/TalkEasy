from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from dotenv import load_dotenv
from utils.logging_config import setup_logging, get_logger
from config.state import initialize_all_services, shutdown_all_services, global_state
from websocket.audio_socket import manager

from routes import (
    auth_routes,
    user_routes,
    chat_routes,
    persona_routes,
    config_routes,
    websocket_routes,
    file_routes
)

setup_logging()
logger = get_logger(__name__)
load_dotenv()
# Reduce noise from passlib bcrypt backend warnings when bcrypt package layout differs
import logging as _logging
_logging.getLogger('passlib.handlers.bcrypt').setLevel(_logging.ERROR)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Starting Voice Agent application...")
    await initialize_all_services()
    
    # Bind services to app state for dependency injection
    app.state.db_service = global_state.database_service
    app.state.llm_service = global_state.llm_service
    
    logger.info("✅ Application startup completed")

    yield

    # Shutdown
    logger.info("🛑 Shutting down Voice Agent application...")
    await shutdown_all_services()
    
    # Clean up websocket connections
    for connection in manager.active_connections:
        await connection.close()
    
    # Session locks are now managed inside streaming_socket, but if they persist,
    # they will be garbage collected.

    logger.info("✅ Application shutdown completed")

# Initialize FastAPI app
app = FastAPI(
    title="30 Days of Voice Agents - AI Voice Assistant",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Mount uploads directory so frontend can display images
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include Routers
app.include_router(user_routes.router)
app.include_router(auth_routes.router)
app.include_router(chat_routes.router)
app.include_router(file_routes.router)

app.include_router(persona_routes.router)
app.include_router(config_routes.router)
app.include_router(websocket_routes.router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
