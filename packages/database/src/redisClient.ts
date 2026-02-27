import Redis from "ioredis";
import "dotenv/config";
export const redis = new (Redis as any)(process.env.REDIS_URL);

redis.on("connect", () => {
  console.log("Redis connected");
});

export interface RedisError extends Error {
  command?: string;
  args?: Array<string | number | Buffer>;
  code?: string | number;
  retryAttempts?: number;
}

redis.on("error", (err: RedisError) => {
  console.error("Redis error", err);
});



