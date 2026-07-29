import mongoose from 'mongoose';
import { env } from './src/config/env.js';

async function dropIndex() {
  try {
    await mongoose.connect(env.MONGODB_URL, { dbName: env.MONGODB_DB_NAME });
    console.log('Connected to DB');
    
    // The collection name is 'chatsessions' based on the error
    const collection = mongoose.connection.db.collection('chatsessions');
    
    console.log('Dropping index sessionId_1...');
    await collection.dropIndex('sessionId_1');
    console.log('Index dropped successfully!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

dropIndex();
