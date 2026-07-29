import express from 'express';
import { processImageEndpoint, generateImageEndpoint } from '../controllers/image.controller.js';
import { validateImageRequest } from '../validators/image.validator.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

router.post('/analyze', requireAuth, upload.single('file'), validateImageRequest, processImageEndpoint);
router.post('/generate', requireAuth, validateImageRequest, generateImageEndpoint);

export default router;
