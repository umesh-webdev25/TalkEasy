import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from 'shared';

export const connectDB = async () => {
  if (!env.MONGODB_URL) {
    logger.warn('MONGODB_URL is missing in auth-service. Starting in fallback mode.');
    return false;
  }
  
  // Set up connection lifecycle listeners
  mongoose.connection.on('connected', () => {
    logger.info('✅ Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`❌ Mongoose connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.info('⚠️ Mongoose disconnected from MongoDB');
  });

  try {
    const options = {
      dbName: env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 20000,
      maxPoolSize: 10,
    };
    
    await mongoose.connect(env.MONGODB_URL, options);
    return true;
  } catch (error) {
    logger.error(`❌ Auth Database service initialization error: ${error.message}`);
    // Throw the error instead of returning false so that server.js catches it 
    // and doesn't start the app without a database!
    throw error;
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('Auth Database disconnected.');
  }
};
