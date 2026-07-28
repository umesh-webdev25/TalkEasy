import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { ChatSession } from '../models/chat.model.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { File } from '../models/File.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function verifyIntegrity() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in environment variables.");
    process.exit(1);
  }

  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB.");

    console.log("\n--- Integrity Check Report ---");

    const nullUserChats = await ChatSession.countDocuments({ $or: [{ user_id: null }, { user_id: { $exists: false } }] });
    console.log(`- Chats with null user_id: ${nullUserChats}`);

    const nullUserMessages = await ChatMessage.countDocuments({ $or: [{ user_id: null }, { user_id: { $exists: false } }] });
    console.log(`- Messages with null user_id: ${nullUserMessages}`);

    const nullUploaderFiles = await File.countDocuments({ $or: [{ uploadedBy: null }, { uploadedBy: { $exists: false } }] });
    console.log(`- Files with null uploadedBy: ${nullUploaderFiles}`);

    const nullChatFiles = await File.countDocuments({ $or: [{ linkedChatId: null }, { linkedChatId: { $exists: false } }] });
    console.log(`- Files with null linkedChatId: ${nullChatFiles}`);

    const nullMessageFiles = await File.countDocuments({ $or: [{ messageId: null }, { messageId: { $exists: false } }] });
    console.log(`- Files with null messageId: ${nullMessageFiles}`);

    // Check orphaned messages (messages pointing to non-existent session)
    // This is a bit slow in raw Mongoose without aggregation, but fine for a script.
    const uniqueSessionIdsInMessages = await ChatMessage.distinct('sessionId');
    const existingSessions = await ChatSession.find({ _id: { $in: uniqueSessionIdsInMessages } }, { _id: 1 });
    const existingSessionIdsSet = new Set(existingSessions.map(s => s._id.toString()));
    let orphanedMessagesCount = 0;
    
    for (const sId of uniqueSessionIdsInMessages) {
      if (!existingSessionIdsSet.has(sId.toString())) {
        orphanedMessagesCount += await ChatMessage.countDocuments({ sessionId: sId });
      }
    }
    console.log(`- Orphaned ChatMessages (no parent session): ${orphanedMessagesCount}`);

  } catch (error) {
    console.error("❌ Verification failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
    process.exit(0);
  }
}

verifyIntegrity();
