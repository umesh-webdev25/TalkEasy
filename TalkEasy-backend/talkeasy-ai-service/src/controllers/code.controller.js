import { codeService } from '../services/code/code.service.js';
import { formatAIResponse } from '../utils/formatAIResponse.js';
import { logger } from 'shared';

export const generateCodeEndpoint = async (req, res, next) => {
    try {
        const { prompt, options } = req.validatedBody;
        
        if (options?.stream) {
            return res.status(400).json({ success: false, error: "Streaming is supported via Socket.IO only." });
        }

        const result = await codeService.generateCode(prompt, { stream: false });
        const formatted = formatAIResponse(result.text, 'code', { usage: result.usage });
        
        return res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        next(error); // Route to global error handler
    }
};
