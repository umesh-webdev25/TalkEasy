import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  OAUTH_REDIRECT_URI: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  MONGODB_URL: z.string().optional(),
  MONGODB_DB_NAME: z.string().default('talkeasy'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  JWT_SECRET: z.string(),
  LOG_LEVEL: z.string().default('info'),
});

export const env = envSchema.parse(process.env);
