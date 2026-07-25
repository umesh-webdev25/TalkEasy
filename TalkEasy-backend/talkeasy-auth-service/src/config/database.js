import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from 'shared';

export const connectDB = async () => {
  if (!env.MONGODB_URL) {
    logger.warn('MONGODB_URL is missing in auth-service. Starting in fallback mode.');
    return false;
  }
  
  try {
    const options = {
      dbName: env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 20000,
      maxPoolSize: 10,
    };
    
    await mongoose.connect(env.MONGODB_URL, options);
    logger.info('✅ Auth Database service connected successfully');
    return true;
  } catch (error) {
    logger.error(`❌ Auth Database service initialization error: ${error.message}`);
    return false;
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('Auth Database disconnected.');
  }
};
