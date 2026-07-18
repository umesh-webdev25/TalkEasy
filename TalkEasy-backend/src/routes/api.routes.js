import express from 'express';
import multer from 'multer';
import passport from 'passport';

import { signup, login, logout, getMe, getAllUsers, getUserById, googleCallback } from '../controllers/auth.controller.js';
import { getChatHistory, getAllChatHistories, toggleStar, clearSessionHistory, searchChatMessages, chatWithAgentText, chatWithAgent } from '../controllers/chat.controller.js';
import { updateConfiguration } from '../controllers/config.controller.js';
import { switchPersona, searchWebEndpoint } from '../controllers/persona.controller.js';
import { uploadFile, analyzeFile, getUserFilesEndpoint, deleteFileEndpoint } from '../controllers/file.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Temp upload directory

// --- Auth Routes ---
router.post('/auth/signup', signup);
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.get('/auth/me', requireAuth, getMe);
router.get('/auth/users', requireAuth, getAllUsers);
router.get('/auth/users/:user_id', requireAuth, getUserById);

// Google OAuth
router.get('/auth/login/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { session: false }), googleCallback);

// --- Chat Routes ---
router.get('/agent/chat/all', requireAuth, getAllChatHistories);
router.get('/agent/chat/:session_id/history', getChatHistory);
router.post('/agent/chat/:session_id/star', toggleStar);
router.delete('/agent/chat/:session_id/history', clearSessionHistory);
router.get('/agent/chat/search', searchChatMessages);
router.post('/agent/chat/:session_id/text', optionalAuth, chatWithAgentText);
router.post('/agent/chat/:session_id/voice', optionalAuth, upload.single('audio'), chatWithAgent);

// --- File Routes ---
router.post('/agent/files/upload', optionalAuth, upload.single('file'), uploadFile);
router.post('/agent/files/:file_id/analyze', optionalAuth, analyzeFile);
router.get('/agent/files/all', requireAuth, getUserFilesEndpoint);
router.delete('/agent/files/:file_id', requireAuth, deleteFileEndpoint);

import documentRoutes from './document.routes.js';

router.use('/api/document', documentRoutes);

// --- Config & Persona Routes ---
router.post('/config/update', updateConfiguration);
router.post('/api/persona/switch', switchPersona);
router.post('/api/persona/search_web', searchWebEndpoint);

// Export router
export default router;
