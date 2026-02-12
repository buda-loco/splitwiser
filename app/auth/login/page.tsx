'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, FormEvent } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    // Basic email validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setError(authError.message)
      } else {
        setMessage('Check your email for the magic link')
        setEmail('')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-safe-top pb-safe-bottom bg-white dark:bg-black">
      <div className="w-full max-w-md">
        <h1 className="text-[28px] font-semibold mb-2 text-center text-gray-900 dark:text-white">
          Welcome to Splitwiser
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">
          Enter your email to receive a magic link
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email" className="sr-only">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={loading}
            className="w-full px-4 py-3.5 text-base border border-gray-300 dark:border-gray-600 rounded-xl mb-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-ios-blue focus:ring-2 focus:ring-ios-blue/20 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3.5 text-base font-semibold text-white bg-ios-blue rounded-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        {message && (
          <div className="mt-4 px-4 py-3 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-xl text-sm" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 px-4 py-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-xl text-sm" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
