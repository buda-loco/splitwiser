'use client';

import { useEffect, useState } from 'react';
import { realtimeManager } from '@/lib/realtime/subscriptions';
import type { RealtimeEvent } from '@/lib/realtime/subscriptions';
import { useAuth } from '@/lib/contexts/AuthContext';

/**
 * React hook for subscribing to realtime expense updates
 *
 * Automatically subscribes to expense changes for the current user
 * and triggers re-renders when changes occur from other users.
 *
 * @example
 * ```tsx
 * function ExpenseList() {
 *   const { lastEvent, isConnected } = useRealtimeExpenses();
 *   const [expenses, setExpenses] = useState([]);
 *
 *   // Fetch expenses from IndexedDB
 *   useEffect(() => {
 *     async function loadExpenses() {
 *       const data = await stores.getExpenses();
 *       setExpenses(data);
 *     }
 *     loadExpenses();
 *   }, [lastEvent]); // Re-fetch when lastEvent changes
 *
 *   return (
 *     <div>
 *       {isConnected && <div>🟢 Live</div>}
 *       {expenses.map(expense => <ExpenseRow key={expense.id} expense={expense} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRealtimeExpenses() {
  const { user } = useAuth();
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    setIsConnected(true);

    // Subscribe to expense changes for current user
    const unsubscribe = realtimeManager.subscribeToExpenses(
      user.id,
      (event) => {
        setLastEvent(event);
        // Trigger re-render by updating state
        // Components can use lastEvent to show notifications
      }
    );

    // Cleanup on unmount
    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [user]);

  return {
    lastEvent,
    isConnected
  };
}

/**
 * React hook for subscribing to realtime updates for a single expense
 *
 * Subscribes to splits and tags changes for a specific expense.
 * Useful when viewing or editing an expense detail page.
 *
 * @param expense_id - The expense ID to subscribe to, or null to not subscribe
 *
 * @example
 * ```tsx
 * function ExpenseDetailsPage({ expenseId }: { expenseId: string }) {
 *   const { lastEvent } = useRealtimeExpenseDetails(expenseId);
 *   const [splits, setSplits] = useState([]);
 *
 *   useEffect(() => {
 *     async function loadSplits() {
 *       const data = await stores.getExpenseSplits(expenseId);
 *       setSplits(data);
 *     }
 *     loadSplits();
 *   }, [expenseId, lastEvent]); // Re-fetch when lastEvent changes
 *
 *   return <div>Render splits here</div>;
 * }
 * ```
 */
export function useRealtimeExpenseDetails(expense_id: string | null) {
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  useEffect(() => {
    if (!expense_id) return;

    const unsubscribe = realtimeManager.subscribeToExpenseDetails(
      expense_id,
      (event) => {
        setLastEvent(event);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [expense_id]);

  return {
    lastEvent
  };
}
