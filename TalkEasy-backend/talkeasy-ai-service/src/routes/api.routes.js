import express from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';
import upload, { logUploadDebug } from '../middleware/upload.middleware.js';

import {
  chatWithAgentText,
  chatWithAgent,
  getChatHistory,
  getAllChatHistories,
  clearSessionHistory,
  searchChatMessages,
  toggleStar
} from '../controllers/chat.controller.js';

import {
  uploadFile,
  analyzeFile,
  getUserFilesEndpoint,
  deleteFileEndpoint
} from '../controllers/file.controller.js';

import {
  switchPersona,
  searchWebEndpoint
} from '../controllers/persona.controller.js';

import {
  updateConfiguration
} from '../controllers/config.controller.js';

const router = express.Router();

// --- Chat Routes ---
router.post('/chat/text/:session_id', optionalAuth, chatWithAgentText);
router.post('/chat/voice/:session_id', optionalAuth, upload.single('audio'), logUploadDebug, chatWithAgent);
router.get('/chat/history', optionalAuth, getAllChatHistories);
router.get('/chat/history/:session_id', optionalAuth, getChatHistory);
router.delete('/chat/history/:session_id', optionalAuth, clearSessionHistory);
router.get('/chat/search', optionalAuth, searchChatMessages);
router.put('/chat/star/:session_id', optionalAuth, toggleStar);

// --- File Routes ---
router.post('/files/upload', optionalAuth, upload.single('file'), logUploadDebug, uploadFile);
router.post('/files/analyze/:file_id', optionalAuth, analyzeFile);

router.get('/files', optionalAuth, getUserFilesEndpoint);
router.delete('/files/:file_id', optionalAuth, deleteFileEndpoint);


// --- Persona & Search Routes ---
router.post('/persona/switch', switchPersona);
router.post('/search', searchWebEndpoint);

// --- Config Routes ---
router.post('/config/update', updateConfiguration);

export default router;
