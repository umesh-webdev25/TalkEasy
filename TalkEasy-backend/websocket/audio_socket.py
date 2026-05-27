import logging
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    def is_connected(self, websocket: WebSocket) -> bool:
        """Check if a WebSocket is still in active connections"""
        return websocket in self.active_connections

    async def send_personal_message(self, message: str, websocket: WebSocket):
        if self.is_connected(websocket):
            try:
                await websocket.send_text(message)
            except Exception as e:
                logger.error(f"Error sending personal message: {e}")
                self.disconnect(websocket)
        else:
            logger.debug("Attempted to send message to disconnected WebSocket")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to WebSocket: {e}")
                self.disconnect(connection)

manager = ConnectionManager()
