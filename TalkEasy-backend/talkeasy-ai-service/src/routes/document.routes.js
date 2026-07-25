import express from 'express';
import { analyzeDocument } from '../controllers/document.controller.js';
import upload from '../middleware/upload.middleware.js';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Use optionalAuth so that unauthenticated users can analyze without saving history if we allow it, 
// or requireAuth if we want to restrict it. For now matching existing behavior which had authenticateJWT optionally or globally.
router.post('/analyze', optionalAuth, upload.single('document'), analyzeDocument);

export default router;
