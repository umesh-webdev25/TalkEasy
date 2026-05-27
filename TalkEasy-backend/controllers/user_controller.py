import uuid
import logging
from datetime import datetime
from fastapi import Request, HTTPException
from fastapi.templating import Jinja2Templates

logger = logging.getLogger(__name__)
templates = Jinja2Templates(directory="templates")

async def root(request: Request):
    """Serve the main application page."""
    try:
        session_id = request.query_params.get('session_id') or str(uuid.uuid4())
        timestamp = int(datetime.now().timestamp())
        return templates.TemplateResponse("index.html", {"request": request, "session_id": session_id, "timestamp": timestamp})
    except Exception as e:
        logger.error(f"Error rendering index.html: {e}")
        raise HTTPException(status_code=500, detail="Failed to render index")

async def login_page(request: Request):
    return templates.TemplateResponse('auth/login.html', {"request": request})

async def register_page(request: Request):
    return templates.TemplateResponse('auth/register.html', {"request": request})
