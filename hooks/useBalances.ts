'use client';

import { useState, useEffect } from 'react';
import { calculateBalances } from '@/lib/balances/calculator';
import type { BalanceResult } from '@/lib/balances/types';

/**
 * Hook to provide balance calculations with loading states
 *
 * Wraps the balance calculation engine with React state management.
 * Loads balances on mount and provides loading state for UI feedback.
 *
 * Pattern: Follows useParticipants pattern from Phase 4 - loads data on mount,
 * provides loading state. In future plans, this will add real-time updates
 * when expenses change.
 *
 * @returns Object with balances (BalanceResult or null) and loading state
 */
export function useBalances() {
  const [balances, setBalances] = useState<BalanceResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBalances() {
      try {
        const result = await calculateBalances();
        setBalances(result);
      } catch (error) {
        console.error('Failed to load balances:', error);
        setBalances(null);
      } finally {
        setLoading(false);
      }
    }

    loadBalances();
  }, []); // Empty dependency array: balance calculation is pure function of all expenses

  return { balances, loading };
}
