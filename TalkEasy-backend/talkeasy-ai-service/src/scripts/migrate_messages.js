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
    const allMessagesToInsert = [];
    const sessionUpdates = [];

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

      allMessagesToInsert.push(...newMessages);
      
      sessionUpdates.push({
        updateOne: {
          filter: { _id: session._id },
          update: {
            $unset: { messages: 1 },
            $inc: { message_count: newMessages.length }
          }
        }
      });

      totalMigrated += newMessages.length;
    }

    console.log(`Prepared ${allMessagesToInsert.length} messages and ${sessionUpdates.length} session updates. Processing in chunks...`);

    const CHUNK_SIZE = 5000;
    
    // Process messages in chunks
    for (let i = 0; i < allMessagesToInsert.length; i += CHUNK_SIZE) {
      const messageChunk = allMessagesToInsert.slice(i, i + CHUNK_SIZE);
      const sessionChunk = sessionUpdates.slice(
        Math.floor((i / allMessagesToInsert.length) * sessionUpdates.length),
        Math.floor(((i + CHUNK_SIZE) / allMessagesToInsert.length) * sessionUpdates.length)
      );

      // In case the proportional slice misses elements at the very end
      const actualSessionChunk = (i + CHUNK_SIZE >= allMessagesToInsert.length)
        ? sessionUpdates.slice(Math.floor((i / allMessagesToInsert.length) * sessionUpdates.length))
        : sessionChunk;

      const dbSession = await mongoose.startSession();
      try {
        await dbSession.withTransaction(async () => {
          if (messageChunk.length > 0) {
            await ChatMessage.insertMany(messageChunk, { session: dbSession, ordered: false });
          }
          if (actualSessionChunk.length > 0) {
            await ChatSession.bulkWrite(actualSessionChunk, { session: dbSession, ordered: false });
          }
        });
        console.log(`✅ Processed chunk: ${messageChunk.length} messages, ${actualSessionChunk.length} session updates.`);
      } catch (err) {
        console.error(`❌ Error processing chunk starting at index ${i}:`, err);
        throw err;
      } finally {
        await dbSession.endSession();
      }
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
