import { geminiProvider } from './gemini.service.js';
import { MODELS } from '../../config/models.config.js';
import { logger } from 'shared';

class AIOrchestrator {
    /**
     * Handles text/chat processing logic, bridging domain services with the Gemini Provider.
     */
    async processChatRequest(promptParts, options = {}) {
        const modelName = MODELS.CHAT;
        const configType = options.configType || 'default';
        
        if (options.stream) {
            return geminiProvider.generateContentStream(modelName, promptParts, configType);
        } else {
            return geminiProvider.generateContent(modelName, promptParts, configType);
        }
    }

    async processVisionRequest(promptParts, options = {}) {
        const modelName = MODELS.VISION;
        return geminiProvider.generateContent(modelName, promptParts, 'default');
    }

    async processCodeRequest(promptParts, options = {}) {
        const modelName = MODELS.CODE;
        if (options.stream) {
            return geminiProvider.generateContentStream(modelName, promptParts, 'code');
        } else {
            return geminiProvider.generateContent(modelName, promptParts, 'code');
        }
    }

    async processDocumentRequest(promptParts, options = {}) {
        const modelName = MODELS.CHAT; // Reusing chat model for doc analysis
        return geminiProvider.generateContent(modelName, promptParts, 'default');
    }
}

export const aiOrchestrator = new AIOrchestrator();
