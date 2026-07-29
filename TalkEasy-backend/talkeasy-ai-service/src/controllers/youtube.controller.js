import { youtubeService } from '../services/youtube/youtube.service.js';
import { formatAIResponse } from '../utils/formatAIResponse.js';

export const summarizeYoutubeEndpoint = async (req, res, next) => {
    try {
        const { videoUrl } = req.validatedBody;
        const result = await youtubeService.summarize(videoUrl);
        const formatted = formatAIResponse(result.text, 'youtube', { usage: result.usage });
        return res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        next(error);
    }
};
