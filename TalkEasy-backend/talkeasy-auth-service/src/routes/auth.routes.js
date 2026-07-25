import express from 'express';
import passport from '../middleware/googleOAuth.middleware.js';
import { signup, login, logout, getMe, getAllUsers, getUserById, googleCallback } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.get('/users', requireAuth, getAllUsers);
router.get('/users/:user_id', requireAuth, getUserById);

// Google OAuth
router.get('/login/google', passport ? passport.authenticate('google', { scope: ['profile', 'email'] }) : (req, res) => res.status(501).json({ error: 'OAuth not configured' }));
router.get('/google/callback', passport ? passport.authenticate('google', { session: false }) : (req, res) => res.status(501).json({ error: 'OAuth not configured' }), googleCallback);

export default router;
