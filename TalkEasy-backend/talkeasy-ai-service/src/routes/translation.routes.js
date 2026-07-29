import express from 'express';
import { translateTextEndpoint } from '../controllers/translation.controller.js';
import { validateTranslationRequest } from '../validators/translation.validator.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/translate', requireAuth, validateTranslationRequest, translateTextEndpoint);

export default router;
