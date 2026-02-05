---
phase: 03
plan: 04
subsystem: offline
tags: [indexeddb, offline-first, sync-queue, typescript]
requires: [03-03]
provides: [operation-queue, queue-manager, sync-tracking]
affects: [03-05, sync-engine]
tech-stack:
  added: []
  patterns: [queue-pattern, operation-tracking, fifo-queue]
key-files:
  created: [lib/offline/operations.ts, lib/offline/queue.ts]
  modified: []
key-decisions:
  - Use AnyOperation union type for type-safe queue operations
  - Builder functions return AnyOperation with proper payload typing
  - Keep last 100 synced operations for audit trail
  - FIFO processing order based on timestamp
issues-created: []
duration: 8 min
completed: 2026-02-06
---

# Phase 3 Plan 4: Offline Operation Queue Summary

**Persistent operation queue for tracking offline mutations**

## Accomplishments

- Defined typed operation structures for all mutation types (expenses, participants, splits, tags, settlements)
- Created operation builder functions with automatic UUID generation and timestamp tracking
- Implemented QueueManager class with complete queue manipulation API
- Queue persists across sessions via IndexedDB sync_queue store
- All operations tracked with status (pending/synced/failed/conflict) and retry count
- Foundation ready for sync engine implementation
- TypeScript compilation successful with strict type safety

## Files Created/Modified

### Created

- `lib/offline/operations.ts` - Operation type definitions and builder functions
  - Base Operation interface with sync tracking fields
  - Specific operation types for all tables (Create/Update/Delete variants)
  - AnyOperation union type for type-safe queue operations
  - Builder functions: createOperation, updateOperation, deleteOperation
  - All operations generate crypto.randomUUID() and ISO timestamps

- `lib/offline/queue.ts` - QueueManager class with queue manipulation methods
  - enqueue: Add operations to IndexedDB sync_queue
  - getPending: Get pending operations in FIFO order
  - getOperationsForRecord: Query operations for specific record (conflict detection)
  - markSynced: Mark operation as successfully synced
  - markFailed: Mark operation as failed with error and retry count
  - markConflict: Mark operation as conflicted with resolution strategy
  - remove: Delete operation from queue (manual cleanup)
  - getFailedOperations: Retrieve failed operations for retry
  - getQueueSize: Get statistics for UI display
  - clearSynced: Optional cleanup keeping last 100 for audit
  - Singleton queueManager instance exported

## Implementation Details

### Operation Structure

All operations extend base Operation interface:
- `id`: UUID for operation itself
- `timestamp`: ISO timestamp when queued
- `table`: Target table name
- `operation_type`: create/update/delete
- `record_id`: UUID of record being modified
- `status`: pending/synced/failed/conflict
- `retry_count`: Number of retry attempts
- `error_message`: Optional error details
- `conflict_resolution`: Optional resolution strategy

Specific operations add:
- `payload`: Data for create/update operations
- `original_values`: Original data for conflict detection (update only)

### Queue Manager Features

**Persistence**: All queue operations use IndexedDB transactions for durability across sessions and browser restarts.

**FIFO Processing**: getPending() sorts by timestamp ascending to ensure operations replay in order.

**Error Tracking**: Failed operations track error messages and increment retry count.

**Conflict Detection**: getOperationsForRecord() enables checking for conflicting operations on same record.

**Audit Trail**: Synced operations remain in queue, with optional cleanup keeping last 100.

**Statistics**: getQueueSize() provides counts for UI indicators (pending, failed, conflict).

## Decisions Made

1. **AnyOperation Union Type**: Created union type instead of using base Operation everywhere to preserve type safety for payload and original_values fields specific to operation types.

2. **Builder Function Return Type**: Builder functions return AnyOperation instead of specific types to avoid complex generic constraints while maintaining type safety at compile time.

3. **FIFO Queue Order**: Operations processed in timestamp order (oldest first) to maintain causality and prevent out-of-order sync issues.

4. **Audit Trail Retention**: Keep last 100 synced operations for debugging and audit purposes, with manual cleanup option.

5. **Status Tracking**: Four statuses (pending/synced/failed/conflict) cover all lifecycle states without overcomplicating the model.

6. **Error Context**: Store error messages and retry count directly in operation for debugging without requiring separate error log.

7. **Singleton Pattern**: Export singleton queueManager instance for convenient app-wide access without dependency injection complexity.

## Verification

All success criteria met:
- ✅ lib/offline/operations.ts created with operation type definitions
- ✅ Operation builder functions implemented with UUID and timestamp generation
- ✅ lib/offline/queue.ts created with QueueManager class
- ✅ All queue management methods implemented (enqueue, getPending, marking, removal, statistics)
- ✅ TypeScript compiles without errors (verified with npx tsc --noEmit)
- ✅ No network calls or sync logic in queue layer (deferred to Plan 05)
- ✅ Operations persist across sessions via IndexedDB

## Issues Encountered

None. Implementation completed without issues. TypeScript compilation successful with no errors.

## Next Step

Ready for 03-05-PLAN.md (Create sync engine with conflict resolution)
