import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/database.js';
import { logger } from 'shared';
import { setupSockets } from './sockets/socket.js';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const PORT = env.PORT || 3002;

const startServer = async () => {
  try {
    await connectDB();
    
    const server = http.createServer(app);
    
    // Initialize Socket.IO
    setupSockets(server);

    server.listen(PORT, () => {
      logger.info(`🚀 AI Service running on port ${PORT}`);
    });

    process.on('SIGINT', async () => {
      logger.info('Shutting down AI Service...');
      await disconnectDB();
      process.exit(0);
    });

  } catch (error) {
    logger.error(`❌ AI Service failed to start: ${error.message}`);
    process.exit(1);
  }
};

startServer();
