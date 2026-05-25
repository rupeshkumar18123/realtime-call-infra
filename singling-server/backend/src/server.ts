import 'dotenv/config';
import http from 'http';
import { createApp } from './app';
import { config } from './config';
import { logger } from './logger';
import { SocketManager } from './sockets/socket.manager';
import { roomService } from './modules/rooms/room.service';

async function bootstrap(): Promise<void> {
  const app = createApp();
  const httpServer = http.createServer(app);
  const socketManager = new SocketManager(httpServer);

  await socketManager.initialize();

  // Periodic cleanup of ended rooms (every 30 minutes)
  setInterval(() => roomService.purgeEndedRooms(), 30 * 60 * 1000);

  httpServer.listen(config.server.port, config.server.host, () => {
    logger.info(`🚀 Server running on ${config.server.host}:${config.server.port}`, {
      env: config.server.nodeEnv,
    });
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`);
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
