import pino from 'pino';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { geminiService } from './gemini.service.js';
import { sessionService } from './session.service.js';
import { extractTextFromPdf } from '../utils/document.util.js';

const logger = pino({ name: 'document-service' });

class DocumentService {
  /**
   * Processes a document analysis request.
   * Handles new uploads and session reuse.
   */
  async processDocument({ file, prompt, sessionId }) {
    let session;
    let isNewSession = false;

    // Check if continuing an existing session
    if (sessionId) {
      session = sessionService.getSession(sessionId);
      if (!session && !file) {
        const error = new Error('Session not found or expired. Please upload the document again.');
        error.status = 404;
        throw error;
      }
    }

    // If no active session, or the session was invalid but a file was provided, create a new one
    if (!session || (file && !session)) {
      isNewSession = true;
      session = sessionService.createSession({
        documentId: uuidv4(),
        filename: file.originalname,
        mimeType: file.mimetype,
      });
    }

    let responseText;

    if (isNewSession && file) {
      logger.info({ sessionId: session.sessionId }, 'Processing new document upload');
      
      let textExtractionSuccess = false;

      // Primary Path: Try pdf-parse first if it's a PDF
      if (file.mimetype === 'application/pdf') {
        try {
          const { text, pageCount } = await extractTextFromPdf(file.path);
          
          if (text && text.trim() !== '') {
            logger.info('Successfully extracted text using pdf-parse');
            session.pageCount = pageCount;
            session.extractedText = text;
            sessionService.updateSession(session.sessionId, session);
            
            responseText = await geminiService.analyzeDocumentWithText(text, prompt);
            textExtractionSuccess = true;
          } else {
            logger.warn('pdf-parse returned empty text (likely a scanned PDF). Will fallback to Gemini File API.');
          }
        } catch (pdfParseError) {
          logger.warn({ err: pdfParseError }, 'pdf-parse threw an error. Will fallback to Gemini File API.');
        }
      }

      // Fallback Path: Google Gemini File API
      // If the file is not a PDF, or if pdf-parse failed/returned empty text, we upload the raw document.
      if (!textExtractionSuccess) {
        try {
          logger.info('Uploading original document to Gemini File API');
          const geminiFile = await geminiService.uploadFile(file.path, file.mimetype);
          
          session.geminiFileUri = geminiFile.uri;
          session.geminiFileName = geminiFile.name; // Used for cleanup
          sessionService.updateSession(session.sessionId, session);

          // Analyze using Gemini File API
          responseText = await geminiService.analyzeDocumentWithUri(session.geminiFileUri, prompt, file.mimetype);
        } catch (geminiError) {
          logger.error({ err: geminiError }, 'Gemini File API also failed.');
          throw new Error('Could not process the document. Both text extraction and Gemini File API analysis failed.');
        }
      }

      // Clean up temporary local file safely
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (cleanupErr) {
        logger.warn({ err: cleanupErr }, 'Failed to delete temporary local file');
      }
    } else {
      logger.info({ sessionId: session.sessionId }, 'Reusing document for new prompt');
      
      // Existing session reuse
      if (session.geminiFileUri) {
        responseText = await geminiService.analyzeDocumentWithUri(session.geminiFileUri, prompt, session.mimeType);
      } else if (session.extractedText) {
        // Fallback reuse
        responseText = await geminiService.analyzeDocumentWithText(session.extractedText, prompt);
      } else {
        const error = new Error('Invalid session state. No document reference found.');
        error.status = 500;
        throw error;
      }
    }

    return {
      documentId: session.documentId,
      sessionId: session.sessionId,
      filename: session.filename,
      mimeType: session.mimeType,
      pageCount: session.pageCount || null, // Populated from fallback if used
      uploadedAt: session.uploadedAt,
      response: responseText
    };
  }
}

export const documentService = new DocumentService();
