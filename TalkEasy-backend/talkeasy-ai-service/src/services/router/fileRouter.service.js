import { MIME_TYPES } from '../../constants/mimeTypes.js';
import { logger } from 'shared';

export const dispatchFile = async (file, prompt, options = {}) => {
    logger.info(`Routing file: ${file.filename} with mimeType: ${file.mimetype}`);
    
    if (file.mimetype.startsWith('image/')) {
        return { service: 'Vision', status: 'Routed' };
    } 
    else if (file.mimetype === MIME_TYPES.PDF) {
        return { service: 'PDF', status: 'Routed' };
    }
    else if (file.mimetype === MIME_TYPES.DOCX) {
        return { service: 'DOCX', status: 'Routed' };
    }
    else if (file.mimetype === MIME_TYPES.CSV) {
        return { service: 'CSV', status: 'Routed' };
    }
    else if (file.mimetype === MIME_TYPES.XLSX) {
        return { service: 'Excel', status: 'Routed' };
    }
    else if (file.mimetype.startsWith('audio/')) {
        return { service: 'Audio STT', status: 'Routed' };
    }
    
    throw new Error(`Unsupported file type: ${file.mimetype}`);
};
