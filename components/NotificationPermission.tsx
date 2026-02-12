'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { registerPushNotifications, canRequestNotificationPermission } from '@/lib/notifications/pushSetup';

const DISMISSAL_KEY = 'notification_permission_dismissed';
const DISMISSAL_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

interface NotificationPermissionProps {
  userId: string;
}

export default function NotificationPermission({ userId }: NotificationPermissionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if we should show the modal
    const checkShouldShow = () => {
      // Don't show if permission already granted or denied
      if (!canRequestNotificationPermission()) {
        return false;
      }

      // Check if user dismissed recently
      const dismissalTimestamp = localStorage.getItem(DISMISSAL_KEY);
      if (dismissalTimestamp) {
        const timeSinceDismissal = Date.now() - parseInt(dismissalTimestamp, 10);
        if (timeSinceDismissal < DISMISSAL_DURATION) {
          return false;
        }
      }

      return true;
    };

    // Show modal after a short delay (for better UX)
    const timer = setTimeout(() => {
      if (checkShouldShow()) {
        setIsVisible(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    setIsLoading(true);
    try {
      const subscription = await registerPushNotifications(userId);
      if (subscription) {
        setIsSuccess(true);
        // Hide modal after showing success message
        setTimeout(() => {
          setIsVisible(false);
        }, 2000);
      } else {
        // Permission denied or error occurred
        handleDismiss();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      handleDismiss();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSAL_KEY, Date.now().toString());
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-center pb-safe"
          >
            <div className="bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl w-full max-w-md mx-4 mb-4 overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              <div className="px-6 py-8">
                {isSuccess ? (
                  // Success state
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Bell className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                      You&apos;re all set!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      We&apos;ll notify you about expense updates.
                    </p>
                  </motion.div>
                ) : (
                  // Permission request state
                  <>
                    {/* App icon */}
                    <div className="w-16 h-16 mx-auto mb-6 bg-ios-blue/10 dark:bg-ios-blue/20 rounded-full flex items-center justify-center">
                      <Bell className="w-8 h-8 text-ios-blue" />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-3">
                      Stay Updated
                    </h2>

                    {/* Description */}
                    <p className="text-center text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                      Get notified when expenses are shared with you or settlements are requested
                    </p>

                    {/* Buttons */}
                    <div className="space-y-3">
                      <button
                        onClick={handleAllow}
                        disabled={isLoading}
                        className="w-full py-4 px-6 bg-ios-blue hover:bg-ios-blue/90 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Requesting...' : 'Allow Notifications'}
                      </button>

                      <button
                        onClick={handleDismiss}
                        disabled={isLoading}
                        className="w-full py-4 px-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Not Now
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
