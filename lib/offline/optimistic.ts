/**
 * Optimistic Update Manager for immediate UI feedback
 *
 * This module provides an OptimisticUpdateManager class that coordinates
 * immediate local updates with operation queueing. Changes appear instantly
 * in the UI before sync completes, creating a "feels native" experience.
 */

import { queueManager } from './queue';
import { createOperation, updateOperation, deleteOperation } from './operations';
import * as stores from '@/lib/db/stores';

export type OptimisticUpdate<T> = {
  id: string; // UUID for this optimistic update
  operation_id: string; // Links to queued operation
  rollback: () => Promise<void>; // Function to undo the change
  status: 'pending' | 'committed' | 'rolled_back';
  data: T; // The optimistic data
};

export class OptimisticUpdateManager {
  private updates = new Map<string, OptimisticUpdate<any>>();

  /**
   * Create expense optimistically
   * Immediately adds to IndexedDB and queues for sync
   */
  async createExpense(expense: any): Promise<string> {
    // 1. Generate ID for the expense
    const expense_id = crypto.randomUUID();
    const expense_with_id = { ...expense, id: expense_id, sync_status: 'pending' };

    // 2. Add to IndexedDB immediately (optimistic)
    await stores.createExpense(expense_with_id);

    // 3. Queue operation for sync
    const operation = createOperation('expenses', expense_id, expense_with_id);
    await queueManager.enqueue(operation);

    // 4. Track optimistic update with rollback function
    const update: OptimisticUpdate<any> = {
      id: crypto.randomUUID(),
      operation_id: operation.id,
      rollback: async () => {
        await stores.deleteExpense(expense_id);
      },
      status: 'pending',
      data: expense_with_id
    };
    this.updates.set(update.id, update);

    return expense_id;
  }

  /**
   * Update expense optimistically
   * Immediately applies update to IndexedDB and queues for sync
   */
  async updateExpense(id: string, updates: any): Promise<void> {
    // 1. Get original values for rollback
    const original = await stores.getExpense(id);
    if (!original) throw new Error('Expense not found');

    // 2. Apply update immediately (optimistic)
    await stores.updateExpense(id, { ...updates, sync_status: 'pending' });

    // 3. Queue operation for sync
    const operation = updateOperation('expenses', id, updates, original);
    await queueManager.enqueue(operation);

    // 4. Track optimistic update with rollback
    const update: OptimisticUpdate<any> = {
      id: crypto.randomUUID(),
      operation_id: operation.id,
      rollback: async () => {
        await stores.updateExpense(id, original);
      },
      status: 'pending',
      data: updates
    };
    this.updates.set(update.id, update);
  }

  /**
   * Delete expense optimistically (soft delete)
   * Immediately marks as deleted in IndexedDB and queues for sync
   */
  async deleteExpense(id: string): Promise<void> {
    // 1. Get original for rollback
    const original = await stores.getExpense(id);
    if (!original) throw new Error('Expense not found');

    // 2. Soft delete immediately
    await stores.deleteExpense(id);

    // 3. Queue operation
    const operation = deleteOperation('expenses', id);
    await queueManager.enqueue(operation);

    // 4. Track with rollback
    const update: OptimisticUpdate<any> = {
      id: crypto.randomUUID(),
      operation_id: operation.id,
      rollback: async () => {
        await stores.updateExpense(id, { is_deleted: false, deleted_at: null });
      },
      status: 'pending',
      data: { id }
    };
    this.updates.set(update.id, update);
  }

  /**
   * Commit optimistic update (after successful sync)
   * Marks update as committed and updates sync status in IndexedDB
   */
  async commit(operation_id: string): Promise<void> {
    const update = Array.from(this.updates.values())
      .find(u => u.operation_id === operation_id);

    if (update) {
      update.status = 'committed';
      // Update IndexedDB record to sync_status = 'synced'
      // Note: The sync engine already updates the record when sync completes
    }
  }

  /**
   * Rollback optimistic update (on sync failure)
   * Reverts the optimistic change in IndexedDB
   */
  async rollback(operation_id: string): Promise<void> {
    const update = Array.from(this.updates.values())
      .find(u => u.operation_id === operation_id);

    if (update && update.status === 'pending') {
      await update.rollback();
      update.status = 'rolled_back';
    }
  }

  /**
   * Get pending optimistic updates (for UI sync indicator)
   * Returns all updates that haven't been committed or rolled back
   */
  getPending(): OptimisticUpdate<any>[] {
    return Array.from(this.updates.values())
      .filter(u => u.status === 'pending');
  }
}

/**
 * Singleton instance of OptimisticUpdateManager for use throughout the app
 */
export const optimisticUpdateManager = new OptimisticUpdateManager();
