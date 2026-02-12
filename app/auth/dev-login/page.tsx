'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Development/Testing Login Bypass
 *
 * Allows password-based login without magic link for testing purposes.
 * Use this when testing on mobile or when email rate limits are hit.
 */
export default function DevLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      if (mode === 'signup') {
        // Sign up new user
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) {
          setError(signUpError.message);
        } else {
          // Sign up successful, now sign in
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            setError(signInError.message);
          } else {
            router.push('/');
          }
        }
      } else {
        // Sign in existing user
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
        } else {
          router.push('/');
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-safe-top pb-safe-bottom bg-white dark:bg-black">
      <div className="w-full max-w-md">
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            ⚠️ <strong>Dev/Testing Only</strong>
            <br />
            Password-based login for testing without magic links.
          </p>
        </div>

        <h1 className="text-[28px] font-semibold mb-2 text-center text-gray-900 dark:text-white">
          {mode === 'signin' ? 'Dev Sign In' : 'Dev Sign Up'}
        </h1>

        <p className="text-[15px] text-ios-gray text-center mb-8">
          {mode === 'signin'
            ? 'Sign in with email and password for testing'
            : 'Create a test account with password'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-[17px] bg-ios-gray6 dark:bg-gray-800 border border-transparent rounded-xl
                       text-gray-900 dark:text-white placeholder-ios-gray
                       focus:outline-none focus:ring-2 focus:ring-ios-blue focus:border-transparent
                       transition-all"
              placeholder="your@email.com"
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-[17px] bg-ios-gray6 dark:bg-gray-800 border border-transparent rounded-xl
                       text-gray-900 dark:text-white placeholder-ios-gray
                       focus:outline-none focus:ring-2 focus:ring-ios-blue focus:border-transparent
                       transition-all"
              placeholder="Min. 6 characters"
              minLength={6}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-ios-red rounded-xl">
              <p className="text-sm text-ios-red">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-[17px] font-semibold text-white bg-ios-blue rounded-xl
                     hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all shadow-sm"
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>

          {/* Mode Toggle */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-[15px] text-ios-blue hover:underline"
            >
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>

          {/* Back to main login */}
          <div className="text-center">
            <a
              href="/auth/login"
              className="text-[15px] text-ios-gray hover:text-gray-900 dark:hover:text-white"
            >
              ← Back to magic link login
            </a>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Quick Test:</strong>
            <br />
            1. Use any email (e.g., test@example.com)
            <br />
            2. Create password (min. 6 chars)
            <br />
            3. Sign up, then sign in
          </p>
        </div>
      </div>
    </div>
  );
}
