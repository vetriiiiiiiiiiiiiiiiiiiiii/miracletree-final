import { Redis } from 'ioredis';

const globalForRedis = global;

if (!globalForRedis.redis) {
  globalForRedis.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
}

export const redis = globalForRedis.redis;
