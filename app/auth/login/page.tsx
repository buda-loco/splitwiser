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
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: '600',
            marginBottom: '8px',
            textAlign: 'center',
          }}
        >
          Welcome to Splitwiser
        </h1>
        <p
          style={{
            color: '#6B7280',
            marginBottom: '32px',
            textAlign: 'center',
          }}
        >
          Enter your email to receive a magic link
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: '16px',
              border: '1px solid #D1D5DB',
              borderRadius: '12px',
              marginBottom: '16px',
              backgroundColor: 'white',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3B82F6'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#D1D5DB'
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: loading ? '#9CA3AF' : '#3B82F6',
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        {message && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: '#D1FAE5',
              color: '#065F46',
              borderRadius: '12px',
              fontSize: '14px',
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              borderRadius: '12px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
