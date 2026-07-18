import { logger } from '../config/logger.js';
import { llmService } from '../services/gemini.service.js';
import { customWebSearchService } from '../services/webSearch.service.js';

export const switchPersona = async (req, res) => {
  try {
    const { persona } = req.body;
    if (!persona) return res.status(400).json({ detail: "Persona not provided" });

    llmService.setPersona(persona);
    return res.json({ success: true, message: `Persona switched to ${persona}`, persona });
  } catch (error) {
    logger.error(`Error switching persona: ${error.message}`);
    return res.status(500).json({ detail: `Failed to switch persona: ${error.message}` });
  }
};

export const searchWebEndpoint = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.json({ success: false, query, results: [], error_message: "Search query cannot be empty" });
    }

    if (!customWebSearchService.isConfigured()) {
      return res.json({ success: false, query, results: [], error_message: "Web search service is not available. Please check Tavily API key." });
    }

    const searchResults = await customWebSearchService.searchWeb(query, 3);
    const results = searchResults.map(r => ({ title: r.title, snippet: r.content || r.snippet, url: r.url }));
    
    return res.json({ success: true, query, results });
  } catch (error) {
    logger.error(`Web search error: ${error.message}`);
    return res.json({ success: false, query: req.body.query || "", results: [], error_message: error.message });
  }
};
