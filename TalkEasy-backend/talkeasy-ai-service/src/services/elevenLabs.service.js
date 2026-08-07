import { ElevenLabsClient } from 'elevenlabs';
import { env } from '../config/env.js';
import { logger } from 'shared';
import { createCircuitBreaker } from '../utils/circuitBreaker.js';

class TTSService {
  constructor() {
    this.client = new ElevenLabsClient({ apiKey: env.ELEVENLABS_API_KEY });
    this.voiceId = env.ELEVENLABS_VOICE_ID;
    
    this.generateSpeechBreaker = createCircuitBreaker(
      async (text, format) => {
        const audioStream = await this.client.textToSpeech.convert(this.voiceId, {
          text,
          model_id: 'eleven_turbo_v2_5',
          output_format: format,
        });

        const chunks = [];
        for await (const chunk of audioStream) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      },
      { timeout: 15000 },
      () => {
        return null; // Fallback returns null to gracefully bypass audio if down
      }
    );
  }

  truncateText(text, maxChars = 3000) {
    if (text.length <= maxChars) return text;
    
    let truncated = text.substring(0, maxChars);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );
    
    if (lastSentenceEnd > maxChars * 0.7) {
      return truncated.substring(0, lastSentenceEnd + 1);
    } else {
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > 0) {
        return truncated.substring(0, lastSpace) + '...';
      }
      return truncated + '...';
    }
  }

  async generateSpeech(text, format = "mp3_44100_128") {
    try {
      const truncatedText = this.truncateText(text);
      
      const audioBuffer = await this.generateSpeechBreaker.fire(truncatedText, format);

      if (audioBuffer) {
        logger.info('TTS audio generated successfully');
      } else {
        logger.warn('TTS bypassed due to circuit breaker fallback');
      }
      
      return audioBuffer;
    } catch (error) {
      logger.error(`TTS generation error: ${error.message}`);
      throw error;
    }
  }
  
  async generateFallbackAudio(errorMessage) {
    try {
      return await this.generateSpeech(errorMessage);
    } catch (error) {
      logger.error(`Failed to generate fallback audio: ${error.message}`);
      return null;
    }
  }
}

export const ttsService = new TTSService();
