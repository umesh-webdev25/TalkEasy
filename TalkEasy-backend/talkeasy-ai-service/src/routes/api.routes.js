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
  toggleStar,
  subscribeToChatEvents
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
router.get('/chat/events', requireAuth, subscribeToChatEvents);
router.post('/chat/text/:session_id', requireAuth, chatWithAgentText);
router.post('/chat/voice/:session_id', requireAuth, upload.single('audio'), logUploadDebug, chatWithAgent);
router.get('/chat/history', requireAuth, getAllChatHistories);
router.get('/chat/history/:session_id', requireAuth, getChatHistory);
router.delete('/chat/history/:session_id', requireAuth, clearSessionHistory);
router.get('/chat/search', requireAuth, searchChatMessages);
router.put('/chat/star/:session_id', requireAuth, toggleStar);

// --- File Routes ---
router.post('/files/upload', requireAuth, upload.single('file'), logUploadDebug, uploadFile);
router.post('/files/analyze/:file_id', requireAuth, analyzeFile);

router.get('/files', requireAuth, getUserFilesEndpoint);
router.delete('/files/:file_id', requireAuth, deleteFileEndpoint);


// --- Persona & Search Routes ---
router.post('/persona/switch', switchPersona);
router.post('/search', searchWebEndpoint);

// --- Config Routes ---
router.post('/config/update', updateConfiguration);

export default router;
