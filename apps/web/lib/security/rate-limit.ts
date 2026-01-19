/**
 * Rate Limiting Middleware
 *
 * Implements token bucket algorithm for rate limiting API requests.
 * Tracks both IP-based and user-based limits to prevent abuse.
 *
 * Security considerations:
 * - Uses in-memory storage (suitable for single-instance deployments)
 * - For production with multiple instances, consider Redis
 * - Implements exponential backoff recommendations via Retry-After header
 * - Prevents DoS attacks and brute force attempts
 *
 * OWASP References:
 * - OWASP API Security Top 10: API4:2023 Unrestricted Resource Consumption
 */

import { NextRequest, NextResponse } from 'next/server'

// Rate limit configuration
export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number

  /**
   * Time window in seconds
   */
  windowSeconds: number

  /**
   * Optional: Custom identifier for grouping related endpoints
   */
  identifier?: string
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // Strict limits for sensitive operations
  PAYMENT: { maxRequests: 5, windowSeconds: 60 }, // 5 req/min
  AUTH: { maxRequests: 10, windowSeconds: 60 }, // 10 req/min
  UPLOAD: { maxRequests: 10, windowSeconds: 60 }, // 10 req/min

  // Moderate limits for mutations
  MUTATION: { maxRequests: 30, windowSeconds: 60 }, // 30 req/min

  // Generous limits for reads
  READ: { maxRequests: 100, windowSeconds: 60 }, // 100 req/min

  // Very strict for webhooks (per IP)
  WEBHOOK: { maxRequests: 100, windowSeconds: 60 }, // 100 req/min total
} as const

interface TokenBucket {
  tokens: number
  lastRefill: number
}

// In-memory storage for rate limiting
// Key format: "ip:{ip}:{endpoint}" or "user:{userId}:{endpoint}"
const buckets = new Map<string, TokenBucket>()

// Cleanup old buckets every hour to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  const maxAge = 3600000 // 1 hour in ms

  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill > maxAge) {
      buckets.delete(key)
    }
  }
}, 3600000)

/**
 * Gets client IP address from request
 * Handles proxies and load balancers correctly
 */
function getClientIp(request: NextRequest): string {
  // Check X-Forwarded-For header (set by proxies)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(',')[0].trim()
  }

  // Check X-Real-IP header (set by some proxies)
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  // Fallback to a default (should not happen in production)
  return 'unknown'
}

/**
 * Refills tokens in the bucket based on elapsed time
 */
function refillBucket(
  bucket: TokenBucket,
  config: RateLimitConfig,
  now: number
): void {
  const elapsedSeconds = (now - bucket.lastRefill) / 1000
  const tokensToAdd = (elapsedSeconds / config.windowSeconds) * config.maxRequests

  bucket.tokens = Math.min(config.maxRequests, bucket.tokens + tokensToAdd)
  bucket.lastRefill = now
}

/**
 * Main rate limiting function
 *
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @param userId - Optional authenticated user ID for user-based limiting
 * @returns NextResponse with 429 if rate limited, null if allowed
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string
): Promise<NextResponse | null> {
  const now = Date.now()
  const endpoint = config.identifier || request.nextUrl.pathname

  // Build rate limit keys
  const ip = getClientIp(request)
  const ipKey = `ip:${ip}:${endpoint}`
  const userKey = userId ? `user:${userId}:${endpoint}` : null

  // Check IP-based rate limit
  const ipBucket = buckets.get(ipKey) || {
    tokens: config.maxRequests,
    lastRefill: now
  }

  refillBucket(ipBucket, config, now)
  buckets.set(ipKey, ipBucket)

  // Check user-based rate limit if authenticated
  let userBucket: TokenBucket | null = null
  if (userKey) {
    userBucket = buckets.get(userKey) || {
      tokens: config.maxRequests,
      lastRefill: now
    }

    refillBucket(userBucket, config, now)
    buckets.set(userKey, userBucket)
  }

  // Rate limit if either IP or user has no tokens
  const ipLimited = ipBucket.tokens < 1
  const userLimited = userBucket && userBucket.tokens < 1

  if (ipLimited || userLimited) {
    // Calculate retry-after time (seconds until 1 token available)
    const retryAfter = Math.ceil(config.windowSeconds / config.maxRequests)

    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(now + retryAfter * 1000).toISOString()
        }
      }
    )
  }

  // Consume tokens
  ipBucket.tokens -= 1
  if (userBucket) {
    userBucket.tokens -= 1
  }

  return null
}

/**
 * Helper to add rate limit headers to successful responses
 */
export function addRateLimitHeaders(
  response: NextResponse,
  config: RateLimitConfig,
  remaining: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', Math.max(0, remaining).toString())
  response.headers.set('X-RateLimit-Reset', new Date(Date.now() + config.windowSeconds * 1000).toISOString())

  return response
}

/**
 * Wrapper function for easy integration into API routes
 *
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await withRateLimit(request, RATE_LIMITS.PAYMENT, userId)
 *   if (rateLimitResult) return rateLimitResult
 *
 *   // ... rest of handler
 * }
 * ```
 */
export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string
): Promise<NextResponse | null> {
  return checkRateLimit(request, config, userId)
}
