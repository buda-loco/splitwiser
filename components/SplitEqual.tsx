'use client';

import { useMemo, useEffect } from 'react';
import type { ExpenseSplit } from '@/lib/db/types';
import type { ParticipantWithDetails } from '@/hooks/useParticipants';

export function SplitEqual({
  amount,
  participants,
  onChange
}: {
  amount: number;
  participants: ParticipantWithDetails[];
  onChange: (splits: ExpenseSplit[]) => void;
}) {
  // Calculate equal split
  const splits = useMemo(() => {
    if (!amount || participants.length === 0) return [];

    // Divide amount equally
    const perPerson = amount / participants.length;

    // Handle rounding: distribute cents to first N people
    const baseAmount = Math.floor(perPerson * 100) / 100; // 2 decimal places
    const remainder = Math.round((amount - (baseAmount * participants.length)) * 100);

    return participants.map((participant, index) => ({
      id: crypto.randomUUID(),
      expense_id: '', // Will be filled when expense created
      user_id: participant.user_id,
      participant_id: participant.participant_id,
      amount: baseAmount + (index < remainder ? 0.01 : 0),
      split_type: 'equal' as const,
      split_value: null, // Not used for equal split
      created_at: new Date().toISOString()
    }));
  }, [amount, participants]);

  // Update parent when splits change
  useEffect(() => {
    onChange(splits);
  }, [splits, onChange]);

  // Verify total matches (should always be true)
  const total = splits.reduce((sum, split) => sum + split.amount, 0);
  const matches = Math.abs(total - amount) < 0.01;

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900">Split Equally</h3>

      {/* Show per-person amount */}
      {participants.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            ${(amount / participants.length).toFixed(2)} per person
          </p>
        </div>
      )}

      {/* Show breakdown */}
      <div className="space-y-2">
        {splits.map((split, index) => {
          const participant = participants[index];
          return (
            <div
              key={split.id}
              className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
            >
              <span className="text-gray-900">{participant.name}</span>
              <span className="font-medium text-gray-900">
                ${split.amount.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Total verification (should always match) */}
      {!matches && (
        <div className="text-xs text-red-600">
          Warning: Total ${total.toFixed(2)} doesn't match amount ${amount.toFixed(2)}
        </div>
      )}

      {/* Summary */}
      <div className="pt-2 border-t border-gray-300">
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
