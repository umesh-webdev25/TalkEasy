import pdfParse from 'pdf-parse';
import { aiOrchestrator } from '../ai/aiOrchestrator.service.js';
import { logger } from 'shared';

export const pdfService = {
    async extractText(fileBuffer) {
        try {
            const data = await pdfParse(fileBuffer);
            return data.text;
        } catch (error) {
            logger.error(`PDF extraction failed: ${error.message}`);
            throw error;
        }
    },
    
    async analyze(fileBuffer, promptText) {
        const text = await this.extractText(fileBuffer);
        const promptParts = [
            { text: `Document content:\n${text}\n\nTask: ${promptText}` }
        ];
        return await aiOrchestrator.processDocumentRequest(promptParts);
    }
};
