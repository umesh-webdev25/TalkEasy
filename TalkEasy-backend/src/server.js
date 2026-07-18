import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB } from './config/database.js';
import { setupSockets } from './sockets/socket.js';

const PORT = env.PORT;

const startServer = async () => {
  try {
    await connectDB();
    
    const server = http.createServer(app);
    setupSockets(server);

    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🔌 WebSocket server is active`);
    });

    process.on('SIGINT', async () => {
      logger.info('Shutting down server...');
      process.exit(0);
    });

  } catch (error) {
    logger.error(`❌ Server failed to start: ${error.message}`);
    process.exit(1);
  }
};

startServer();

