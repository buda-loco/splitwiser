'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBalances } from '@/hooks/useBalances';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getParticipantDisplayName } from '@/lib/utils/display-name';
import { BalanceDetail } from './BalanceDetail';
import { SettlementForm } from './SettlementForm';
import { getAllTags } from '@/lib/db/stores';
import { calculateBalancesForTag } from '@/lib/balances/calculator';
import type { CurrencyCode } from '@/lib/currency/types';
import type { BalanceEntry, BalanceResult } from '@/lib/balances/types';

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
    balances: globalBalances,
    loading: globalLoading,
    simplified,
    setSimplified,
    targetCurrency,
    setTargetCurrency,
  } = useBalances();

  // Tag filter state
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagBalances, setTagBalances] = useState<BalanceResult | null>(null);
  const [loadingTagBalances, setLoadingTagBalances] = useState(false);

  // State for selected balance (to show detail modal)
  const [selectedBalance, setSelectedBalance] = useState<BalanceEntry | null>(null);

  // State for settlement form modal
  const [settlementBalance, setSettlementBalance] = useState<BalanceEntry | null>(null);
  const [settlementType, setSettlementType] = useState<'partial' | 'global' | 'tag_specific'>('partial');
  const [settlementTag, setSettlementTag] = useState<string | null>(null);

  // Load available tags
  useEffect(() => {
    getAllTags().then(setAvailableTags);
  }, []);

  // Calculate balances for selected tag
  useEffect(() => {
    if (selectedTag) {
      setLoadingTagBalances(true);
      calculateBalancesForTag(selectedTag, {
        simplified,
        targetCurrency,
      })
        .then(setTagBalances)
        .catch((error) => {
          console.error('Failed to calculate tag balances:', error);
          setTagBalances(null);
        })
        .finally(() => setLoadingTagBalances(false));
    } else {
      setTagBalances(null);
    }
  }, [selectedTag, simplified, targetCurrency]);

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

  // Use tag balances if tag filter is active, otherwise use global balances
  const balances = selectedTag ? tagBalances : globalBalances;
  const loading = selectedTag ? loadingTagBalances : globalLoading;

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Loading skeleton with shimmer */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden p-4">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 space-y-2">
                  {/* Name skeleton */}
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse" style={{ width: '60%' }} />
                  {/* Details skeleton */}
                  <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse" style={{ width: '40%' }} />
                </div>
                {/* Amount skeleton */}
                <div className="h-4 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (!balances || balances.balances.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-4xl mb-3">✓</div>
        <p className="text-ios-gray">
          {selectedTag
            ? `No outstanding balances for #${selectedTag}`
            : 'No outstanding balances'}
        </p>
        {selectedTag && (
          <button
            onClick={() => setSelectedTag(null)}
            className="mt-3 text-sm text-ios-blue hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tag filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Filter by Tag
        </label>
        <select
          value={selectedTag || ''}
          onChange={(e) => setSelectedTag(e.target.value || null)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-ios-blue"
        >
          <option value="">All Tags</option>
          {availableTags.map((tag) => (
            <option key={tag} value={tag}>
              #{tag}
            </option>
          ))}
        </select>
      </div>

      {/* Active filter badge */}
      {selectedTag && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
        >
          <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">
            Filtered by #{selectedTag}
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className="ml-auto px-2 py-1 text-xs text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors"
          >
            Clear filter
          </button>
        </motion.div>
      )}

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
        <AnimatePresence mode="popLayout">
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
              <motion.div
                key={`${balance.from.user_id || balance.from.participant_id}-${balance.to.user_id || balance.to.participant_id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout="position"
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 30,
                  delay: index < 5 ? index * 0.05 : 0
                }}
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
                    {selectedTag ? (
                      /* Tag filter active: Show "Settle Tag" button */
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSettlementType('tag_specific');
                          setSettlementTag(selectedTag);
                          setSettlementBalance(balance);
                        }}
                        className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full hover:bg-green-600 active:bg-green-700 transition-colors whitespace-nowrap"
                      >
                        Settle Tag
                      </motion.button>
                    ) : (
                      /* No filter: Show Settle All and Settle buttons */
                      <>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSettlementType('global');
                            setSettlementTag(null);
                            setSettlementBalance(balance);
                          }}
                          className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full hover:bg-green-600 active:bg-green-700 transition-colors whitespace-nowrap"
                        >
                          Settle All
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSettlementType('partial');
                            setSettlementTag(null);
                            setSettlementBalance(balance);
                          }}
                          className="px-3 py-1 bg-gray-400 dark:bg-gray-600 text-white text-xs font-semibold rounded-full hover:bg-gray-500 dark:hover:bg-gray-500 active:bg-gray-600 transition-colors"
                        >
                          Settle
                        </motion.button>
                      </>
                    )}
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
            </motion.div>
          );
        })}
        </AnimatePresence>
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
                  initialTag={settlementTag}
                  onSuccess={() => {
                    setSettlementBalance(null);
                    setSettlementType('partial'); // Reset to default
                    setSettlementTag(null);
                    // Optionally refresh balances here
                  }}
                  onCancel={() => {
                    setSettlementBalance(null);
                    setSettlementType('partial'); // Reset to default
                    setSettlementTag(null);
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
