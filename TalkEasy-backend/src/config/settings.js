import { env } from './env.js';

export const getInitialConfig = () => ({
  personas: ["default", "pirate", "developer", "cowboy", "robot"],
  selected_persona: env.AGENT_PERSONA,
  gemini_api_key: env.GEMINI_API_KEY,
  groq_api_key: env.GROQ_API_KEY,
  elevenlabs_api_key: env.ELEVENLABS_API_KEY,
  elevenlabs_voice_id: env.ELEVENLABS_VOICE_ID,
  mongodb_url: env.MONGODB_URL
});
