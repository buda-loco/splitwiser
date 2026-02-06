'use client';

import { useState, useEffect } from 'react';
import { getSettlements } from '@/lib/db/stores';
import type { Settlement } from '@/lib/db/types';

/**
 * Hook to fetch and manage settlements
 * Automatically re-fetches when settlements change
 */
export function useSettlements() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSettlements = async () => {
    try {
      const items = await getSettlements();
      // Sort by settlement_date DESC (newest first)
      const sorted = items.sort((a, b) =>
        new Date(b.settlement_date).getTime() - new Date(a.settlement_date).getTime()
      );
      setSettlements(sorted);
    } catch (error) {
      console.error('Failed to load settlements:', error);
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettlements();

    // Re-fetch on interval to catch changes (simple approach)
    const interval = setInterval(loadSettlements, 5000);

    return () => clearInterval(interval);
  }, []);

  return { settlements, loading, refetch: loadSettlements };
}
