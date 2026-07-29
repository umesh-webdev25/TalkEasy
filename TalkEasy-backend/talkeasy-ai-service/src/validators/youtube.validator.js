import { z } from 'zod';

export const validateYoutubeRequest = (req, res, next) => {
    const schema = z.object({
        videoUrl: z.string().url("Must be a valid URL")
    });

    try {
        req.validatedBody = schema.parse(req.body);
        next();
    } catch (error) {
        return res.status(400).json({ success: false, error: "Validation failed", details: error.errors });
    }
};
