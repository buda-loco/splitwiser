'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Download, ArrowLeft, Trash2 } from 'lucide-react';
import { deleteAccount } from '@/lib/actions/deleteAccount';

/**
 * Account Deletion Page (GDPR Compliance)
 *
 * Multi-step confirmation flow for account deletion.
 * Required by GDPR Article 17 (Right to Erasure).
 */

type DeletionStep = 'warning' | 'verify' | 'grace-period' | 'confirming';

export default function DeleteAccountPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<DeletionStep>('warning');
  const [verificationInput, setVerificationInput] = useState('');
  const [selectedGracePeriod, setSelectedGracePeriod] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleBack = () => {
    if (currentStep === 'warning') {
      router.back();
    } else if (currentStep === 'verify') {
      setCurrentStep('warning');
      setVerificationInput('');
    } else if (currentStep === 'grace-period') {
      setCurrentStep('verify');
    }
  };

  const handleProceedFromWarning = () => {
    setCurrentStep('verify');
  };

  const handleProceedFromVerify = () => {
    if (verificationInput === 'DELETE') {
      setCurrentStep('grace-period');
    }
  };

  const handleConfirmDeletion = async () => {
    if (!user) return;

    setDeleting(true);
    setError(null);

    try {
      const result = await deleteAccount(user.id, selectedGracePeriod);

      if (result.success) {
        // Redirect to confirmation page or login
        router.push('/auth/login?deleted=true');
      } else {
        setError(result.error || 'Failed to delete account');
      }
    } catch (err) {
      console.error('Account deletion failed:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-safe pt-safe-top">
      {/* Header */}
      <div className="px-4 py-6 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={handleBack}
          className="text-ios-blue mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-red-600 dark:text-red-500">
          Delete Account
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Permanently delete your account and all data
        </p>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Warning */}
          {currentStep === 'warning' && (
            <motion.div
              key="warning"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Warning Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-500" />
                </div>
              </div>

              {/* Warning Message */}
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-3">
                  This action will permanently delete:
                </h3>
                <ul className="space-y-2 text-sm text-red-800 dark:text-red-200">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>All expenses you&apos;ve created</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>All settlements you&apos;ve made</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Your complete expense history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Your profile and account data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>All version history and activity logs</span>
                  </li>
                </ul>
              </div>

              {/* Important Notice */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  <strong>Important:</strong> Other users may still have references to expenses you participated in.
                  Their data will not be affected, but your account will be removed from the system.
                </p>
              </div>

              {/* Download Data First */}
              <button
                onClick={() => router.push('/settings/export')}
                className="w-full py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400
                         rounded-xl font-semibold flex items-center justify-center gap-2
                         border border-blue-200 dark:border-blue-800
                         active:bg-blue-100 dark:active:bg-blue-900/30 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download My Data First
              </button>

              {/* Continue Button */}
              <motion.button
                onClick={handleProceedFromWarning}
                className="w-full py-4 bg-red-600 text-white rounded-xl font-semibold text-lg
                         active:bg-red-700 transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                I Understand, Continue
              </motion.button>

              {/* Cancel */}
              <button
                onClick={() => router.back()}
                className="w-full py-3 text-gray-600 dark:text-gray-400"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* Step 2: Verification */}
          {currentStep === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  Verify Account Deletion
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200 mb-4">
                  To confirm deletion, please type <strong>DELETE</strong> in the box below.
                </p>

                <input
                  type="text"
                  value={verificationInput}
                  onChange={(e) => setVerificationInput(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700
                           rounded-lg bg-white dark:bg-gray-900
                           text-gray-900 dark:text-white
                           focus:outline-none focus:border-red-500
                           placeholder-gray-400 dark:placeholder-gray-600"
                  autoFocus
                />
              </div>

              <motion.button
                onClick={handleProceedFromVerify}
                disabled={verificationInput !== 'DELETE'}
                className="w-full py-4 bg-red-600 text-white rounded-xl font-semibold text-lg
                         disabled:opacity-50 disabled:cursor-not-allowed
                         active:bg-red-700 transition-colors"
                whileTap={{ scale: verificationInput === 'DELETE' ? 0.98 : 1 }}
              >
                Continue to Next Step
              </motion.button>

              <button
                onClick={() => router.back()}
                className="w-full py-3 text-gray-600 dark:text-gray-400"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* Step 3: Grace Period Selection */}
          {currentStep === 'grace-period' && (
            <motion.div
              key="grace-period"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Choose Deletion Timing
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  You can delete immediately or schedule deletion for 30 days from now.
                  Scheduled deletion allows you to cancel if you change your mind.
                </p>
              </div>

              {/* Grace Period Options */}
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedGracePeriod(true)}
                  className={`w-full p-4 rounded-xl border-2 transition-colors text-left
                    ${selectedGracePeriod
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5
                      ${selectedGracePeriod ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}
                    >
                      {selectedGracePeriod && (
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        Delete in 30 days (Recommended)
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Your account will be scheduled for deletion. You can cancel anytime before the deletion date.
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedGracePeriod(false)}
                  className={`w-full p-4 rounded-xl border-2 transition-colors text-left
                    ${!selectedGracePeriod
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5
                      ${!selectedGracePeriod ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    >
                      {!selectedGracePeriod && (
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        Delete immediately
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Your account and all data will be permanently deleted right now. This cannot be undone.
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* Confirm Button */}
              <motion.button
                onClick={handleConfirmDeletion}
                disabled={deleting}
                className="w-full py-4 bg-red-600 text-white rounded-xl font-semibold text-lg
                         disabled:opacity-50 disabled:cursor-not-allowed
                         active:bg-red-700 transition-colors
                         flex items-center justify-center gap-2"
                whileTap={{ scale: deleting ? 1 : 0.98 }}
              >
                {deleting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.div>
                    {selectedGracePeriod ? 'Scheduling Deletion...' : 'Deleting Account...'}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    {selectedGracePeriod ? 'Schedule Deletion' : 'Delete Account Now'}
                  </>
                )}
              </motion.button>

              <button
                onClick={() => router.back()}
                disabled={deleting}
                className="w-full py-3 text-gray-600 dark:text-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
