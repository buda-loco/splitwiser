'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X } from 'lucide-react';
import Link from 'next/link';
import { acceptPolicies } from '@/lib/actions/user';

interface PolicyAcceptanceBannerProps {
  userId: string;
  onAccepted: () => void;
}

/**
 * Policy Acceptance Banner
 *
 * Shown to existing users who haven't accepted the privacy policy and terms.
 * Persists until accepted. Required for GDPR compliance.
 */
export function PolicyAcceptanceBanner({ userId, onAccepted }: PolicyAcceptanceBannerProps) {
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!accepted) {
      setError('Please check the box to accept');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await acceptPolicies(userId, '1.0');
      onAccepted();
    } catch (err) {
      console.error('Failed to accept policies:', err);
      setError('Failed to save acceptance. Please try again.');
      setSubmitting(false);
    }
  };

  if (dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-20 left-0 right-0 z-50 px-4 pb-safe"
      >
        <div className="max-w-md mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-ios-blue flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Privacy Policy Update
                </h3>
                <button
                  onClick={() => setDismissed(true)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                We&apos;ve updated our privacy policy and terms of service. Please review and accept to continue using Splitwiser.
              </p>

              {/* Checkbox */}
              <label className="flex items-start gap-2 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 text-ios-blue border-gray-300 rounded focus:ring-ios-blue"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
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
                <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                  {error}
                </p>
              )}

              {/* Accept Button */}
              <motion.button
                onClick={handleAccept}
                disabled={submitting}
                className="w-full py-2 bg-ios-blue text-white rounded-lg font-medium text-sm
                         disabled:opacity-50 disabled:cursor-not-allowed
                         active:bg-blue-600 transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                {submitting ? 'Accepting...' : 'Accept and Continue'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
