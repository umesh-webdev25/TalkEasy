import { logger } from 'shared';

export const handleAIError = (error, res = null) => {
    logger.error(`AI Error: ${error.message}`, error);

    let statusCode = 500;
    let message = 'An unexpected error occurred during AI processing.';
    
    if (error.message.includes('Quota exceeded') || error.message.includes('429')) {
        statusCode = 429;
        message = 'Rate limit exceeded. Please try again later.';
    } else if (error.message.includes('invalid argument') || error.message.includes('400')) {
        statusCode = 400;
        message = 'Invalid input provided to the AI service.';
    } else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        statusCode = 504;
        message = 'The AI service timed out. Please try again.';
    } else if (error.message.includes('blocked by safety settings')) {
        statusCode = 400;
        message = 'The prompt or generated content was blocked by safety settings.';
    }

    const response = {
        success: false,
        error: message,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };

    if (res) {
        return res.status(statusCode).json(response);
    }
    
    return { statusCode, ...response };
};
