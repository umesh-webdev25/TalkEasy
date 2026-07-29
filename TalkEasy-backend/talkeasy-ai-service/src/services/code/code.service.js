import { aiOrchestrator } from '../ai/aiOrchestrator.service.js';
import { logger } from 'shared';

export const codeService = {
    async generateCode(promptText, options = { stream: true }) {
        logger.info(`Generating code for prompt: ${promptText}`);
        const promptParts = [{ text: `You are an expert AI coding assistant.\n\nUser request: ${promptText}` }];
        return await aiOrchestrator.processCodeRequest(promptParts, options);
    }
};
