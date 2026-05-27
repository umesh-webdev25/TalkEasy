import logging
from fastapi import Request, HTTPException, Depends

from services.llm_service import LLMService
from services.custom_web_search_service import custom_web_search_service as web_search_service
from utils.dependencies import get_llm_service
from models.chat_schema import WebSearchResponse, WebSearchResult

logger = logging.getLogger(__name__)

async def switch_persona(request: Request, llm_service: LLMService = Depends(get_llm_service)):
    try:
        body = await request.json()
        persona = body.get("persona")
        
        if not persona:
            raise HTTPException(status_code=400, detail="Persona not provided")
        
        if llm_service:
            llm_service.set_persona(persona)
            return {
                "success": True,
                "message": f"Persona switched to {persona}",
                "persona": persona
            }
        else:
            raise HTTPException(status_code=500, detail="LLM service not initialized")
    except Exception as e:
        logger.error(f"Error switching persona: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to switch persona: {str(e)}")

async def search_web_endpoint(request: Request):
    try:
        body = await request.json()
        query = body.get("query", "")
        
        if not query.strip():
            return WebSearchResponse(
                success=False,
                query=query,
                results=[],
                error_message="Search query cannot be empty"
            )
        
        if not web_search_service or not web_search_service.is_configured():
            return WebSearchResponse(
                success=False,
                query=query,
                results=[],
                error_message="Web search service is not available. Please check Tavily API key."
            )
        
        search_results = await web_search_service.search_web(query, max_results=3)
        
        web_results = [
            WebSearchResult(
                title=result["title"],
                snippet=result["snippet"],
                url=result["url"]
            )
            for result in search_results
        ]
        
        return WebSearchResponse(
            success=True,
            query=query,
            results=web_results
        )
        
    except Exception as e:
        logger.error(f"Web search error: {str(e)}")
        return WebSearchResponse(
            success=False,
            query=body.get("query", "") if 'body' in locals() else "",
            results=[],
            error_message=str(e)
        )
