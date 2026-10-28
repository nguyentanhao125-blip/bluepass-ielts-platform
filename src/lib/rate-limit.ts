/**
 * Sliding-Window Token Bucket Rate Limiter for VPS Endpoint Protection
 * Protects Login, Register, Exam Start, Exam Submit, and Chat APIs from brute-force & spam.
 */

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

export function checkRateLimit(
  identifier: string,
  limit: number = 15,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now();

  // Periodic cleanup of expired buckets to prevent memory bloat on VPS
  if (buckets.size > 5000) {
    buckets.forEach((val, key) => {
      if (val.resetAt <= now) buckets.delete(key);
    });
  }

  const existing = buckets.get(identifier);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(identifier, { count: 1, resetAt });
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return {
    allowed: existing.count <= limit,
    limit,
    remaining,
    resetInSeconds,
  };
}
