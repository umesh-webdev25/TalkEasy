import express from 'express';
import codeRoutes from './code.routes.js';
import imageRoutes from './image.routes.js';
import youtubeRoutes from './youtube.routes.js';
import translationRoutes from './translation.routes.js';

const router = express.Router();

router.use('/code', codeRoutes);
router.use('/image', imageRoutes);
router.use('/youtube', youtubeRoutes);
router.use('/translation', translationRoutes);

export default router;
