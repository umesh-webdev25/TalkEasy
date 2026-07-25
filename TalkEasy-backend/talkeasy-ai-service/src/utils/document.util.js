import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import pino from 'pino';

const logger = pino({ name: 'document-util' });

/**
 * Extracts text, page count, and metadata from a PDF file.
 * This acts as a fallback mechanism if the Gemini File API fails to process the document.
 * 
 * @param {string} filePath - Absolute path to the local PDF file
 * @returns {Promise<{text: string, pageCount: number, metadata: object}>}
 */
export const extractTextFromPdf = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    
    // pdf-parse processes the buffer and returns extracted data
    const data = await pdfParse(dataBuffer);
    
    logger.info({ 
      filePath, 
      pageCount: data.numpages 
    }, 'Successfully extracted text from PDF using fallback');

    return {
      text: data.text,
      pageCount: data.numpages,
      metadata: data.info
    };
  } catch (error) {
    logger.error({ err: error, filePath }, 'Failed to extract text using pdf-parse fallback');
    throw error;
  }
};
