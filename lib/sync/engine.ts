/**
 * Sync Engine for processing offline queue and syncing with Supabase
 *
 * This module provides a SyncEngine class that processes the operation queue
 * and syncs with Supabase, handling conflicts when multiple clients edit the
 * same record offline.
 */

import { queueManager } from '@/lib/offline/queue';
import { conflictResolver } from '@/lib/sync/conflict-resolver';
import { createClient } from '@/lib/supabase/client';
import { updateExpense } from '@/lib/db/stores';
import type { Operation } from '@/lib/offline/operations';

/**
 * Sync status information for UI display
 */
export type SyncStatus = {
  is_syncing: boolean;
  pending_operations: number;
  last_sync: string | null;
  sync_errors: string[];
};

/**
 * SyncEngine class for processing offline operations and syncing with Supabase
 */
export class SyncEngine {
  private syncing = false;
  private lastSyncTime: string | null = null;
  private lastSyncErrors: string[] = [];

  /**
   * Main sync method - processes entire queue
   * Handles all pending operations in FIFO order
   */
  async sync(): Promise<SyncStatus> {
    if (this.syncing) {
      return this.getStatus(); // Already syncing, return current status
    }

    this.syncing = true;
    const errors: string[] = [];

    try {
      const supabase = createClient();
      const operations = await queueManager.getPending();

      // Process operations in order (FIFO)
      for (const operation of operations) {
        try {
          await this.processOperation(operation, supabase);
          try {
            await queueManager.markSynced(operation.id);
          } catch (markErr) {
            // Operation succeeded but marking failed — don't misclassify as failed
            const msg = markErr instanceof Error ? markErr.message : String(markErr);
            errors.push(`Operation ${operation.id} synced but marking failed: ${msg}`);
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          errors.push(`Operation ${operation.id}: ${error.message}`);
          try {
            await queueManager.markFailed(operation.id, error.message);
          } catch {
            // Best-effort: if marking failed also fails, continue processing
          }
        }
      }

      this.lastSyncTime = new Date().toISOString();
      this.lastSyncErrors = errors;
    } finally {
      this.syncing = false;
    }

    return this.getStatus();
  }

  /**
   * Process single operation
   * Handles create, update, and delete operations with conflict resolution
   */
  private async processOperation(operation: Operation, supabase: ReturnType<typeof createClient>): Promise<void> {
    const { table, operation_type, record_id } = operation;
    const payload = 'payload' in operation ? operation.payload : undefined;

    if (operation_type === 'create') {
      const { error } = await supabase
        .from(table)
        .insert(payload);

      if (error) throw error;

    } else if (operation_type === 'update') {
      // Check for conflicts first
      const { data: remote_record, error: fetch_error } = await supabase
        .from(table)
        .select('*')
        .eq('id', record_id)
        .single();

      if (fetch_error) throw fetch_error;

      // Detect conflict
      const has_conflict = conflictResolver.detectConflict(
        payload, // local version
        remote_record, // remote version
        this.lastSyncTime || operation.timestamp
      );

      if (has_conflict) {
        // Resolve using last-write-wins
        const resolution = await conflictResolver.resolve(
          operation,
          payload,
          remote_record,
          'last_write_wins'
        );

        if (resolution.strategy === 'local_wins') {
          // Update Supabase with local version
          const { error } = await supabase
            .from(table)
            .update(resolution.merged_record)
            .eq('id', record_id);

          if (error) throw error;
        } else if (resolution.strategy === 'remote_wins') {
          // Remote wins - update local IndexedDB
          // (Pull remote changes into local store)
          await this.updateLocalStore(table, record_id, resolution.merged_record);
        } else {
          // Manual resolution - mark as conflict for later handling
          await queueManager.markConflict(operation.id, 'manual');
          throw new Error('Manual conflict resolution required');
        }
      } else {
        // No conflict - simple update
        const { error } = await supabase
          .from(table)
          .update(payload)
          .eq('id', record_id);

        if (error) throw error;
      }

    } else if (operation_type === 'delete') {
      const { error } = await supabase
        .from(table)
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', record_id);

      if (error) throw error;
    }
  }

  /**
   * Update local IndexedDB when remote wins conflict
   * Keeps IndexedDB in sync with Supabase after remote-wins resolution
   */
  private async updateLocalStore(table: string, record_id: string, record: Record<string, unknown>): Promise<void> {
    // Import appropriate store function based on table
    // Call updateExpense, updateSplit, etc. from stores.ts
    // This keeps IndexedDB in sync with Supabase after remote-wins resolution

    if (table === 'expenses') {
      await updateExpense(record_id, record);
    }
    // TODO: Add support for other tables (participants, splits, tags, settlements)
    // when needed in future phases
  }

  /**
   * Get current sync status
   * Returns information for UI display
   */
  getStatus(): SyncStatus {
    return {
      is_syncing: this.syncing,
      pending_operations: 0, // Synchronous fallback; use getStatusAsync() for real count
      last_sync: this.lastSyncTime,
      sync_errors: this.lastSyncErrors
    };
  }

  /**
   * Get current sync status with real pending operation count
   */
  async getStatusAsync(): Promise<SyncStatus> {
    const { pending } = await queueManager.getQueueSize();
    return {
      is_syncing: this.syncing,
      pending_operations: pending,
      last_sync: this.lastSyncTime,
      sync_errors: this.lastSyncErrors
    };
  }

  /**
   * Manual sync trigger for UI
   * Starts sync process if not already running
   */
  async triggerSync(): Promise<void> {
    await this.sync();
  }

  /**
   * Check if sync is needed (has pending operations)
   */
  async needsSync(): Promise<boolean> {
    const { pending } = await queueManager.getQueueSize();
    return pending > 0;
  }
}

/**
 * Singleton instance of SyncEngine for use throughout the app
 */
export const syncEngine = new SyncEngine();
