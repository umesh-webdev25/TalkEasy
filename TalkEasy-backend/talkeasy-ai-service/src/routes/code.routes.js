import express from 'express';
import { generateCodeEndpoint } from '../controllers/code.controller.js';
import { validateCodeRequest } from '../validators/code.validator.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/generate', requireAuth, validateCodeRequest, generateCodeEndpoint);

export default router;
