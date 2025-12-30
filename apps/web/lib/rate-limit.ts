import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create Redis instance
// For development, we'll use an in-memory store
// For production, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    })
  : null

// Fallback in-memory rate limiter for development
class InMemoryRateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map()

  async limit(identifier: string, maxAttempts: number, windowMs: number): Promise<{ success: boolean; remaining: number }> {
    const now = Date.now()
    const record = this.attempts.get(identifier)

    // Clean up expired records
    if (record && now > record.resetTime) {
      this.attempts.delete(identifier)
    }

    const current = this.attempts.get(identifier)

    if (!current) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs })
      return { success: true, remaining: maxAttempts - 1 }
    }

    if (current.count >= maxAttempts) {
      return { success: false, remaining: 0 }
    }

    current.count++
    return { success: true, remaining: maxAttempts - current.count }
  }
}

const inMemoryLimiter = new InMemoryRateLimiter()

// Rate limiters for different endpoints
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 attempts per minute
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : null

export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '60 s'), // 30 requests per minute
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : null

// Helper function to check rate limit
export async function checkRateLimit(
  identifier: string,
  type: 'auth' | 'api' = 'api'
): Promise<{ success: boolean; remaining: number }> {
  const limiter = type === 'auth' ? authRateLimit : apiRateLimit
  const maxAttempts = type === 'auth' ? 5 : 30
  const windowMs = 60000 // 1 minute

  if (!limiter) {
    // Development fallback
    return inMemoryLimiter.limit(identifier, maxAttempts, windowMs)
  }

  try {
    const result = await limiter.limit(identifier)
    return {
      success: result.success,
      remaining: result.remaining,
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // Fail open in case of errors
    return { success: true, remaining: maxAttempts }
  }
}

// Get client IP from request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return 'unknown'
}
