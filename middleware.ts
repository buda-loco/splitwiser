import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { rateLimit, apiLimiter, authLimiter } from '@/lib/ratelimit/upstash'

/**
 * Extract IP address from request headers
 */
function getIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.ip || '127.0.0.1'
  return ip
}

/**
 * Add rate limit headers to response
 */
function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: Date
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', reset.getTime().toString())
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip rate limiting in development mode
  if (process.env.NODE_ENV !== 'production') {
    try {
      return await updateSession(request)
    } catch {
      return NextResponse.next()
    }
  }

  // Skip rate limiting for static files (handled by config matcher)
  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const ip = getIP(request)

    // Determine which limiter to use
    const limiter = pathname.startsWith('/api/auth/') ? authLimiter : apiLimiter
    const limitValue = pathname.startsWith('/api/auth/') ? 5 : 10

    try {
      const result = await rateLimit(ip, limiter)

      if (!result.success) {
        // Calculate retry-after in seconds
        const retryAfter = Math.ceil((result.reset.getTime() - Date.now()) / 1000)

        // Return 429 Too Many Requests
        const response = NextResponse.json(
          {
            error: 'Rate limit exceeded',
            retryAfter,
            limit: limitValue,
            reset: result.reset.getTime(),
          },
          { status: 429 }
        )

        response.headers.set('Retry-After', retryAfter.toString())
        return addRateLimitHeaders(response, limitValue, 0, result.reset)
      }

      // Continue with auth middleware and add rate limit headers
      try {
        const authResponse = await updateSession(request)
        return addRateLimitHeaders(authResponse, limitValue, result.remaining, result.reset)
      } catch {
        const response = NextResponse.next()
        return addRateLimitHeaders(response, limitValue, result.remaining, result.reset)
      }
    } catch (error) {
      // If rate limiting fails (e.g., Redis unavailable), continue without it
      console.error('Rate limiting error:', error)
      try {
        return await updateSession(request)
      } catch {
        return NextResponse.next()
      }
    }
  }

  // For non-API routes, just run auth middleware
  try {
    return await updateSession(request)
  } catch {
    // If session update fails (e.g. Supabase unreachable), allow request to continue
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
