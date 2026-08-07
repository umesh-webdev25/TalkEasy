import { logger } from 'shared';
import { cacheService } from './cache/cache.service.js';

class CustomWebSearchService {
  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY;
    this.baseUrl = "https://api.tavily.com";
    this.ttlSeconds = 15 * 60; // 15 minutes TTL
    logger.info("🔍 Custom Web Search Service initialized (with fragment caching & locale support)");
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey !== "your_tavily_api_key_here");
  }

  async searchWeb(query, maxResults = 5, locale = 'en') {
    if (!this.isConfigured()) {
      logger.warn("⚠️ Tavily API not configured");
      return [];
    }

    const cacheKey = cacheService.generateKey('search', `${query}_${maxResults}`, locale);
    const cachedResults = await cacheService.get(cacheKey);
    if (cachedResults) {
      logger.info(`📦 Using cached web search results for: ${query} (${locale})`);
      return cachedResults;
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
        await cacheService.set(cacheKey, results, this.ttlSeconds);
        logger.info(`✅ Web search completed and cached for: ${query} (${results.length} results)`);
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

  formatSearchResults(searchResults, query, locale = 'en') {
    if (!searchResults || searchResults.length === 0) {
      return `No web search results found for: ${query}`;
    }

    const fragmentKey = cacheService.generateKey('search_fragment', query, locale);
    let cachedFragment = cacheService.cache.get(fragmentKey)?.value;

    if (!cachedFragment) {
      let formatted = `WEB SEARCH RESULTS FOR: {{QUERY_LABEL}}\n\n`;

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
      cachedFragment = formatted;
      cacheService.set(fragmentKey, formatted, this.ttlSeconds, { isFragment: true });
    }

    return cacheService.hydrateHoles(cachedFragment, { QUERY_LABEL: query });
  }
}

export const customWebSearchService = new CustomWebSearchService();

