'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { acceptPolicies } from '@/lib/actions/user';

/**
 * Policy Acceptance Page (First-time Signup)
 *
 * Required step for new users to accept privacy policy and terms.
 * Shown after magic link authentication if policies not yet accepted.
 * GDPR compliance requires explicit consent before data processing.
 */
export default function AcceptPoliciesPage() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already accepted
  useEffect(() => {
    if (profile?.privacy_policy_accepted_at && profile?.terms_accepted_at) {
      router.push('/');
    }
  }, [profile, router]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  const handleAccept = async () => {
    if (!accepted) {
      setError('Please check the box to accept the policies');
      return;
    }

    if (!user) {
      setError('You must be logged in to accept policies');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await acceptPolicies(user.id, '1.0');
      await refreshProfile();
      router.push('/');
    } catch (err) {
      console.error('Failed to accept policies:', err);
      setError('Failed to save your acceptance. Please try again.');
      setSubmitting(false);
    }
  };

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 pt-safe-top pb-safe-bottom">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-ios-blue/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-ios-blue" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">
          Welcome to Splitwiser
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
          Before you start splitting expenses, please review and accept our policies
        </p>

        {/* Content Card */}
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
            What you&apos;re agreeing to:
          </h2>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>We only collect data necessary for expense tracking</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>You can export or delete your data at any time</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>We never sell your data or show ads</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Your data is encrypted and securely stored</span>
            </li>
          </ul>

          <div className="flex gap-3">
            <Link
              href="/legal/privacy"
              className="flex-1 py-2 px-4 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Read Privacy Policy
            </Link>
            <Link
              href="/legal/terms"
              className="flex-1 py-2 px-4 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Read Terms
            </Link>
          </div>
        </div>

        {/* Acceptance Checkbox */}
        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 w-5 h-5 text-ios-blue border-gray-300 rounded focus:ring-ios-blue"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
            I have read and accept the{' '}
            <Link href="/legal/privacy" className="text-ios-blue hover:underline">
              Privacy Policy
            </Link>
            {' '}and{' '}
            <Link href="/legal/terms" className="text-ios-blue hover:underline">
              Terms of Service
            </Link>
          </span>
        </label>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </motion.div>
        )}

        {/* Accept Button */}
        <motion.button
          onClick={handleAccept}
          disabled={submitting}
          className="w-full py-4 bg-ios-blue text-white rounded-xl font-semibold text-lg
                   disabled:opacity-50 disabled:cursor-not-allowed
                   active:bg-blue-600 transition-colors"
          whileTap={{ scale: 0.98 }}
        >
          {submitting ? 'Accepting...' : 'Accept and Continue'}
        </motion.button>

        {/* Note */}
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
          By continuing, you confirm that you&apos;ve read and agree to our policies.
          You must accept to use Splitwiser.
        </p>
      </motion.div>
    </div>
  );
}
