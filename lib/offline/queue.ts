/**
 * Queue Manager for offline operations
 *
 * This module provides a QueueManager class that interfaces with the IndexedDB
 * sync_queue store and provides queue manipulation functions. All mutations
 * performed offline are tracked in this queue for later sync to Supabase.
 */

import { getDatabase, promisifyRequest, STORES } from '../db/indexeddb';
import type { Operation, AnyOperation } from './operations';

/**
 * QueueManager class for managing offline operation queue
 */
export class QueueManager {
  /**
   * Add an operation to the sync queue
   * Operation becomes persistent immediately via IndexedDB
   */
  async enqueue(operation: AnyOperation): Promise<void> {
    const db = await getDatabase();
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    try {
      await promisifyRequest(store.add(operation));
    } catch (error) {
      throw new Error(`Failed to enqueue operation: ${error}`);
    }
  }

  /**
   * Get all pending operations in chronological order (FIFO)
   * Returns operations sorted by timestamp ascending
   */
  async getPending(): Promise<AnyOperation[]> {
    const db = await getDatabase();
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('status');

    try {
      const operations = await promisifyRequest(index.getAll('pending'));

      // Sort by timestamp ascending (FIFO - oldest first)
      return operations.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } catch (error) {
      throw new Error(`Failed to get pending operations: ${error}`);
    }
  }

  /**
   * Get all operations for a specific record
   * Used for conflict detection and operation coalescing
   */
  async getOperationsForRecord(table: string, record_id: string): Promise<AnyOperation[]> {
    const db = await getDatabase();
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    try {
      const allOperations = await promisifyRequest(store.getAll());

      // Filter for matching table and record_id
      return allOperations.filter(
        (op) => op.table === table && op.record_id === record_id
      );
    } catch (error) {
      throw new Error(`Failed to get operations for record: ${error}`);
    }
  }

  /**
   * Mark an operation as successfully synced
   * Operation remains in queue for audit trail
   */
  async markSynced(operation_id: string): Promise<void> {
    const db = await getDatabase();
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    try {
      const operation = await promisifyRequest(store.get(operation_id));

      if (!operation) {
        throw new Error(`Operation ${operation_id} not found`);
      }

      const updated: AnyOperation = {
        ...operation,
        status: 'synced',
      };

      await promisifyRequest(store.put(updated));
    } catch (error) {
      throw new Error(`Failed to mark operation as synced: ${error}`);
    }
  }

  /**
   * Mark an operation as failed with error message
   * Increments retry count and stores error for debugging
   */
  async markFailed(operation_id: string, error: string): Promise<void> {
    const db = await getDatabase();
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    try {
      const operation = await promisifyRequest(store.get(operation_id));

      if (!operation) {
        throw new Error(`Operation ${operation_id} not found`);
      }

      const updated: AnyOperation = {
        ...operation,
        status: 'failed',
        retry_count: operation.retry_count + 1,
        error_message: error,
      };

      await promisifyRequest(store.put(updated));
    } catch (error) {
      throw new Error(`Failed to mark operation as failed: ${error}`);
    }
  }

  /**
   * Mark an operation as conflicted
   * Stores conflict resolution strategy if provided
   */
  async markConflict(
    operation_id: string,
    resolution?: 'local_wins' | 'remote_wins' | 'manual'
  ): Promise<void> {
    const db = await getDatabase();
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    try {
      const operation = await promisifyRequest(store.get(operation_id));

      if (!operation) {
        throw new Error(`Operation ${operation_id} not found`);
      }

      const updated: AnyOperation = {
        ...operation,
        status: 'conflict',
        conflict_resolution: resolution,
      };

      await promisifyRequest(store.put(updated));
    } catch (error) {
      throw new Error(`Failed to mark operation as conflict: ${error}`);
    }
  }

  /**
   * Remove an operation from the queue
   * Used for manual cleanup or after conflict resolution
   */
  async remove(operation_id: string): Promise<void> {
    const db = await getDatabase();
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    try {
      await promisifyRequest(store.delete(operation_id));
    } catch (error) {
      throw new Error(`Failed to remove operation: ${error}`);
    }
  }

  /**
   * Get all failed operations for retry
   * Returns operations that need to be retried
   */
  async getFailedOperations(): Promise<AnyOperation[]> {
    const db = await getDatabase();
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('status');

    try {
      return await promisifyRequest(index.getAll('failed'));
    } catch (error) {
      throw new Error(`Failed to get failed operations: ${error}`);
    }
  }

  /**
   * Get queue size statistics for UI display
   * Returns counts of operations by status
   */
  async getQueueSize(): Promise<{ pending: number; failed: number; conflict: number }> {
    const db = await getDatabase();
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('status');

    try {
      const [pending, failed, conflict] = await Promise.all([
        promisifyRequest(index.count('pending')),
        promisifyRequest(index.count('failed')),
        promisifyRequest(index.count('conflict')),
      ]);

      return { pending, failed, conflict };
    } catch (error) {
      throw new Error(`Failed to get queue size: ${error}`);
    }
  }

  /**
   * Clear synced operations from queue
   * Keeps recent operations for audit (last 100)
   * Used for optional queue cleanup
   */
  async clearSynced(): Promise<void> {
    const db = await getDatabase();
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('status');

    try {
      const syncedOperations = await promisifyRequest(index.getAll('synced'));

      // Sort by timestamp descending (newest first)
      syncedOperations.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Remove all but the most recent 100
      const toRemove = syncedOperations.slice(100);

      for (const operation of toRemove) {
        await promisifyRequest(store.delete(operation.id));
      }
    } catch (error) {
      throw new Error(`Failed to clear synced operations: ${error}`);
    }
  }
}

/**
 * Singleton instance of QueueManager for use throughout the app
 */
export const queueManager = new QueueManager();
