import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import apiRoutes from './routes/api.routes.js';
import './middleware/googleOAuth.middleware.js';

const app = express();

app.use(cors({
  origin: env.FRONTEND_URL, // Use frontend URL from env
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Setup API routes
app.use('/', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'TalkEasy Backend API is running' });
});

export default app;
