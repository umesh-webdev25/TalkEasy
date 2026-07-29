import { aiOrchestrator } from '../ai/aiOrchestrator.service.js';
import { buildVisionPrompt } from '../../prompts/vision.prompt.js';
import { cacheService } from '../cache/cache.service.js';
import { logger } from 'shared';

export const imageVisionService = {
    async analyze(imageBuffer, mimeType, promptText, fileChecksum) {
        const cacheKey = cacheService.generateKey('vision', fileChecksum + '-' + promptText);
        const cachedResult = await cacheService.get(cacheKey);
        if (cachedResult) return cachedResult;

        logger.info(`Analyzing image with mimeType: ${mimeType}`);
        const imageParts = [{
            inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType
            }
        }];
        
        const promptParts = buildVisionPrompt(promptText, imageParts);
        const result = await aiOrchestrator.processVisionRequest(promptParts);
        
        await cacheService.set(cacheKey, result);
        return result;
    }
};
