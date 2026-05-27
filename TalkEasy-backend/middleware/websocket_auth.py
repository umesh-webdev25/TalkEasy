from fastapi import WebSocket
from services.auth_service import auth_service
from typing import Optional

def get_websocket_user_id(websocket: WebSocket) -> Optional[str]:
    query_params = dict(websocket.query_params)
    token = query_params.get('token')
    if token and isinstance(token, str):
        try:
            t = token.split(None, 1)[1] if token.lower().startswith('bearer ') else token
            payload = auth_service.verify_token(t)
            if payload and payload.get('user_id'):
                return payload.get('user_id')
        except Exception:
            return None
    return None
