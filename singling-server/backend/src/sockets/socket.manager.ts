import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { config } from '@config/index';
import { pubClient, subClient } from '@infrastructure/redis';
import { socketAuthMiddleware } from './socket.middleware';
import { registerSocketEvents } from './socket.events';
import { logger } from '@logger/index';

export class SocketManager {
  private io: SocketServer;

  constructor(httpServer: HttpServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: config.cors.origins,
        credentials: true,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });
  }

  async initialize(): Promise<void> {
    this.io.use(socketAuthMiddleware);
    registerSocketEvents(this.io);

    if (config.server.isProd) {
      // Redis adapter required in production for horizontal scaling
      await this._connectRedisAdapter();
    } else {
      // In development, connect Redis adapter optionally — don't block startup
      this._connectRedisAdapter().catch((err) =>
        logger.warn('Redis adapter unavailable, running single-instance mode', {
          error: err.message,
        }),
      );
    }

    logger.info('Socket.IO server initialized');
  }

  private async _connectRedisAdapter(): Promise<void> {
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter attached');

    // In dev, stop reconnect spam if connection drops
    if (!config.server.isProd) {
      const stop = () => { pubClient.disconnect(); subClient.disconnect(); };
      pubClient.once('error', stop);
      subClient.once('error', stop);
    }
  }

  getIO(): SocketServer {
    return this.io;
  }
}
