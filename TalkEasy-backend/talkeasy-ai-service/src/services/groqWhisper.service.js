import { Groq } from 'groq-sdk';
import fs from 'fs';
import { env } from '../config/env.js';
import { logger } from 'shared';
import os from 'os';
import path from 'path';

class STTService {
  constructor() {
    this.groq = new Groq({ apiKey: env.GROQ_API_KEY });
  }

  async transcribeAudio(audioInput) {
    let tmpPath = null;
    let readPath = null;
    try {
      if (!env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not set in environment variables.");
      }

      if (typeof audioInput === 'string') {
        if (!fs.existsSync(audioInput)) {
          throw new Error(`Audio file not found at path: ${audioInput}`);
        }
        readPath = audioInput;
      } else {
        tmpPath = path.join(os.tmpdir(), `audio-${Date.now()}.wav`);
        fs.writeFileSync(tmpPath, audioInput);
        readPath = tmpPath;
      }
      
      const stat = fs.statSync(readPath);
      logger.info(`🎙️ Sending audio file (${readPath}, ${stat.size} bytes) to Groq Whisper`);
      
      const transcription = await this.groq.audio.transcriptions.create({
        file: fs.createReadStream(readPath),
        model: 'whisper-large-v3',
      });
      
      const text = transcription.text?.trim();
      if (!text) {
        logger.warn('⚠️ No speech detected in audio file by Whisper');
        return "I could not detect any audible speech in the audio.";
      }
      logger.info(`✅ Successfully transcribed audio: "${text.substring(0, 100)}..."`);
      return text;
    } catch (error) {
      logger.error(`❌ STT transcription error in Groq Whisper: ${error.message}`);
      throw new Error(`Speech-to-Text transcription failed: ${error.message}`);
    } finally {
      if (tmpPath && fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    }
  }
}

export const sttService = new STTService();

