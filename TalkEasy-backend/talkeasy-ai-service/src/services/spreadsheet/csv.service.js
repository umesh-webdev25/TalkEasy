import { aiOrchestrator } from '../ai/aiOrchestrator.service.js';
import { logger } from 'shared';

export const csvService = {
    async analyze(fileBuffer, promptText) {
        logger.info('Analyzing CSV');
        const text = fileBuffer.toString('utf-8');
        
        const promptParts = [
            { text: `CSV Data:\n${text}\n\nTask: ${promptText}` }
        ];
        return await aiOrchestrator.processDocumentRequest(promptParts);
    }
};
