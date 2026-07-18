import { logger } from '../config/logger.js';

class CustomWebSearchService {
  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY;
    this.baseUrl = "https://api.tavily.com";
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    logger.info("🔍 Custom Web Search Service initialized");
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey !== "your_tavily_api_key_here");
  }

  async searchWeb(query, maxResults = 5) {
    if (!this.isConfigured()) {
      logger.warn("⚠️ Tavily API not configured");
      return [];
    }

    const cacheKey = `${query}_${maxResults}`;
    if (this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey);
      if (Date.now() - timestamp < this.cacheDuration) {
        logger.info(`📦 Using cached results for: ${query}`);
        return data;
      }
    }

    try {
      const payload = {
        query,
        max_results: maxResults,
        include_answer: false,
        include_images: false,
        include_raw_content: false
      };

      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.results || [];
        this.cache.set(cacheKey, { data: results, timestamp: Date.now() });
        logger.info(`✅ Web search completed for: ${query} (${results.length} results)`);
        return results;
      } else {
        const errorText = await response.text();
        logger.error(`Tavily API error ${response.status}: ${errorText}`);
        return [];
      }
    } catch (error) {
      logger.error(`Tavily search failed: ${error.message}`);
      return [];
    }
  }

  formatSearchResults(searchResults, query) {
    if (!searchResults || searchResults.length === 0) {
      return `No web search results found for: ${query}`;
    }

    let formatted = `WEB SEARCH RESULTS FOR: ${query}\n\n`;

    searchResults.slice(0, 3).forEach((result, i) => {
      const title = result.title || "No title";
      const url = result.url || "No URL";
      const content = result.content || "No content available";
      
      formatted += `RESULT ${i + 1}:\n`;
      formatted += `Title: ${title}\n`;
      formatted += `URL: ${url}\n`;
      formatted += `Content: ${content.substring(0, 500)}${content.length > 500 ? '...' : ''}\n\n`;
    });

    formatted += "Please use these search results to provide accurate information to the user.";
    return formatted;
  }
}

export const customWebSearchService = new CustomWebSearchService();
