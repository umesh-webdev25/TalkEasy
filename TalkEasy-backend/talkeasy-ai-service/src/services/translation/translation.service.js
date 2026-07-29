import { aiOrchestrator } from '../ai/aiOrchestrator.service.js';
import { cacheService } from '../cache/cache.service.js';
import { logger } from 'shared';

export const translationService = {
    async translateText(text, targetLanguage) {
        const cacheKey = cacheService.generateKey('translation', `${targetLanguage}:${text.substring(0, 50)}`);
        const cachedResult = await cacheService.get(cacheKey);
        if (cachedResult) return cachedResult;

        logger.info(`Translating text to ${targetLanguage}`);
        const promptParts = [{ text: `Translate the following text to ${targetLanguage}. Maintain the original formatting.\n\n${text}` }];
        
        const result = await aiOrchestrator.processChatRequest(promptParts);
        
        await cacheService.set(cacheKey, result);
        return result;
    }
};
