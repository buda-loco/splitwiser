'use client';

import { useState, useEffect } from 'react';
import { calculateBalances } from '@/lib/balances/calculator';
import type { BalanceResult } from '@/lib/balances/types';
import type { CurrencyCode } from '@/lib/currency/types';

/**
 * Hook to provide balance calculations with loading states
 *
 * Wraps the balance calculation engine with React state management.
 * Loads balances on mount and provides loading state for UI feedback.
 *
 * Pattern: Follows useParticipants pattern from Phase 4 - loads data on mount,
 * provides loading state. Listens for settlement changes to trigger re-calculation
 * so that balance view updates immediately after settlements are recorded.
 *
 * @returns Object with balances, loading state, simplified toggle, and currency selector
 */
export function useBalances() {
  const [balances, setBalances] = useState<BalanceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [simplified, setSimplified] = useState(false);
  const [targetCurrency, setTargetCurrency] = useState<CurrencyCode>('AUD');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load balances function
  const loadBalances = async () => {
    try {
      setLoading(true);
      const result = await calculateBalances({
        simplified,
        targetCurrency,
      });
      setBalances(result);
    } catch (error) {
      console.error('Failed to load balances:', error);
      setBalances(null);
    } finally {
      setLoading(false);
    }
  };

  // Load balances on mount and when options change
  useEffect(() => {
    loadBalances();
  }, [simplified, targetCurrency, refreshTrigger]); // Recalculate when any changes

  // Listen for settlement changes via custom events
  useEffect(() => {
    const handleSettlementChange = () => {
      // Trigger re-calculation by incrementing refresh trigger
      setRefreshTrigger(prev => prev + 1);
    };

    // Listen for settlement creation/deletion events
    window.addEventListener('settlement-created', handleSettlementChange);
    window.addEventListener('settlement-deleted', handleSettlementChange);

    // Also poll for changes every 5 seconds when tab is active (fallback)
    const pollInterval = setInterval(() => {
      if (!document.hidden) {
        handleSettlementChange();
      }
    }, 5000);

    return () => {
      window.removeEventListener('settlement-created', handleSettlementChange);
      window.removeEventListener('settlement-deleted', handleSettlementChange);
      clearInterval(pollInterval);
    };
  }, []);

  return {
    balances,
    loading,
    simplified,
    setSimplified,
    targetCurrency,
    setTargetCurrency,
    refresh: () => setRefreshTrigger(prev => prev + 1), // Manual refresh function
  };
}
