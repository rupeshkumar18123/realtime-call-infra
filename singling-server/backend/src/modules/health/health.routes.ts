import { Router, Request, Response } from 'express';
import { pubClient } from '@infrastructure/redis';
import { config } from '@config/index';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  let redisStatus = 'disconnected';
  try {
    await pubClient.ping();
    redisStatus = 'connected';
  } catch {
    redisStatus = config.server.isProd ? 'error' : 'skipped';
  }

  // In dev, Redis is optional — don't degrade status
  const healthy = redisStatus === 'connected' || !config.server.isProd;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: { redis: redisStatus },
  });
});
