import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { env } from '../../config/env.js';
import { GEMINI_CONFIG, SAFETY_SETTINGS } from '../../config/gemini.config.js';
import { handleAIError } from '../../utils/aiErrorHandler.js';
import { logger } from 'shared';

class GeminiProvider {
    constructor() {
        this.apiKey = env.GEMINI_API_KEY;
        if (!this.apiKey) {
            logger.error("GEMINI_API_KEY is missing in environment variables");
        }
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.fileManager = new GoogleAIFileManager(this.apiKey);
    }

    getModel(modelName, configType = 'default') {
        const config = GEMINI_CONFIG[configType] || GEMINI_CONFIG.default;
        return this.genAI.getGenerativeModel({
            model: modelName,
            safetySettings: SAFETY_SETTINGS,
            generationConfig: {
                temperature: config.temperature,
                topP: config.topP,
                topK: config.topK,
                maxOutputTokens: config.maxOutputTokens
            }
        });
    }

    async generateContent(modelName, parts, configType = 'default') {
        const startTime = Date.now();
        try {
            const model = this.getModel(modelName, configType);
            const result = await model.generateContent(parts);
            
            logger.info(`Gemini API call successful in ${Date.now() - startTime}ms`);
            return {
                text: result.response.text(),
                usage: result.response.usageMetadata
            };
        } catch (error) {
            throw handleAIError(error);
        }
    }

    async *generateContentStream(modelName, parts, configType = 'default') {
        try {
            const model = this.getModel(modelName, configType);
            const result = await model.generateContentStream(parts);
            for await (const chunk of result.stream) {
                yield chunk.text();
            }
        } catch (error) {
            throw handleAIError(error);
        }
    }
}

export const geminiProvider = new GeminiProvider();
