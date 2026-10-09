import { Redis } from "ioredis";

const globalForRedis = global;

if (!globalForRedis.redis) {
  if (process.env.DOCKER_BUILD === "1") {
    globalForRedis.redis = new Proxy(
      {},
      {
        get: () => async () => null,
      },
    );
  } else {
    globalForRedis.redis = new Redis(
      process.env.REDIS_URL || "redis://localhost:6379",
    );
  }
}

export const redis = globalForRedis.redis;
