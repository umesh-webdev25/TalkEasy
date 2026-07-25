import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/database.js';
import { logger } from 'shared';

const PORT = env.PORT || 3001;

const startServer = async () => {
  try {
    await connectDB();
    
    const server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info(`🚀 Auth Service successfully running on port ${PORT}`);
    });

    process.on('SIGINT', async () => {
      logger.info('Shutting down Auth Service...');
      await disconnectDB();
      process.exit(0);
    });

  } catch (error) {
    logger.error(`❌ Auth Service failed to start: ${error.message}`);
    process.exit(1);
  }
};

startServer();
