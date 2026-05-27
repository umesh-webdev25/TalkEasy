from fastapi import APIRouter
from controllers import websocket_controller

router = APIRouter(tags=["websocket"])

router.websocket("/ws/audio-stream")(websocket_controller.audio_stream_websocket)
