import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string(),
  OAUTH_REDIRECT_URI: z.string(),
  FRONTEND_URL: z.string(),
  AGENT_PERSONA: z.string(),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string(),
  MONGODB_URL: z.string().optional(),
  MONGODB_DB_NAME: z.string(),
  MONGODB_SSL_ALLOW_INVALID_CERTIFICATES: z.string().optional().transform(v => v ? v.toLowerCase() === 'true' : false),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  JWT_SECRET: z.string(),
  LOG_LEVEL: z.string(),
});

export const env = envSchema.parse(process.env);
