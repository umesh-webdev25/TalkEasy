import mammoth from 'mammoth';
import { aiOrchestrator } from '../ai/aiOrchestrator.service.js';
import { logger } from 'shared';

export const docxService = {
    async extractText(fileBuffer) {
        try {
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            return result.value;
        } catch (error) {
            logger.error(`DOCX extraction failed: ${error.message}`);
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
