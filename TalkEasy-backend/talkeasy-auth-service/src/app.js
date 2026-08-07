import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import passport from 'passport';
import { env } from './config/env.js';
import { globalErrorHandler, AppError } from 'shared';
import authRoutes from './routes/auth.routes.js';
import './middleware/googleOAuth.middleware.js';

const app = express();

app.use(helmet());
app.use(compression({
  threshold: 1024, // 1KB threshold
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false; // Don't compress responses with this header
    }
    // Avoid double-compressing already-compressed payloads
    if (res.getHeader('Content-Encoding')) {
      return false;
    }
    // Fallback to standard compression filter (checks for compressible text/json content types)
    return compression.filter(req, res);
  }
}));
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// API Gateway routes requests to /api/auth here
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Auth Service is running' });
});

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

export default app;
