import { logger } from 'shared';

class CacheService {
  constructor() {
    this.cache = new Map(); // In-memory store: key -> { value, expiresAt, isFragment }
  }

  generateKey(domain, identifier, locale = 'en') {
    const cleanLocale = (locale || 'en').toLowerCase().trim();
    const cleanIdentifier = String(identifier || '').toLowerCase().trim();
    return `${domain}:${cleanIdentifier}:${cleanLocale}`;
  }

  async get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const item = this.cache.get(key);
    if (item.expiresAt && Date.now() > item.expiresAt) {
      logger.info(`⌛ Cache EXPIRED for key: ${key}`);
      this.cache.delete(key);
      return null;
    }

    logger.info(`📦 Cache HIT for key: ${key}`);
    return item.value;
  }

  async set(key, value, ttlSeconds = 3600, options = {}) {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, {
      value,
      expiresAt,
      isFragment: Boolean(options.isFragment)
    });
    logger.info(`💾 Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
  }

  /**
   * Dynamic Hole Hydration: Takes a template fragment with {{PLACEHOLDER}} holes
   * and populates personalized user data per request.
   */
  hydrateHoles(template, holeData = {}) {
    if (typeof template !== 'string') return template;
    let hydrated = template;
    for (const [key, val] of Object.entries(holeData)) {
      const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      hydrated = hydrated.replace(placeholder, val !== undefined && val !== null ? val : '');
    }
    return hydrated;
  }

  /**
   * Retrieves a cached template fragment and hydrates its dynamic holes.
   */
  async getHydratedFragment(key, holeData = {}) {
    const cachedTemplate = await this.get(key);
    if (!cachedTemplate) return null;
    return this.hydrateHoles(cachedTemplate, holeData);
  }

  async delete(key) {
    this.cache.delete(key);
  }

  async clearDomain(domain) {
    const prefix = `${domain}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
    logger.info(`🧹 Cleared all cache entries for domain: ${domain}`);
  }
}

export const cacheService = new CacheService();

