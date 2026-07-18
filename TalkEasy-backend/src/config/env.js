import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('8000'),
  OAUTH_REDIRECT_URI: z.string().default('http://127.0.0.1:8000/auth/callback/google'),
  AGENT_PERSONA: z.string().default('default'),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().default('pNInz6obpgDQGcFmaJcg'),
  MONGODB_URL: z.string().optional(),
  MONGODB_DB_NAME: z.string().default('voiceAssistance'),
  MONGODB_SSL_ALLOW_INVALID_CERTIFICATES: z.string().default('false').transform(v => v.toLowerCase() === 'true'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  JWT_SECRET: z.string().default('supersecretjwtkey'),
  LOG_LEVEL: z.string().default('info'),
});

export const env = envSchema.parse(process.env);
