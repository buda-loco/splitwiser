'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBalances } from '@/hooks/useBalances';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getParticipantDisplayName } from '@/lib/utils/display-name';
import { BalanceDetail } from './BalanceDetail';
import { SettlementForm } from './SettlementForm';
import type { CurrencyCode } from '@/lib/currency/types';
import type { BalanceEntry } from '@/lib/balances/types';

const CURRENCIES: CurrencyCode[] = ['AUD', 'USD', 'EUR', 'GBP'];

/**
 * Balance view component displaying who owes whom
 *
 * Features:
 * - Simplified vs direct balance toggle
 * - Multi-currency selector to convert all balances to chosen currency
 * - iOS-native styling with proper dark mode support
 * - Loading and empty states
 * - Current user highlighting (green for owed to you, red for you owe, gray for others)
 */
export function BalanceView() {
  const { user } = useAuth();
  const {
    balances,
    loading,
    simplified,
    setSimplified,
    targetCurrency,
    setTargetCurrency,
  } = useBalances();

  // State for selected balance (to show detail modal)
  const [selectedBalance, setSelectedBalance] = useState<BalanceEntry | null>(null);

  // State for settlement form modal
  const [settlementBalance, setSettlementBalance] = useState<BalanceEntry | null>(null);
  const [settlementType, setSettlementType] = useState<'partial' | 'global'>('partial');

  // Determine if a balance entry involves the current user
  const getBalanceType = (balance: BalanceEntry): 'owed-to-me' | 'i-owe' | 'others' => {
    if (!user) return 'others';

    // You're owed money (someone owes you)
    if (balance.to.user_id === user.id) {
      return 'owed-to-me';
    }

    // You owe money
    if (balance.from.user_id === user.id) {
      return 'i-owe';
    }

    // Balance between others
    return 'others';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-ios-gray">Calculating balances...</p>
      </div>
    );
  }

  if (!balances || balances.balances.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-4xl mb-3">✓</div>
        <p className="text-ios-gray">No outstanding balances</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        {/* Left: Simplified toggle */}
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={simplified}
              onChange={(e) => setSimplified(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ios-blue rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-ios-blue"></div>
          </label>
          <span className="text-sm text-ios-gray">Simplified</span>
        </div>

        {/* Right: Currency selector */}
        <select
          value={targetCurrency}
          onChange={(e) => setTargetCurrency(e.target.value as CurrencyCode)}
          className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-ios-gray dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-ios-blue"
        >
          {CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </div>

      {/* Balance entries */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {balances.balances.map((balance, index) => {
          const balanceType = getBalanceType(balance);
          const fromName = getParticipantDisplayName(balance.from);
          const toName = getParticipantDisplayName(balance.to);

          // Color classes based on balance type
          let amountColorClass = 'text-gray-500 dark:text-gray-400'; // Others (gray)
          if (balanceType === 'owed-to-me') {
            amountColorClass = 'text-green-600 dark:text-green-500'; // Green for money owed to you
          } else if (balanceType === 'i-owe') {
            amountColorClass = 'text-red-600 dark:text-red-500'; // Red for money you owe
          }

          // Check if this balance has expense details (only in direct view)
          const hasExpenseDetails = !simplified && balance.expenses && balance.expenses.length > 0;

          return (
            <div
              key={`${balance.from.user_id || balance.from.participant_id}-${balance.to.user_id || balance.to.participant_id}-${index}`}
              className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <div className="flex items-center justify-between gap-3">
                <div
                  className={`flex-1 ${
                    hasExpenseDetails
                      ? 'cursor-pointer hover:opacity-70 active:opacity-50 transition-opacity'
                      : ''
                  }`}
                  onClick={() => hasExpenseDetails && setSelectedBalance(balance)}
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{fromName}</span>
                    {' owes '}
                    <span className="font-medium">{toName}</span>
                  </p>
                  {hasExpenseDetails && balance.expenses && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      From {balance.expenses.length} expense{balance.expenses.length !== 1 ? 's' : ''}
                    </p>
                  )}
                  {simplified && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">
                      Switch to direct view for breakdown
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className={`font-semibold ${amountColorClass}`}>
                    {balance.currency} {balance.amount.toFixed(2)}
                  </p>

                  {/* Settlement buttons */}
                  <div className="flex gap-1.5">
                    {/* Settle All button (primary) */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSettlementType('global');
                        setSettlementBalance(balance);
                      }}
                      className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full hover:bg-green-600 active:bg-green-700 transition-colors whitespace-nowrap"
                    >
                      Settle All
                    </motion.button>

                    {/* Partial Settle button (secondary) */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSettlementType('partial');
                        setSettlementBalance(balance);
                      }}
                      className="px-3 py-1 bg-gray-400 dark:bg-gray-600 text-white text-xs font-semibold rounded-full hover:bg-gray-500 dark:hover:bg-gray-500 active:bg-gray-600 transition-colors"
                    >
                      Settle
                    </motion.button>
                  </div>

                  {hasExpenseDetails && (
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
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="pt-2 px-4">
        <p className="text-sm text-ios-gray dark:text-gray-400">
          Total expenses: {balances.currency} {balances.total_expenses.toFixed(2)}
        </p>
      </div>

      {/* Balance detail modal */}
      {selectedBalance && (
        <BalanceDetail
          balance={selectedBalance}
          isOpen={true}
          onClose={() => setSelectedBalance(null)}
        />
      )}

      {/* Settlement form modal */}
      <AnimatePresence>
        {settlementBalance && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettlementBalance(null)}
              className="absolute inset-0 bg-black/50"
            />

            {/* Modal content */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Record Settlement
                </h2>

                <SettlementForm
                  initialBalance={settlementBalance}
                  initialSettlementType={settlementType}
                  onSuccess={() => {
                    setSettlementBalance(null);
                    setSettlementType('partial'); // Reset to default
                    // Optionally refresh balances here
                  }}
                  onCancel={() => {
                    setSettlementBalance(null);
                    setSettlementType('partial'); // Reset to default
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
