import { isRateLimitError, parseRateLimitError } from '@/lib/ratelimit/errors'
import { showRateLimitToast } from '@/components/RateLimitToast'

/**
 * Handle API response errors, including rate limits
 * Use this wrapper around fetch calls to automatically handle rate limit errors
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  // Check for rate limit error
  if (isRateLimitError(response)) {
    const error = await parseRateLimitError(response)

    // Show toast notification
    showRateLimitToast(error.retryAfter)

    // Throw error so calling code can handle it
    throw error
  }

  // Handle other errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: 'An unknown error occurred',
    }))
    throw new Error(errorData.error || `Request failed with status ${response.status}`)
  }

  // Parse and return successful response
  return response.json()
}

/**
 * Enhanced fetch wrapper with automatic rate limit handling
 * Use this instead of native fetch for API calls
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options)
  return handleApiResponse<T>(response)
}
