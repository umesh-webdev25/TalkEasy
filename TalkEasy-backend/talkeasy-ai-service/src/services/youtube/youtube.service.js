import { aiOrchestrator } from '../ai/aiOrchestrator.service.js';
import { cacheService } from '../cache/cache.service.js';
import { logger } from 'shared';

export const youtubeService = {
    async summarize(videoUrl) {
        const cacheKey = cacheService.generateKey('youtube', videoUrl);
        const cachedResult = await cacheService.get(cacheKey);
        if (cachedResult) return cachedResult;

        logger.info(`Summarizing YouTube video: ${videoUrl}`);
        const transcript = "Transcript of the video placeholder...";
        
        const promptParts = [{ text: `Summarize this YouTube video transcript:\n${transcript}` }];
        const result = await aiOrchestrator.processDocumentRequest(promptParts);
        
        await cacheService.set(cacheKey, result);
        return result;
    }
};
