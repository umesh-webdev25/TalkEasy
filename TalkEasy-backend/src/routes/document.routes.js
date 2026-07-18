import { Router } from 'express';
import { documentUploadMiddleware } from '../middleware/upload.middleware.js';
import { analyzeDocument } from '../controllers/document.controller.js';

const router = Router();

// POST /api/document/analyze
// Uses the Multer middleware to handle multipart/form-data and save the file temporarily.
router.post('/analyze', documentUploadMiddleware, analyzeDocument);

export default router;
