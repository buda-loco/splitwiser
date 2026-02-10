'use client';

import { useState, useMemo, useEffect } from 'react';
import type { ExpenseSplit } from '@/lib/db/types';
import type { ParticipantWithDetails } from '@/hooks/useParticipants';

export function SplitByPercentage({
  amount,
  participants,
  onChange
}: {
  amount: number;
  participants: ParticipantWithDetails[];
  onChange: (splits: ExpenseSplit[]) => void;
}) {
  // Track percentage for each participant
  const [percentages, setPercentages] = useState<Record<string, number>>(() => {
    // Initialize with equal percentages
    const equalPercentage = 100 / participants.length;
    return Object.fromEntries(
      participants.map(p => [
        p.user_id || p.participant_id || '',
        Math.floor(equalPercentage * 100) / 100
      ])
    );
  });

  // Calculate splits from percentages
  const splits = useMemo(() => {
    return participants.map(participant => {
      const key = participant.user_id || participant.participant_id || '';
      const percentage = percentages[key] || 0;
      const calculatedAmount = (amount * percentage) / 100;

      return {
        id: crypto.randomUUID(),
        expense_id: '',
        user_id: participant.user_id,
        participant_id: participant.participant_id,
        amount: Math.round(calculatedAmount * 100) / 100, // Round to 2 decimals
        split_type: 'percentage' as const,
        split_value: percentage,
        created_at: new Date().toISOString()
      };
    });
  }, [amount, participants, percentages]);

  // Update parent when splits change
  useEffect(() => {
    onChange(splits);
  }, [splits, onChange]);

  // Calculate totals for validation
  const totalPercentage = Object.values(percentages).reduce((sum, p) => sum + p, 0);
  const totalAmount = splits.reduce((sum, s) => sum + s.amount, 0);
  const percentageValid = Math.abs(totalPercentage - 100) < 0.01;
  const amountValid = Math.abs(totalAmount - amount) < 0.01;

  const handlePercentageChange = (key: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPercentages(prev => ({ ...prev, [key]: numValue }));
  };

  // Auto-adjust remaining percentage
  const handleAutoComplete = (key: string) => {
    const remaining = 100 - Object.entries(percentages)
      .filter(([k]) => k !== key)
      .reduce((sum, [, v]) => sum + v, 0);

    setPercentages(prev => ({ ...prev, [key]: Math.max(0, remaining) }));
  };

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900 dark:text-white">Split by Percentage</h3>

      {/* Percentage inputs */}
      <div className="space-y-2">
        {participants.map(participant => {
          const key = participant.user_id || participant.participant_id || '';
          const percentage = percentages[key] || 0;
          const split = splits.find(s =>
            (s.user_id && s.user_id === participant.user_id) ||
            (s.participant_id && s.participant_id === participant.participant_id)
          );

          return (
            <div key={key} className="flex items-center gap-3">
              <span className="flex-1 text-gray-900 dark:text-white">{participant.name}</span>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={percentage}
                  onChange={(e) => handlePercentageChange(key, e.target.value)}
                  onBlur={() => handleAutoComplete(key)}
                  min="0"
                  max="100"
                  step="0.01"
                  aria-label={`Percentage for ${participant.name}`}
                  className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded text-right"
                />
                <span className="text-gray-600 dark:text-gray-400">%</span>
                <span className="w-20 text-right font-medium text-gray-900 dark:text-white">
                  ${split?.amount.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation feedback */}
      {!percentageValid && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Percentages total {totalPercentage.toFixed(2)}% (should be 100%)
          </p>
        </div>
      )}

      {!amountValid && percentageValid && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Rounding difference: ${Math.abs(totalAmount - amount).toFixed(2)}
          </p>
        </div>
      )}

      {/* Total */}
      <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
        <div className="flex justify-between">
          <span className="font-semibold dark:text-white">Total</span>
          <div className="flex gap-4">
            <span className={percentageValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {totalPercentage.toFixed(2)}%
            </span>
            <span className="font-semibold dark:text-white">${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
