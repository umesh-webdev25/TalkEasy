import express from 'express';
import { summarizeYoutubeEndpoint } from '../controllers/youtube.controller.js';
import { validateYoutubeRequest } from '../validators/youtube.validator.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/summarize', requireAuth, validateYoutubeRequest, summarizeYoutubeEndpoint);

export default router;
