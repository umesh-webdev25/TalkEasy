import Parser from 'rss-parser';
import { logger } from '../config/logger.js';

class NewsService {
  constructor() {
    this.parser = new Parser();
    logger.info("📰 News Service initialized (using free RSS feeds)");
  }

  async getNewsHeadlines(category = "general") {
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

      logger.info(`News data retrieved for category ${category}: ${articles.length} articles`);
      
      return {
        status: "ok",
        totalResults: articles.length,
        articles
      };
    } catch (error) {
      logger.error(`Error fetching news data: ${error.message}`);
      return { error: "Could not fetch news data.", status: "error" };
    }
  }
}

export const newsService = new NewsService();
