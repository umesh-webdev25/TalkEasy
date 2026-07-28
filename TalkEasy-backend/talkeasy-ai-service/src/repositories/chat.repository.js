import { ChatSession } from '../models/chat.model.js';

class ChatRepository {
  async findBySessionId(sessionId) {
    return await ChatSession.findOne({ session_id: sessionId });
  }

  async findByUserId(userId) {
    return await ChatSession.find({ user_id: userId }).sort({ last_activity: -1 });
  }

  async getUserSessions(userId) {
    return this.findByUserId(userId);
  }

  async createSession(sessionData) {
    const session = new ChatSession(sessionData);
    await session.save();
    return session;
  }

  async updateSession(sessionId, updateData) {
    return await ChatSession.updateOne({ session_id: sessionId }, updateData);
  }

  async deleteSession(sessionId) {
    return await ChatSession.deleteOne({ session_id: sessionId });
  }

  async saveSession(session) {
    return await session.save();
  }

}

export const chatRepository = new ChatRepository();
