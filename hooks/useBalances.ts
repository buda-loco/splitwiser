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
 * @returns Object with balances (BalanceResult or null), loading state, and simplified toggle
 */
export function useBalances() {
  const [balances, setBalances] = useState<BalanceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [simplified, setSimplified] = useState(false);

  useEffect(() => {
    async function loadBalances() {
      try {
        setLoading(true);
        const result = await calculateBalances({ simplified });
        setBalances(result);
      } catch (error) {
        console.error('Failed to load balances:', error);
        setBalances(null);
      } finally {
        setLoading(false);
      }
    }

    loadBalances();
  }, [simplified]); // Recalculate when simplified toggle changes

  return { balances, loading, simplified, setSimplified };
}
