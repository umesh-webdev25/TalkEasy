import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { ChatSession } from '../models/chat.model.js';
import { ChatMessage } from '../models/ChatMessage.js';

const MONGODB_URL = process.env.MONGODB_URL;

async function migrateMessages() {
  if (!MONGODB_URL) {
    console.error("❌ MONGODB_URL is not defined in environment variables.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URL);
    console.log("✅ Connected to MongoDB.");

    console.log("⏳ Fetching chat sessions with embedded messages...");
    // Find sessions where 'messages' array exists and is not empty
    const sessions = await ChatSession.find({ 'messages.0': { $exists: true } });
    console.log(`Found ${sessions.length} sessions to migrate.`);

    let totalMigrated = 0;

    for (const session of sessions) {
      if (!session.messages || session.messages.length === 0) continue;

      const newMessages = session.messages.map(msg => ({
        sessionId: session._id,
        user_id: session.user_id || 'system',
        role: msg.role,
        content: msg.content,
        metadata: msg.metadata || {},
        createdAt: msg.timestamp || msg.created_at || new Date(),
      }));

      // Insert in bulk for this session
      await ChatMessage.insertMany(newMessages);
      
      // Update message_count on session to reflect accurately
      session.message_count = await ChatMessage.countDocuments({ sessionId: session._id });
      
      // Remove embedded messages to free up document space
      session.messages = undefined;
      await session.save();

      totalMigrated += newMessages.length;
      console.log(`Migrated ${newMessages.length} messages for session ${session.session_id}`);
    }

    console.log(`\n🎉 Migration Complete! Total messages migrated: ${totalMigrated}`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

migrateMessages();
