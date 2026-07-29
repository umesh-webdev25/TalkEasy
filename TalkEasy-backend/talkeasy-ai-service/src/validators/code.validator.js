import { z } from 'zod';

export const validateCodeRequest = (req, res, next) => {
    const schema = z.object({
        prompt: z.string().min(1, "Prompt cannot be empty"),
        options: z.object({
            stream: z.boolean().optional()
        }).optional()
    });

    try {
        req.validatedBody = schema.parse(req.body);
        next();
    } catch (error) {
        return res.status(400).json({ success: false, error: "Validation failed", details: error.errors });
    }
};
