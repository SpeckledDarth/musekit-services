import { Redis } from "@upstash/redis";

export interface RateLimitConfig {
  redisUrl?: string;
  redisToken?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface InMemoryEntry {
  timestamps: number[];
}

const inMemoryStore = new Map<string, InMemoryEntry>();

let redisClient: Redis | null = null;

function getRedisClient(config?: RateLimitConfig): Redis | null {
  if (redisClient) return redisClient;

  const url = config?.redisUrl || process.env.UPSTASH_REDIS_REST_URL;
  const token = config?.redisToken || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  try {
    redisClient = new Redis({ url, token });
    return redisClient;
  } catch {
    return null;
  }
}

async function checkRateLimitRedis(
  redis: Redis,
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `ratelimit:${key}`;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, windowStart);
  pipeline.zadd(redisKey, { score: now, member: `${now}-${Math.random()}` });
  pipeline.zcard(redisKey);
  pipeline.pexpire(redisKey, windowMs);

  const results = await pipeline.exec();
  const count = (results[2] as number) || 0;

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: now + windowMs,
  };
}

function checkRateLimitInMemory(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = inMemoryStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    inMemoryStore.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);
  entry.timestamps.push(now);

  const count = entry.timestamps.length;

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: now + windowMs,
  };
}

export function createRateLimiter(config?: RateLimitConfig) {
  const redis = getRedisClient(config);

  return {
    async checkRateLimit(
      key: string,
      limit: number,
      windowMs: number
    ): Promise<RateLimitResult> {
      if (redis) {
        try {
          return await checkRateLimitRedis(redis, key, limit, windowMs);
        } catch {
          console.warn(
            "[rate-limiter] Redis unavailable, falling back to in-memory"
          );
          return checkRateLimitInMemory(key, limit, windowMs);
        }
      }

      return checkRateLimitInMemory(key, limit, windowMs);
    },
  };
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  config?: RateLimitConfig
): Promise<RateLimitResult> {
  const limiter = createRateLimiter(config);
  return limiter.checkRateLimit(key, limit, windowMs);
}

// Cleanup stale in-memory entries periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 3600000; // 1 hour
  for (const [key, entry] of inMemoryStore.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > now - maxAge);
    if (entry.timestamps.length === 0) {
      inMemoryStore.delete(key);
    }
  }
}, 60000);
