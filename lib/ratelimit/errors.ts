/**
 * Custom error class for rate limit exceeded errors
 */
export class RateLimitError extends Error {
  public readonly status: number = 429
  public readonly retryAfter: number

  constructor(message: string, retryAfter: number) {
    super(message)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RateLimitError)
    }
  }

  /**
   * Get a user-friendly error message with wait time
   */
  public getUserMessage(): string {
    const seconds = this.retryAfter
    if (seconds < 60) {
      return `Too many requests. Please wait ${seconds} seconds before trying again.`
    }
    const minutes = Math.ceil(seconds / 60)
    return `Too many requests. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`
  }
}

/**
 * Check if a response is a rate limit error
 */
export function isRateLimitError(response: Response): boolean {
  return response.status === 429
}

/**
 * Parse rate limit error from API response
 */
export async function parseRateLimitError(response: Response): Promise<RateLimitError> {
  try {
    const data = await response.json()
    const retryAfter = data.retryAfter || 60 // Default to 60 seconds if not provided
    return new RateLimitError('Rate limit exceeded', retryAfter)
  } catch {
    // If JSON parsing fails, use default retry time
    return new RateLimitError('Rate limit exceeded', 60)
  }
}
