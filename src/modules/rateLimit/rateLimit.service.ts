import redis from '../../config/redis';

interface RateLimitResult {
  allowed: boolean;
  tier: string;
  limit: number;
  current: number;
  resetInSeconds: number;
}

// Sliding Window Algorithm
const slidingWindow = async (
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; current: number; resetInSeconds: number }> => {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  // Pipeline use karo — multiple Redis commands ek saath
  const pipeline = redis.pipeline();

  // Purane requests remove karo (window ke bahar wale)
  pipeline.zremrangebyscore(key, 0, windowStart);

  // Current requests count karo
  pipeline.zcard(key);

  // Current request add karo
  pipeline.zadd(key, now, `${now}-${Math.random()}`);

  // Key expire set karo
  pipeline.expire(key, windowSeconds);

  const results = await pipeline.exec();
  const current = (results![1][1] as number) + 1;

  return {
    allowed: current <= limit,
    current,
    resetInSeconds: windowSeconds,
  };
};

// Global Rate Limit — 1000 req/minute per tenant
export const checkGlobalLimit = async (
  tenantId: string
): Promise<RateLimitResult> => {
  const key = `ratelimit:global:${tenantId}`;
  const result = await slidingWindow(key, 1000, 60);

  return {
    ...result,
    tier: 'global',
    limit: 1000,
  };
};

// Endpoint Rate Limit — configurable per route per tenant
export const checkEndpointLimit = async (
  tenantId: string,
  endpoint: string,
  limit: number
): Promise<RateLimitResult> => {
  const key = `ratelimit:endpoint:${tenantId}:${endpoint}`;
  const result = await slidingWindow(key, limit, 60);

  return {
    ...result,
    tier: 'endpoint',
    limit,
  };
};

// Burst Rate Limit — 50 req/5 seconds per API key
export const checkBurstLimit = async (
  apiKey: string
): Promise<RateLimitResult> => {
  const key = `ratelimit:burst:${apiKey}`;
  const result = await slidingWindow(key, 50, 5);

  return {
    ...result,
    tier: 'burst',
    limit: 50,
  };
};