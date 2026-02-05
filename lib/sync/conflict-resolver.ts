/**
 * Conflict resolution for concurrent edits during offline sync
 *
 * This module detects and resolves conflicts when both local and remote versions
 * of a record have been modified since the last sync. Uses timestamp-based
 * detection and configurable resolution strategies.
 */

import type { Operation } from '@/lib/offline/operations';

/**
 * Conflict resolution result with strategy used and merged record
 */
export type ConflictResolution =
  | { strategy: 'local_wins'; merged_record: any }
  | { strategy: 'remote_wins'; merged_record: any }
  | { strategy: 'manual'; local_record: any; remote_record: any; conflicts: string[] };

/**
 * ConflictResolver class for detecting and resolving sync conflicts
 */
export class ConflictResolver {
  /**
   * Detect if conflict exists by comparing timestamps
   *
   * Conflict exists if:
   * 1. Remote record updated_at > last_sync_time (remote changed)
   * 2. Local record local_updated_at > last_sync_time (local changed)
   * 3. Both timestamps newer than last sync = concurrent edit
   */
  detectConflict(
    local_record: any,
    remote_record: any,
    last_sync_time: string
  ): boolean {
    const remoteChanged = new Date(remote_record.updated_at) > new Date(last_sync_time);
    const localChanged = new Date(local_record.local_updated_at) > new Date(last_sync_time);
    return remoteChanged && localChanged;
  }

  /**
   * Resolve conflict using configured strategy
   *
   * @param operation - The operation being synced
   * @param local_record - Local version of the record
   * @param remote_record - Remote version of the record
   * @param strategy - Resolution strategy to use
   */
  async resolve(
    operation: Operation,
    local_record: any,
    remote_record: any,
    strategy: 'last_write_wins' | 'manual'
  ): Promise<ConflictResolution> {
    if (strategy === 'last_write_wins') {
      // Compare updated_at timestamps
      const localNewer = new Date(local_record.local_updated_at) >
                         new Date(remote_record.updated_at);

      if (localNewer) {
        return {
          strategy: 'local_wins',
          merged_record: local_record
        };
      } else {
        return {
          strategy: 'remote_wins',
          merged_record: remote_record
        };
      }
    } else {
      // Manual resolution - detect which fields conflict
      const conflicts = this.detectFieldConflicts(local_record, remote_record);
      return {
        strategy: 'manual',
        local_record,
        remote_record,
        conflicts
      };
    }
  }

  /**
   * Compare fields to find specific conflicts
   * Checks common expense fields for differences
   */
  private detectFieldConflicts(local: any, remote: any): string[] {
    const conflicts: string[] = [];
    const fields = ['amount', 'description', 'category', 'expense_date'];

    for (const field of fields) {
      if (local[field] !== remote[field]) {
        conflicts.push(field);
      }
    }

    return conflicts;
  }

  /**
   * Merge records using field-level strategy
   * For manual resolution: merge field by field based on user choices
   *
   * @param local - Local version of record
   * @param remote - Remote version of record
   * @param field_strategy - Map of field name to 'local' or 'remote' choice
   */
  mergeRecords(local: any, remote: any, field_strategy: Record<string, 'local' | 'remote'>): any {
    // For manual resolution: merge field by field
    const merged = { ...remote }; // Start with remote as base

    for (const [field, strategy] of Object.entries(field_strategy)) {
      if (strategy === 'local') {
        merged[field] = local[field];
      }
    }

    return merged;
  }
}

/**
 * Singleton instance of ConflictResolver for use throughout the app
 */
export const conflictResolver = new ConflictResolver();
