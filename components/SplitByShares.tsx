'use client';

import { useState, useMemo } from 'react';
import type { Participant, ExpenseSplit } from '@/lib/db/types';

export function SplitByShares({
  amount,
  participants,
  onChange
}: {
  amount: number;
  participants: Participant[];
  onChange: (splits: ExpenseSplit[]) => void;
}) {
  // Track shares for each participant (initialize to 1 each)
  const [shares, setShares] = useState<Record<string, number>>(() => {
    return Object.fromEntries(
      participants.map(p => [
        p.id,
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
      const key = participant.id;
      const participantShares = shares[key] || 0;
      const calculatedAmount = perShare * participantShares;

      return {
        id: crypto.randomUUID(),
        expense_id: '',
        user_id: participant.claimed_by_user_id,
        participant_id: participant.id,
        amount: Math.round(calculatedAmount * 100) / 100, // Round to 2 decimals
        split_type: 'shares' as const,
        split_value: participantShares,
        created_at: new Date().toISOString()
      };
    });
  }, [amount, participants, shares, totalShares]);

  // Update parent when splits change
  useMemo(() => {
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
      <h3 className="font-medium text-gray-900">Split by Shares</h3>

      {/* Show per-share amount */}
      {totalShares > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            ${perShare.toFixed(2)} per share × {totalShares} shares = ${amount.toFixed(2)}
          </p>
        </div>
      )}

      {/* Share inputs */}
      <div className="space-y-2">
        {participants.map(participant => {
          const key = participant.id;
          const participantShares = shares[key] || 0;
          const split = splits.find(s =>
            s.participant_id === participant.id
          );

          return (
            <div key={key} className="flex items-center gap-3">
              <span className="flex-1 text-gray-900">{participant.name}</span>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={participantShares}
                  onChange={(e) => handleShareChange(key, e.target.value)}
                  min="0"
                  step="1"
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-right"
                />
                <span className="text-gray-600 w-16">
                  {participantShares === 1 ? 'share' : 'shares'}
                </span>
                <span className="w-20 text-right font-medium text-gray-900">
                  ${split?.amount.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rounding warning */}
      {!amountValid && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            Rounding difference: ${Math.abs(totalAmount - amount).toFixed(2)}
          </p>
        </div>
      )}

      {/* Total */}
      <div className="pt-2 border-t border-gray-300">
        <div className="flex justify-between">
          <span className="font-semibold">Total</span>
          <div className="flex gap-4">
            <span className="text-gray-600">{totalShares} shares</span>
            <span className="font-semibold">${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
