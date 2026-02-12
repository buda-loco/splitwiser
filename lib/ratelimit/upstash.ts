import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis client (edge-compatible REST API)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Rate limiter for general API routes
// 10 requests per minute per IP
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: '@ratelimit/api',
})

// Rate limiter for authentication routes (stricter to prevent brute force)
// 5 requests per minute per IP
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: '@ratelimit/auth',
})

// Rate limiter for expense CRUD operations
// 30 requests per minute per user
export const expenseLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  analytics: true,
  prefix: '@ratelimit/expense',
})

/**
 * Check rate limit for a given identifier and limiter
 * @param identifier - IP address or user ID
 * @param limiter - Rate limiter instance to use
 * @returns Object with success status, remaining requests, and reset time
 */
export async function rateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<{
  success: boolean
  remaining: number
  reset: Date
}> {
  const result = await limiter.limit(identifier)

  return {
    success: result.success,
    remaining: result.remaining,
    reset: new Date(result.reset),
  }
}
