import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { config } from '@config/index';
import { logger } from '@logger/index';
import { errorHandler } from '@middleware/errorHandler';
import { notFoundHandler } from '@middleware/notFoundHandler';
import { healthRouter } from '@modules/health/health.routes';
import { authRouter } from '@modules/auth/auth.routes';
import { roomRouter } from '@modules/rooms/room.routes';

export function createApp(): Application {
  const app = express();

  // Security
  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  );

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later.' },
    }),
  );

  // Body parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // HTTP request logging
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
      skip: () => config.server.nodeEnv === 'test',
    }),
  );

  // Routes
  app.use('/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/rooms', roomRouter);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
