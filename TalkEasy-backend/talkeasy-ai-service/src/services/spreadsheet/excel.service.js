import { aiOrchestrator } from '../ai/aiOrchestrator.service.js';
import { logger } from 'shared';

export const excelService = {
    async analyze(fileBuffer, promptText) {
        logger.info('Analyzing Excel');
        const text = "Extracted Excel Data Placeholder...";
        
        const promptParts = [
            { text: `Excel Data:\n${text}\n\nTask: ${promptText}` }
        ];
        return await aiOrchestrator.processDocumentRequest(promptParts);
    }
};
