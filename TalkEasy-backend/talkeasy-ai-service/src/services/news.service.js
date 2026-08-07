import Parser from 'rss-parser';
import { logger } from 'shared';
import { cacheService } from './cache/cache.service.js';

class NewsService {
  constructor() {
    this.parser = new Parser();
    this.ttlSeconds = 15 * 60; // 15 minutes TTL
    this.warmIntervalMs = 15 * 60 * 1000;
    this.timer = null;
    logger.info("📰 News Service initialized (with RSS fragment caching & background scheduled warming)");
    this.startScheduledBackgroundWarming();
  }

  startScheduledBackgroundWarming() {
    if (this.timer) return;
    // Initial warm in background after 5s
    setTimeout(() => {
      this.warmCache().catch(err => logger.error(`Background news warming error: ${err.message}`));
    }, 5000);

    // Schedule recurring warming every 15 minutes
    this.timer = setInterval(() => {
      this.warmCache().catch(err => logger.error(`Scheduled news warming error: ${err.message}`));
    }, this.warmIntervalMs);
  }

  stopScheduledWarming() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async warmCache() {
    logger.info("🔥 Running scheduled background warming for popular news categories...");
    const categories = ["general", "technology", "business", "sports", "science"];
    for (const cat of categories) {
      await this.getNewsHeadlines(cat, "en", true);
    }
  }

  async getNewsHeadlines(category = "general", locale = "en", forceRefresh = false) {
    const cacheKey = cacheService.generateKey('news', category, locale);

    if (!forceRefresh) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logger.info(`⚡ Serving cached news headlines for category '${category}' (${locale})`);
        return cached;
      }
    }

    try {
      const rssFeeds = {
        "general": "https://feeds.bbci.co.uk/news/rss.xml",
        "technology": "https://feeds.bbci.co.uk/news/technology/rss.xml",
        "business": "https://feeds.bbci.co.uk/news/business/rss.xml",
        "sports": "https://feeds.bbci.co.uk/news/sport/rss.xml",
        "entertainment": "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
        "health": "https://feeds.bbci.co.uk/news/health/rss.xml",
        "science": "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml"
      };

      const rssUrl = rssFeeds[category] || rssFeeds["general"];
      const feed = await this.parser.parseURL(rssUrl);
      
      const articles = feed.items.slice(0, 10).map(entry => ({
        title: entry.title || "No title",
        url: entry.link || "",
        description: entry.contentSnippet || entry.content || "No description",
        publishedAt: entry.pubDate || "",
        source: { name: "BBC News" }
      }));

      const newsResult = {
        status: "ok",
        totalResults: articles.length,
        category,
        locale,
        fetchedAt: new Date().toISOString(),
        articles
      };

      await cacheService.set(cacheKey, newsResult, this.ttlSeconds);
      logger.info(`News data retrieved and cached for category '${category}' (${locale}): ${articles.length} articles`);
      
      return newsResult;
    } catch (error) {
      logger.error(`Error fetching news data for '${category}': ${error.message}`);
      // Return stale cache if available on error
      const stale = await cacheService.get(cacheKey);
      if (stale) return stale;
      return { error: "Could not fetch news data.", status: "error" };
    }
  }
}

export const newsService = new NewsService();

