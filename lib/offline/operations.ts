/**
 * Operation type definitions and builder functions for offline queue
 *
 * This module defines typed operation structures for all mutation types
 * that can be performed offline and need to be synced later.
 * Each operation tracks what changed, when, and its sync status.
 */

import type {
  OfflineExpense,
  ExpenseParticipant,
  ExpenseSplit,
  ExpenseTag,
  Settlement,
} from '../db/types';

// =====================================================
// Base Operation Interface
// =====================================================

/**
 * Base operation interface that all specific operations extend
 */
export type Operation = {
  id: string; // UUID for the operation itself
  timestamp: string; // When operation was queued (ISO format)
  table: 'expenses' | 'expense_participants' | 'expense_splits' | 'expense_tags' | 'settlements';
  operation_type: 'create' | 'update' | 'delete';
  record_id: string; // UUID of the record being modified
  status: 'pending' | 'synced' | 'failed' | 'conflict';
  retry_count: number;
  error_message?: string;
  conflict_resolution?: 'local_wins' | 'remote_wins' | 'manual';
};

// =====================================================
// Expense Operations
// =====================================================

export type CreateExpenseOperation = Operation & {
  operation_type: 'create';
  table: 'expenses';
  payload: Omit<OfflineExpense, 'id' | 'created_at' | 'updated_at'>;
};

export type UpdateExpenseOperation = Operation & {
  operation_type: 'update';
  table: 'expenses';
  payload: Partial<OfflineExpense>;
  original_values: Partial<OfflineExpense>; // For conflict detection
};

export type DeleteExpenseOperation = Operation & {
  operation_type: 'delete';
  table: 'expenses';
  payload: { id: string };
};

// =====================================================
// Expense Participant Operations
// =====================================================

export type CreateParticipantOperation = Operation & {
  operation_type: 'create';
  table: 'expense_participants';
  payload: Omit<ExpenseParticipant, 'id' | 'created_at'>;
};

export type UpdateParticipantOperation = Operation & {
  operation_type: 'update';
  table: 'expense_participants';
  payload: Partial<ExpenseParticipant>;
  original_values: Partial<ExpenseParticipant>;
};

export type DeleteParticipantOperation = Operation & {
  operation_type: 'delete';
  table: 'expense_participants';
  payload: { id: string };
};

// =====================================================
// Expense Split Operations
// =====================================================

export type CreateSplitOperation = Operation & {
  operation_type: 'create';
  table: 'expense_splits';
  payload: Omit<ExpenseSplit, 'id' | 'created_at'>;
};

export type UpdateSplitOperation = Operation & {
  operation_type: 'update';
  table: 'expense_splits';
  payload: Partial<ExpenseSplit>;
  original_values: Partial<ExpenseSplit>;
};

export type DeleteSplitOperation = Operation & {
  operation_type: 'delete';
  table: 'expense_splits';
  payload: { id: string };
};

// =====================================================
// Expense Tag Operations
// =====================================================

export type CreateTagOperation = Operation & {
  operation_type: 'create';
  table: 'expense_tags';
  payload: Omit<ExpenseTag, 'id' | 'created_at'>;
};

export type DeleteTagOperation = Operation & {
  operation_type: 'delete';
  table: 'expense_tags';
  payload: { id: string };
};

// =====================================================
// Settlement Operations
// =====================================================

export type CreateSettlementOperation = Operation & {
  operation_type: 'create';
  table: 'settlements';
  payload: Omit<Settlement, 'id' | 'created_at'>;
};

export type UpdateSettlementOperation = Operation & {
  operation_type: 'update';
  table: 'settlements';
  payload: Partial<Settlement>;
  original_values: Partial<Settlement>;
};

export type DeleteSettlementOperation = Operation & {
  operation_type: 'delete';
  table: 'settlements';
  payload: { id: string };
};

// =====================================================
// Union Type for All Operations
// =====================================================

export type AnyOperation =
  | CreateExpenseOperation
  | UpdateExpenseOperation
  | DeleteExpenseOperation
  | CreateParticipantOperation
  | UpdateParticipantOperation
  | DeleteParticipantOperation
  | CreateSplitOperation
  | UpdateSplitOperation
  | DeleteSplitOperation
  | CreateTagOperation
  | DeleteTagOperation
  | CreateSettlementOperation
  | UpdateSettlementOperation
  | DeleteSettlementOperation;

// =====================================================
// Operation Builder Functions
// =====================================================

/**
 * Create a 'create' operation for any table
 */
export function createOperation<T extends Operation['table']>(
  table: T,
  record_id: string,
  payload: Record<string, unknown>
): AnyOperation {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    table,
    operation_type: 'create',
    record_id,
    status: 'pending',
    retry_count: 0,
    payload,
  } as AnyOperation;
}

/**
 * Create an 'update' operation for any table
 */
export function updateOperation<T extends Operation['table']>(
  table: T,
  record_id: string,
  payload: Record<string, unknown>,
  original_values: Record<string, unknown>
): AnyOperation {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    table,
    operation_type: 'update',
    record_id,
    status: 'pending',
    retry_count: 0,
    payload,
    original_values,
  } as AnyOperation;
}

/**
 * Create a 'delete' operation for any table
 */
export function deleteOperation<T extends Operation['table']>(
  table: T,
  record_id: string
): AnyOperation {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    table,
    operation_type: 'delete',
    record_id,
    status: 'pending',
    retry_count: 0,
    payload: { id: record_id },
  } as AnyOperation;
}
