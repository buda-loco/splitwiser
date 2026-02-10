'use client';

/**
 * React hook for optimistic mutations
 *
 * This hook wraps the OptimisticUpdateManager to provide easy component
 * integration. Enables instant UI updates for create/update/delete operations
 * without loading spinners, creating a native-feeling experience.
 */

import { useState, useCallback } from 'react';
import { optimisticUpdateManager } from '@/lib/offline/optimistic';
import type { OfflineExpense, ExpenseCreateInput } from '@/lib/db/types';

export type MutationState = {
  isLoading: boolean;
  error: Error | null;
  data: { id: string } | null;
};

/**
 * Hook for optimistic mutations on expenses
 * Provides create/update/delete functions with state management
 */
export function useOptimisticMutation() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
    data: null
  });

  /**
   * Create expense optimistically
   * UI updates immediately, sync happens in background
   */
  const createExpense = useCallback(async (expense: ExpenseCreateInput) => {
    setState({ isLoading: true, error: null, data: null });

    try {
      const id = await optimisticUpdateManager.createExpense(expense);
      setState({ isLoading: false, error: null, data: { id } });
      return id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ isLoading: false, error, data: null });
      throw error;
    }
  }, []);

  /**
   * Update expense optimistically
   * UI updates immediately, sync happens in background
   */
  const updateExpense = useCallback(async (id: string, updates: Partial<OfflineExpense>) => {
    setState({ isLoading: true, error: null, data: null });

    try {
      await optimisticUpdateManager.updateExpense(id, updates);
      setState({ isLoading: false, error: null, data: { id } });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ isLoading: false, error, data: null });
      throw error;
    }
  }, []);

  /**
   * Delete expense optimistically
   * UI updates immediately, sync happens in background
   */
  const deleteExpense = useCallback(async (id: string) => {
    setState({ isLoading: true, error: null, data: null });

    try {
      await optimisticUpdateManager.deleteExpense(id);
      setState({ isLoading: false, error: null, data: { id } });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ isLoading: false, error, data: null });
      throw error;
    }
  }, []);

  /**
   * Reset mutation state
   * Clears errors and data
   */
  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, data: null });
  }, []);

  return {
    createExpense,
    updateExpense,
    deleteExpense,
    reset,
    ...state
  };
}
