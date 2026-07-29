import { imageVisionService } from '../services/vision/imageVision.service.js';
import { imageGenerationService } from '../services/vision/imageGeneration.service.js';
import { formatAIResponse } from '../utils/formatAIResponse.js';

export const processImageEndpoint = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: "No image file provided." });
        const prompt = req.validatedBody?.prompt || "Describe this image in detail.";
        
        const result = await imageVisionService.analyze(req.file.buffer, req.file.mimetype, prompt, "checksum-placeholder");
        const formatted = formatAIResponse(result.text, 'vision', { usage: result.usage });
        return res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        next(error);
    }
};

export const generateImageEndpoint = async (req, res, next) => {
    try {
        const { prompt } = req.validatedBody;
        if (!prompt) return res.status(400).json({ success: false, error: "Prompt is required." });
        
        const result = await imageGenerationService.generate(prompt);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};
