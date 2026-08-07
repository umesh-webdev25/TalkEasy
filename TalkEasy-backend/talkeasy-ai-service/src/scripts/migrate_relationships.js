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
    
    // Step 1: Use aggregation to get message counts for all sessions efficiently
    const messageCounts = await ChatMessage.aggregate([
      { $group: { _id: "$sessionId", count: { $sum: 1 } } }
    ]);
    
    const countMap = new Map();
    for (const mc of messageCounts) {
      if (mc._id) {
        countMap.set(mc._id.toString(), mc.count);
      }
    }

    const allSessions = await ChatSession.find({});
    const sessionUpdates = [];
    
    for (const session of allSessions) {
      const realCount = countMap.get(session._id.toString()) || 0;
      if (session.message_count !== realCount) {
        sessionUpdates.push({
          updateOne: {
            filter: { _id: session._id },
            update: { $set: { message_count: realCount } }
          }
        });
      }
    }

    let recalcCount = sessionUpdates.length;
    
    if (recalcCount > 0) {
      console.log(`Prepared ${recalcCount} session updates. Processing in chunks...`);
      const CHUNK_SIZE = 5000;
      
      for (let i = 0; i < sessionUpdates.length; i += CHUNK_SIZE) {
        const chunk = sessionUpdates.slice(i, i + CHUNK_SIZE);
        const dbSession = await mongoose.startSession();
        
        try {
          await dbSession.withTransaction(async () => {
            await ChatSession.bulkWrite(chunk, { session: dbSession, ordered: false });
          });
          console.log(`✅ Processed chunk of ${chunk.length} session updates.`);
        } catch (err) {
          console.error(`❌ Error processing chunk starting at index ${i}:`, err);
          throw err;
        } finally {
          await dbSession.endSession();
        }
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
