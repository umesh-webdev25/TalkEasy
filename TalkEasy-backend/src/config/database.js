import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export const connectDB = async () => {
  if (!env.MONGODB_URL) {
    logger.warn('MONGODB_URL is missing. Starting in fallback mode.');
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
    
    if (env.MONGODB_SSL_ALLOW_INVALID_CERTIFICATES) {
      options.tlsAllowInvalidCertificates = true;
      options.tlsAllowInvalidHostnames = true;
    }
    
    await mongoose.connect(env.MONGODB_URL, options);
    logger.info('✅ Database service connected successfully');
    return true;
  } catch (error) {
    logger.error(`❌ Database service initialization error: ${error.message}`);
    return false;
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('Database disconnected.');
  }
};
