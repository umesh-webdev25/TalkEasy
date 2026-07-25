import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env.js';
import { globalErrorHandler, AppError } from 'shared';
import apiRoutes from './routes/api.routes.js';
import documentRoutes from './routes/document.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', apiRoutes);
app.use('/api/document', documentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Service is running' });
});

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

export default app;
