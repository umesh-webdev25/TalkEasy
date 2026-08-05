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

const MONGODB_URL = process.env.MONGODB_URL;
const DEFAULT_SYSTEM_USER = 'system_legacy';

async function migrateRelationships() {
  if (!MONGODB_URL) {
    console.error("❌ MONGODB_URL is not defined in environment variables.");
    process.exit(1);
  }

  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URL);
    console.log("✅ Connected to MongoDB.");

    console.log("\n--- Phase 1: Fixing Orphaned ChatSessions ---");
    const orphanChats = await ChatSession.updateMany(
      { $or: [{ user_id: null }, { user_id: { $exists: false } }, { user_id: "" }] },
      { $set: { user_id: DEFAULT_SYSTEM_USER } }
    );
    console.log(`✅ Updated ${orphanChats.modifiedCount} orphaned ChatSessions.`);

    console.log("\n--- Phase 2: Fixing Orphaned ChatMessages ---");
    const orphanMessages = await ChatMessage.updateMany(
      { $or: [{ user_id: null }, { user_id: { $exists: false } }, { user_id: "" }] },
      { $set: { user_id: DEFAULT_SYSTEM_USER } }
    );
    console.log(`✅ Updated ${orphanMessages.modifiedCount} orphaned ChatMessages.`);

    console.log("\n--- Phase 3: Fixing Orphaned Files ---");
    // Some File uploadedBy are ObjectIds if they manually cast them, but we updated it to String? 
    // We update null values safely.
    const orphanFiles = await File.updateMany(
      { $or: [{ uploadedBy: null }, { uploadedBy: { $exists: false } }] },
      { $set: { uploadedBy: new mongoose.Types.ObjectId() } } // Create a dummy ObjectId for legacy files
    );
    console.log(`✅ Updated ${orphanFiles.modifiedCount} orphaned Files.`);

    console.log("\n--- Phase 4: Fixing message_count totals ---");
    const allSessions = await ChatSession.find({});
    let recalcCount = 0;
    for (const session of allSessions) {
      const realCount = await ChatMessage.countDocuments({ sessionId: session._id });
      if (session.message_count !== realCount) {
        session.message_count = realCount;
        await session.save();
        recalcCount++;
      }
    }
    console.log(`✅ Recalculated message_count for ${recalcCount} sessions.`);

    console.log("\n🎉 Migration Complete!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

migrateRelationships();
