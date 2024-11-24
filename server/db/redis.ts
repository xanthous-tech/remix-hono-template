import Redis from 'ioredis';
import { parseURL } from 'ioredis/built/utils/index.js';

export const redisConnectionOptions = parseURL(
  process.env.REDIS_URL ?? 'redis://localhost:6379/0',
);
export const redisClient = new Redis({
  ...redisConnectionOptions,
  maxRetriesPerRequest: null,
});
