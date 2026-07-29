import { translationService } from '../services/translation/translation.service.js';
import { formatAIResponse } from '../utils/formatAIResponse.js';

export const translateTextEndpoint = async (req, res, next) => {
    try {
        const { text, targetLanguage } = req.validatedBody;
        const result = await translationService.translateText(text, targetLanguage);
        const formatted = formatAIResponse(result.text, 'translation', { usage: result.usage });
        return res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        next(error);
    }
};
