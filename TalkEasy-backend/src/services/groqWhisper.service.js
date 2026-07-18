import { Groq } from 'groq-sdk';
import fs from 'fs';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import os from 'os';
import path from 'path';

class STTService {
  constructor() {
    this.groq = new Groq({ apiKey: env.GROQ_API_KEY });
  }

  async transcribeAudio(audioBuffer) {
    let tmpPath = null;
    try {
      tmpPath = path.join(os.tmpdir(), `audio-${Date.now()}.wav`);
      fs.writeFileSync(tmpPath, audioBuffer);
      
      const transcription = await this.groq.audio.transcriptions.create({
        file: fs.createReadStream(tmpPath),
        model: 'whisper-large-v3',
      });
      
      const text = transcription.text?.trim();
      if (!text) {
        logger.warn('No speech detected in audio');
        return null;
      }
      logger.info(`Successfully transcribed: ${text.substring(0, 100)}...`);
      return text;
    } catch (error) {
      logger.error(`STT transcription error: ${error.message}`);
      throw error;
    } finally {
      if (tmpPath && fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    }
  }
}

export const sttService = new STTService();
