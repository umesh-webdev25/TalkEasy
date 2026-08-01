import { chatRepository } from '../repositories/chat.repository.js';
import { llmService } from './gemini.service.js';
import { eventBus } from './eventBus.service.js';
import { logger } from 'shared';

class TitleGeneratorService {
  /**
   * Generates a chat title in the background and emits an SSE event.
   * Do not await this function in the main HTTP request flow.
   */
  async generateTitleAsync(sessionId, userId, text) {
    try {
      const titlePrompt = `Generate a concise conversation title based on this first message. Maximum 3-6 words. No quotation marks. No emojis. No punctuation at the end. Return only the title.\n\nMessage: "${text}"`;
      
      const generatedTitle = await llmService.generateResponse(
        titlePrompt, 
        [], 
        "en", 
        "You are an AI assistant that only outputs concise conversation titles according to exact constraints."
      );

      if (generatedTitle) {
        // Clean up the title in case the LLM ignored instructions
        let cleanTitle = generatedTitle
          .replace(/^["']|["']$/g, '') // Remove quotes
          .replace(/[\.\!\?]+$/, '')   // Remove trailing punctuation
          // Basic emoji removal
          .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
          .trim();

        if (cleanTitle) {
          await chatRepository.updateSession(sessionId, { title: cleanTitle });
          logger.info(`📝 Generated new title for session ${sessionId}: "${cleanTitle}"`);
          
          // Emit event to notify SSE clients for this specific user
          eventBus.emit('chat_title_updated', {
            userId: userId,
            sessionId: sessionId,
            title: cleanTitle
          });
        }
      }
    } catch (titleErr) {
      logger.warn(`⚠️ Failed to generate dynamic title for session ${sessionId}: ${titleErr.message}`);
    }
  }
}

export const titleGeneratorService = new TitleGeneratorService();
