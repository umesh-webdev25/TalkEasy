import { ChatSession } from '../models/chat.model.js';

class ChatRepository {
  async findBySessionId(sessionId) {
    return await ChatSession.findOne({ session_id: sessionId });
  }

  async findByUserId(userId) {
    return await ChatSession.find(userId ? { user_id: userId } : {}).sort({ last_activity: -1 });
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

  async searchMessages(matchConditions, query) {
    const pipeline = [
      { $match: matchConditions },
      { $unwind: "$messages" },
      { $match: { "messages.content": { $regex: query, $options: "i" } } },
      { $project: { _id: 0, session_id: 1, message: "$messages", created_at: 1 } },
      { $sort: { "message.timestamp": -1 } },
      { $limit: 50 }
    ];
    return await ChatSession.aggregate(pipeline);
  }
}

export const chatRepository = new ChatRepository();
