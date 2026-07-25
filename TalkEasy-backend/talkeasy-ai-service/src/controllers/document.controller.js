import { documentService } from '../services/document.service.js';
import { z } from 'zod';
import pino from 'pino';

// Initialize logger
const logger = pino({
  name: 'document-controller',
});

// Zod schema for request body validation
const analyzeRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  sessionId: z.string().optional(),
});

/**
 * Controller for handling POST /api/document/analyze
 */
export const analyzeDocument = async (req, res) => {
  try {
    // 1. Validate the body parameters using Zod
    const validationResult = analyzeRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: validationResult.error.errors[0].message
      });
    }

    const { prompt, sessionId } = validationResult.data;
    const file = req.file;

    // 2. Logical validation: If this is a new session, a file must be uploaded.
    if (!sessionId && !file) {
      return res.status(400).json({
        success: false,
        error: "A file must be uploaded for a new session."
      });
    }

    logger.info({ sessionId, hasFile: !!file }, "Received document analysis request");

    // 3. Delegate core business logic to the service layer
    const result = await documentService.processDocument({
      file,
      prompt,
      sessionId
    });

    // 4. Return successful response
    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    logger.error({ err: error }, "Error occurred during document analysis");
    
    // Respect status codes thrown by the service layer, default to 500
    const statusCode = error.status || 500;
    const message = error.message || "An unexpected error occurred during document analysis.";
    
    return res.status(statusCode).json({
      success: false,
      error: message
    });
  }
};
