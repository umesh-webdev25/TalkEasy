import { ChatMessage } from '../models/ChatMessage.js';

class MessageRepository {
  /**
   * Creates a new chat message
   */
  async createMessage(messageData) {
    const message = new ChatMessage(messageData);
    await message.save();
    return message;
  }

  /**
   * Retrieves messages for a session with pagination
   * @param {string|ObjectId} sessionId - The session ID
   * @param {number} limit - Number of messages to retrieve
   * @param {number} skip - Number of messages to skip
   */
  async getMessagesBySession(sessionId, limit = 50, skip = 0) {
    return await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);
  }

  /**
   * Retrieves the most recent messages for LLM context (e.g. last 20)
   */
  async getRecentMessages(sessionId, limit = 20) {
    // Sort descending to get latest, then reverse to chronological order
    const messages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(limit);
    return messages.reverse();
  }

  /**
   * Search messages by text within a session or globally for a user
   */
  async searchMessages(matchConditions, query) {
    return await ChatMessage.find({
      ...matchConditions,
      content: { $regex: query, $options: 'i' }
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('sessionId', 'session_id title'); // Optional: grab session details
  }

  /**
   * Delete all messages for a specific session
   */
  async deleteMessagesBySession(sessionId) {
    return await ChatMessage.deleteMany({ sessionId });
  }
}

export const messageRepository = new MessageRepository();
