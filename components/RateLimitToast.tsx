'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

interface RateLimitToastProps {
  retryAfter: number // seconds until can retry
  onDismiss: () => void
}

/**
 * iOS-native toast notification for rate limit errors
 * Slides from top, shows countdown timer, auto-dismisses after retry period
 */
export function RateLimitToast({ retryAfter, onDismiss }: RateLimitToastProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(retryAfter)

  useEffect(() => {
    // Update countdown every second
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          // Auto-dismiss when countdown reaches zero
          onDismiss()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [onDismiss])

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`
    }
    const minutes = Math.ceil(seconds / 60)
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
      className="fixed top-0 left-0 right-0 z-50 pt-safe-top"
    >
      <div className="mx-4 mt-4 rounded-xl bg-ios-red shadow-lg overflow-hidden">
        <div className="px-4 py-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              Too Many Requests
            </p>
            <p className="text-white/90 text-xs mt-1">
              Try again in {formatTime(remainingSeconds)}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-white/80 hover:text-white text-sm font-medium"
          >
            Dismiss
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/20">
          <motion.div
            className="h-full bg-white/60"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{
              duration: retryAfter,
              ease: 'linear',
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Container for managing rate limit toast visibility
 * Use this in your layout or error boundary
 */
export function RateLimitToastContainer() {
  const [toastData, setToastData] = useState<{ retryAfter: number } | null>(null)

  useEffect(() => {
    // Listen for rate limit errors globally
    const handleRateLimitError = (event: CustomEvent<{ retryAfter: number }>) => {
      setToastData({ retryAfter: event.detail.retryAfter })
    }

    window.addEventListener('ratelimit' as any, handleRateLimitError)
    return () => {
      window.removeEventListener('ratelimit' as any, handleRateLimitError)
    }
  }, [])

  return (
    <AnimatePresence>
      {toastData && (
        <RateLimitToast
          retryAfter={toastData.retryAfter}
          onDismiss={() => setToastData(null)}
        />
      )}
    </AnimatePresence>
  )
}

/**
 * Trigger a rate limit toast notification
 * Call this from error handlers when API returns 429
 */
export function showRateLimitToast(retryAfter: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ratelimit', {
        detail: { retryAfter },
      })
    )
  }
}
