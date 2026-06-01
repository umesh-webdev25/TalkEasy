from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Request
from typing import Optional, List, Dict
import os
import uuid
import logging
from datetime import datetime
import fitz  # PyMuPDF
from database.database_service import DatabaseService
from services.llm_service import LLMService
from middleware.jwt_middleware import get_current_user_id

logger = logging.getLogger(__name__)

async def get_database_service(request: Request) -> DatabaseService:
    if not hasattr(request.app.state, "db_service"):
        raise RuntimeError("Database service not initialized")
    return request.app.state.db_service

async def get_llm_service(request: Request) -> LLMService:
    if not hasattr(request.app.state, "llm_service"):
        raise RuntimeError("LLM service not initialized")
    return request.app.state.llm_service

async def upload_file(
    file: UploadFile = File(...),
    linked_chat_id: Optional[str] = Form(None),
    database_service: DatabaseService = Depends(get_database_service),
    user_id: Optional[str] = Depends(get_current_user_id)
):
    try:
        if not database_service:
            return {"success": False, "message": "Database service not available"}
            
        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename)[1].lower()
        file_type = "document"
        if file_ext in [".pdf", ".docx", ".txt"]:
            file_type = "document"
        elif file_ext in [".png", ".jpg", ".jpeg"]:
            file_type = "image"
        elif file_ext in [".mp3", ".wav", ".m4a"]:
            file_type = "audio"
            
        # We read the file content
        content = await file.read()
        
        # Create uploads directory if it doesn't exist
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, f"{file_id}{file_ext}")
        with open(file_path, "wb") as f:
            f.write(content)
            
        file_size = len(content)
        file_url = f"/uploads/{file_id}{file_ext}"

        extracted_text = ""
        # If it's a PDF, we can extract text using PyMuPDF
        if file_ext == ".pdf":
            try:
                # fitz.Document can take a stream or bytes. We can save to a temp file or read from memory.
                doc = fitz.open(stream=content, filetype="pdf")
                text_parts = []
                for page in doc:
                    text_parts.append(page.get_text())
                extracted_text = "\n".join(text_parts)
                doc.close()
            except Exception as pdf_err:
                logger.error(f"Error extracting PDF text: {pdf_err}")
                extracted_text = "Error extracting text."
        elif file_ext == ".txt":
            extracted_text = content.decode('utf-8', errors='ignore')
            
        file_metadata = {
            "fileId": file_id,
            "fileName": file.filename,
            "fileType": file_type,
            "fileSize": file_size,
            "fileUrl": file_url,
            "uploadedBy": user_id,
            "uploadedAt": datetime.now(),
            "linkedChatId": linked_chat_id,
            "extractedText": extracted_text[:50000] # Limit extracted text size
        }
        
        success = await database_service.save_file_metadata(file_metadata)
        
        return {
            "success": success, 
            "fileId": file_id, 
            "message": "File uploaded successfully",
            "extractedTextPreview": extracted_text[:200] if extracted_text else ""
        }
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        return {"success": False, "message": str(e)}

async def analyze_file(
    request: Request,
    file_id: str,
    database_service: DatabaseService = Depends(get_database_service),
    llm_service: LLMService = Depends(get_llm_service),
    user_id: Optional[str] = Depends(get_current_user_id)
):
    try:
        if not database_service:
            return {"success": False, "message": "Database service not available"}
            
        body = await request.json()
        query = body.get("query", "Summarize this document")
        session_id = body.get("sessionId")
        
        file_metadata = await database_service.get_file(file_id)
        if not file_metadata:
            return {"success": False, "message": "File not found"}
            
        extracted_text = file_metadata.get("extractedText", "")
        if not extracted_text:
            return {"success": False, "message": "No text extracted from this file."}
            
        # Build prompt for LLM
        prompt = f"Based on the following document text, answer the query: '{query}'\n\nDocument Text:\n{extracted_text[:30000]}"
        
        # We can just send this directly to generate_response
        chat_history = []
        if session_id:
            chat_history = await database_service.get_chat_history(session_id)
            await database_service.add_message_to_history(session_id, "user", f"Analyze file '{file_metadata.get('fileName')}': {query}", user_id=user_id)
            
        response_text = await llm_service.generate_response(prompt, chat_history)
        
        if session_id:
            await database_service.add_message_to_history(session_id, "assistant", response_text, user_id=user_id)
            
        return {
            "success": True,
            "message": "Analysis complete",
            "llm_response": response_text
        }
    except Exception as e:
        logger.error(f"Error analyzing file: {str(e)}")
        return {"success": False, "message": str(e)}

async def get_user_files_endpoint(
    database_service: DatabaseService = Depends(get_database_service),
    user_id: Optional[str] = Depends(get_current_user_id)
):
    try:
        if not database_service:
            return {"success": False, "files": []}
            
        files = await database_service.get_user_files(user_id)
        
        # Normalize datetime
        for f in files:
            dt = f.get("uploadedAt")
            if hasattr(dt, "isoformat"):
                f["uploadedAt"] = dt.isoformat()
                
        return {"success": True, "files": files}
    except Exception as e:
        return {"success": False, "files": [], "error": str(e)}

async def delete_file_endpoint(
    file_id: str,
    database_service: DatabaseService = Depends(get_database_service),
    user_id: Optional[str] = Depends(get_current_user_id)
):
    try:
        if not database_service:
            return {"success": False, "message": "Database service not available"}
            
        file_metadata = await database_service.get_file(file_id)
        if not file_metadata:
            return {"success": False, "message": "File not found"}
            
        if file_metadata.get("uploadedBy") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this file")
            
        # Delete from physical storage
        file_url = file_metadata.get("fileUrl")
        if file_url:
            # Strip leading slash
            file_path = file_url.lstrip('/')
            if os.path.exists(file_path):
                os.remove(file_path)
                
        # Delete from DB
        success = await database_service.delete_file(file_id, user_id)
        return {"success": success}
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
        return {"success": False, "message": str(e)}
