import { z } from 'zod';

export const validateTranslationRequest = (req, res, next) => {
    const schema = z.object({
        text: z.string().min(1, "Text to translate cannot be empty"),
        targetLanguage: z.string().min(2, "Language code must be provided")
    });

    try {
        req.validatedBody = schema.parse(req.body);
        next();
    } catch (error) {
        return res.status(400).json({ success: false, error: "Validation failed", details: error.errors });
    }
};
