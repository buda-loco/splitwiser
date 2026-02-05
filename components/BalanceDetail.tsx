'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { BalanceEntry } from '@/lib/balances/types';
import { getParticipantDisplayName } from '@/lib/utils/display-name';

type BalanceDetailProps = {
  balance: BalanceEntry;
  isOpen: boolean;
  onClose: () => void;
};

/**
 * BalanceDetail component - iOS sheet modal showing expense breakdown
 *
 * Displays which expenses contribute to a balance entry, providing
 * transparency and audit trail for all balance calculations.
 *
 * Features:
 * - iOS-native sheet modal with slide-up animation
 * - Expense list with descriptions, dates, and amounts
 * - Tap expense to navigate to expense detail
 * - Swipe/tap to dismiss
 * - Dark mode support
 * - Empty state for simplified view (no expense mapping available)
 */
export function BalanceDetail({ balance, isOpen, onClose }: BalanceDetailProps) {
  const router = useRouter();

  const fromName = getParticipantDisplayName(balance.from);
  const toName = getParticipantDisplayName(balance.to);

  const handleExpenseClick = (expenseId: string) => {
    router.push(`/expenses/${expenseId}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Sheet modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-xl z-50 max-h-[80vh] overflow-hidden"
          >
            {/* Drag handle */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Balance Details
                </h2>
                <button
                  onClick={onClose}
                  className="text-ios-blue dark:text-blue-400 font-medium"
                >
                  Done
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{fromName}</span> owes{' '}
                <span className="font-medium">{toName}</span>{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {balance.currency} {balance.amount.toFixed(2)}
                </span>
              </p>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-140px)] pb-safe">
              {!balance.expenses || balance.expenses.length === 0 ? (
                // Empty state for simplified view
                <div className="px-4 py-12 text-center">
                  <div className="text-4xl mb-3">ℹ️</div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Expense breakdown only available in direct view
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Toggle off "Simplified" mode to see which expenses contribute to this balance
                  </p>
                </div>
              ) : (
                <>
                  {/* Subtitle */}
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      From {balance.expenses.length} expense{balance.expenses.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Expense list */}
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {balance.expenses.map((expense) => (
                      <button
                        key={expense.id}
                        onClick={() => handleExpenseClick(expense.id)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {expense.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(expense.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                              <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Total: {balance.currency} {expense.amount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                              {balance.currency} {expense.split_amount.toFixed(2)}
                            </p>
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Total at bottom */}
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Total Amount
                      </p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">
                        {balance.currency} {balance.expenses.reduce((sum, e) => sum + e.split_amount, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
