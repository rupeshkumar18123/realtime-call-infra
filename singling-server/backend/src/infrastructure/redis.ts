import Redis from 'ioredis';
import { config } from '@config/index';
import { logger } from '@logger/index';

const redisOptions: Redis.RedisOptions = {
  host: config.redis.host,
  port: config.redis.port,
  ...(config.redis.password ? { password: config.redis.password } : {}),
  ...(config.redis.tls ? { tls: {} } : {}),
  lazyConnect: true,
  connectTimeout: 5000,
  retryStrategy: () => null, // never auto-retry — we manage reconnects manually
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
};

export const createRedisClient = (name = 'default'): Redis => {
  const client = new Redis(redisOptions);
  client.on('connect', () => logger.info(`Redis [${name}] connected`));
  client.on('error', (err) => {
    logger.error(`Redis [${name}] error`, { error: err.message });
    client.disconnect(); // hard stop — no reconnect
  });
  return client;
};

export const pubClient = createRedisClient('pub');
export const subClient = createRedisClient('sub');
