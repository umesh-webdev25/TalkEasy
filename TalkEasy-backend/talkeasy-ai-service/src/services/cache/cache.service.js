import { logger } from 'shared';

class CacheService {
    constructor() {
        this.cache = new Map(); // Fallback in-memory cache if Redis is unavailable
    }

    async get(key) {
        logger.info(`Cache GET: ${key}`);
        return this.cache.get(key);
    }

    async set(key, value, ttlSeconds = 3600) {
        logger.info(`Cache SET: ${key} (TTL: ${ttlSeconds})`);
        this.cache.set(key, value);
    }

    generateKey(domain, hash) {
        return `${domain}:${hash}`;
    }
}

export const cacheService = new CacheService();
