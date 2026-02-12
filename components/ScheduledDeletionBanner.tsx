'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { cancelAccountDeletion } from '@/lib/actions/deleteAccount';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Scheduled Deletion Banner
 *
 * Displays a persistent warning when user has scheduled account deletion.
 * Shows countdown in days and provides cancellation option.
 */
export function ScheduledDeletionBanner() {
  const { profile, user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (profile?.deletion_scheduled_at) {
      const scheduledDate = new Date(profile.deletion_scheduled_at);
      const now = new Date();
      const diffTime = scheduledDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setDaysRemaining(diffDays);

      // Update daily
      const interval = setInterval(() => {
        const now = new Date();
        const diffTime = scheduledDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(diffDays);
      }, 1000 * 60 * 60); // Update every hour

      return () => clearInterval(interval);
    }
  }, [profile?.deletion_scheduled_at]);

  const handleCancelDeletion = async () => {
    if (!user) return;

    setCancelling(true);

    try {
      const result = await cancelAccountDeletion(user.id);

      if (result.success) {
        // Reload the page to refresh profile data
        window.location.reload();
      } else {
        alert('Failed to cancel deletion: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to cancel deletion:', err);
      alert('Failed to cancel deletion. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  // Don't show if no scheduled deletion or if dismissed
  if (!profile?.deletion_scheduled_at || dismissed) {
    return null;
  }

  // Don't show if deletion date has passed (should have been deleted already)
  if (daysRemaining !== null && daysRemaining <= 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 pt-safe-top"
      >
        <div className="bg-red-600 dark:bg-red-700 text-white px-4 py-3 shadow-lg">
          <div className="max-w-md mx-auto flex items-start gap-3">
            {/* Warning Icon */}
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />

            {/* Message */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm mb-1">
                Account Deletion Scheduled
              </div>
              <div className="text-xs opacity-90 mb-2">
                {daysRemaining !== null && daysRemaining > 0 ? (
                  <>
                    Your account will be deleted in{' '}
                    <strong>{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</strong>.
                  </>
                ) : (
                  <>Your account is scheduled for deletion.</>
                )}
              </div>
              <button
                onClick={handleCancelDeletion}
                disabled={cancelling}
                className="text-xs font-semibold underline hover:no-underline
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Deletion'}
              </button>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 p-1 hover:bg-red-700 dark:hover:bg-red-800
                       rounded transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
