'use client';

import { useBalances } from '@/hooks/useBalances';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getParticipantDisplayName } from '@/lib/utils/display-name';
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

          return (
            <div
              key={`${balance.from.user_id || balance.from.participant_id}-${balance.to.user_id || balance.to.participant_id}-${index}`}
              className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{fromName}</span>
                    {' owes '}
                    <span className="font-medium">{toName}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${amountColorClass}`}>
                    {balance.currency} {balance.amount.toFixed(2)}
                  </p>
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
    </div>
  );
}
