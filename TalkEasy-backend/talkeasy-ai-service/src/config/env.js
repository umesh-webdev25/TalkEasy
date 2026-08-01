import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3002"),
  FRONTEND_URL: z.string().optional(),
  MONGODB_URL: z.string().optional(),
  MONGODB_DB_NAME: z.string().default("talkeasy"),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  SERPER_API_KEY: z.string().optional(),
  JWT_SECRET: z.string(),
  LOG_LEVEL: z.string().default("info"),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  HF_TOKEN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
