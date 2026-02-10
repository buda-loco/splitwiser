'use client';

import { useState, useMemo, useEffect } from 'react';
import type { ExpenseSplit } from '@/lib/db/types';
import type { ParticipantWithDetails } from '@/hooks/useParticipants';

export function SplitByShares({
  amount,
  participants,
  onChange
}: {
  amount: number;
  participants: ParticipantWithDetails[];
  onChange: (splits: ExpenseSplit[]) => void;
}) {
  // Track shares for each participant (initialize to 1 each)
  const [shares, setShares] = useState<Record<string, number>>(() => {
    return Object.fromEntries(
      participants.map(p => [
        p.user_id || p.participant_id || '',
        1
      ])
    );
  });

  // Calculate total shares
  const totalShares = useMemo(() => {
    return Object.values(shares).reduce((sum, s) => sum + s, 0);
  }, [shares]);

  // Calculate splits from shares
  const splits = useMemo(() => {
    if (totalShares === 0) return [];

    const perShare = amount / totalShares;

    return participants.map(participant => {
      const key = participant.user_id || participant.participant_id || '';
      const participantShares = shares[key] || 0;
      const calculatedAmount = perShare * participantShares;

      return {
        id: crypto.randomUUID(),
        expense_id: '',
        user_id: participant.user_id,
        participant_id: participant.participant_id,
        amount: Math.round(calculatedAmount * 100) / 100, // Round to 2 decimals
        split_type: 'shares' as const,
        split_value: participantShares,
        created_at: new Date().toISOString()
      };
    });
  }, [amount, participants, shares, totalShares]);

  // Update parent when splits change
  useEffect(() => {
    onChange(splits);
  }, [splits, onChange]);

  // Calculate verification
  const totalAmount = splits.reduce((sum, s) => sum + s.amount, 0);
  const amountValid = Math.abs(totalAmount - amount) < 0.01;
  const perShare = totalShares > 0 ? amount / totalShares : 0;

  const handleShareChange = (key: string, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setShares(prev => ({ ...prev, [key]: Math.max(0, numValue) }));
  };

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900 dark:text-white">Split by Shares</h3>

      {/* Show per-share amount */}
      {totalShares > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            ${perShare.toFixed(2)} per share × {totalShares} shares = ${amount.toFixed(2)}
          </p>
        </div>
      )}

      {/* Share inputs */}
      <div className="space-y-2">
        {participants.map(participant => {
          const key = participant.user_id || participant.participant_id || '';
          const participantShares = shares[key] || 0;
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
                  value={participantShares}
                  onChange={(e) => handleShareChange(key, e.target.value)}
                  min="0"
                  step="1"
                  aria-label={`Shares for ${participant.name}`}
                  className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded text-right"
                />
                <span className="text-gray-600 dark:text-gray-400 w-16">
                  {participantShares === 1 ? 'share' : 'shares'}
                </span>
                <span className="w-20 text-right font-medium text-gray-900 dark:text-white">
                  ${split?.amount.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rounding warning */}
      {!amountValid && (
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
            <span className="text-gray-600 dark:text-gray-400">{totalShares} shares</span>
            <span className="font-semibold dark:text-white">${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
