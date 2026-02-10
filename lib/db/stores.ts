/**
 * Typed CRUD operations for IndexedDB stores
 *
 * This module provides Promise-based CRUD operations for all entity types
 * in the offline-first architecture. All operations use IndexedDB transactions
 * and are designed to work without network connectivity.
 */

import { getDatabase, promisifyRequest, STORES } from './indexeddb';
import type {
  OfflineExpense,
  ExpenseCreateInput,
  ExpenseParticipant,
  ExpenseSplit,
  ExpenseTag,
  Settlement,
  SyncQueueItem,
  OfflineSplitTemplate,
  TemplateParticipant,
  TemplateCreateInput,
  SplitTemplate,
  OfflineExpenseVersion,
  Expense,
} from './types';

// =====================================================
// Version Tracking Helper
// =====================================================

/**
 * Record a version change for an expense
 */
async function recordExpenseVersion(
  db: IDBDatabase,
  expense_id: string,
  changed_by_user_id: string,
  change_type: 'created' | 'updated' | 'deleted' | 'restored',
  before: Partial<Expense> | null,
  after: Partial<Expense> | null
): Promise<void> {
  const tx = db.transaction([STORES.EXPENSES, STORES.EXPENSE_VERSIONS], 'readwrite');
  const expense = await promisifyRequest(tx.objectStore(STORES.EXPENSES).get(expense_id));
  if (!expense) return;

  const version: OfflineExpenseVersion = {
    id: crypto.randomUUID(),
    expense_id,
    version_number: expense.version,
    changed_by_user_id,
    change_type,
    changes: {
      before: before || null,
      after: after || null
    },
    created_at: new Date().toISOString(),
    sync_status: 'pending',
    local_updated_at: new Date().toISOString()
  };

  await promisifyRequest(tx.objectStore(STORES.EXPENSE_VERSIONS).put(version));
}

// =====================================================
// Expense Operations
// =====================================================

/**
 * Create a new expense in local storage
 * Generates UUID and tracks as pending sync
 */
/**
 * Create a new expense in local storage
 * Generates UUID and tracks as pending sync
 */
export async function createExpense(
  expense: ExpenseCreateInput
): Promise<string> {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newExpense: OfflineExpense = {
    id,
    amount: expense.amount,
    currency: expense.currency,
    description: expense.description,
    category: expense.category,
    expense_date: expense.expense_date,
    paid_by_user_id: expense.paid_by_user_id ?? null,
    created_by_user_id: expense.created_by_user_id,
    is_deleted: false,
    version: 1,
    deleted_at: null,
    created_at: now,
    updated_at: now,
    sync_status: 'pending',
    local_updated_at: now,
    manual_exchange_rate: expense.manual_exchange_rate ?? null,
  };

  const transaction = db.transaction([STORES.EXPENSES, STORES.EXPENSE_VERSIONS], 'readwrite');
  const store = transaction.objectStore(STORES.EXPENSES);
  await promisifyRequest(store.add(newExpense));

  // Record version for creation
  const version: OfflineExpenseVersion = {
    id: crypto.randomUUID(),
    expense_id: id,
    version_number: 1,
    changed_by_user_id: expense.created_by_user_id,
    change_type: 'created',
    changes: {
      before: null,
      after: {
        amount: expense.amount,
        currency: expense.currency,
        description: expense.description,
        category: expense.category,
        expense_date: expense.expense_date,
        paid_by_user_id: expense.paid_by_user_id ?? null,
      }
    },
    created_at: now,
    sync_status: 'pending',
    local_updated_at: now
  };
  await promisifyRequest(transaction.objectStore(STORES.EXPENSE_VERSIONS).add(version));

  // Wait for transaction to complete
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(new Error('Transaction aborted'));
  });

  return id;
}



/**
 * Get a single expense by ID
 */
export async function getExpense(id: string): Promise<OfflineExpense | null> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.EXPENSES], 'readonly');
  const store = transaction.objectStore(STORES.EXPENSES);
  const result = await promisifyRequest(store.get(id));
  return result || null;
}

/**
 * Get all expenses with optional filtering
 */
export async function getExpenses(filters?: {
  tag?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<OfflineExpense[]> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.EXPENSES, STORES.EXPENSE_TAGS], 'readonly');
  const expensesStore = transaction.objectStore(STORES.EXPENSES);

  let expenses = await promisifyRequest(expensesStore.getAll());

  // Filter by deleted status
  expenses = expenses.filter(e => !e.is_deleted);

  // Filter by date range
  if (filters?.startDate || filters?.endDate) {
    expenses = expenses.filter(e => {
      const expenseDate = new Date(e.expense_date);
      if (filters.startDate && expenseDate < filters.startDate) return false;
      if (filters.endDate && expenseDate > filters.endDate) return false;
      return true;
    });
  }

  // Filter by tag if specified
  if (filters?.tag) {
    const tagsStore = transaction.objectStore(STORES.EXPENSE_TAGS);
    const tagIndex = tagsStore.index('tag');
    const taggedExpenses = await promisifyRequest(tagIndex.getAll(filters.tag));
    const expenseIds = new Set(taggedExpenses.map(t => t.expense_id));
    expenses = expenses.filter(e => expenseIds.has(e.id));
  }

  return expenses;
}

/**
 * Update an existing expense
 */
export async function updateExpense(
  id: string,
  updates: Partial<OfflineExpense>,
  userId?: string
): Promise<void> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.EXPENSES, STORES.EXPENSE_VERSIONS], 'readwrite');
  const store = transaction.objectStore(STORES.EXPENSES);

  const existing = await promisifyRequest(store.get(id));
  if (!existing) {
    throw new Error(`Expense ${id} not found`);
  }

  // Capture before state (only relevant fields)
  const before: Partial<Expense> = {
    amount: existing.amount,
    currency: existing.currency,
    description: existing.description,
    category: existing.category,
    expense_date: existing.expense_date,
    paid_by_user_id: existing.paid_by_user_id,
  };

  const updated: OfflineExpense = {
    ...existing,
    ...updates,
    id, // Ensure id cannot be changed
    version: existing.version + 1,
    updated_at: new Date().toISOString(),
    local_updated_at: new Date().toISOString(),
    sync_status: 'pending',
  };

  await promisifyRequest(store.put(updated));

  // Capture after state (only changed fields)
  const after: Partial<Expense> = {
    amount: updated.amount,
    currency: updated.currency,
    description: updated.description,
    category: updated.category,
    expense_date: updated.expense_date,
    paid_by_user_id: updated.paid_by_user_id,
  };

  // Record version (only if userId provided)
  if (!userId) {
    // Wait for transaction to complete
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
    return;
  }
  const version: OfflineExpenseVersion = {
    id: crypto.randomUUID(),
    expense_id: id,
    version_number: updated.version,
    changed_by_user_id: userId,
    change_type: 'updated',
    changes: {
      before,
      after
    },
    created_at: new Date().toISOString(),
    sync_status: 'pending',
    local_updated_at: new Date().toISOString()
  };
  await promisifyRequest(transaction.objectStore(STORES.EXPENSE_VERSIONS).add(version));

  // Wait for transaction to complete
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(new Error('Transaction aborted'));
  });
}

/**
 * Soft delete an expense
 */
export async function deleteExpense(id: string, userId?: string): Promise<void> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.EXPENSES, STORES.EXPENSE_VERSIONS], 'readwrite');
  const store = transaction.objectStore(STORES.EXPENSES);

  const existing = await promisifyRequest(store.get(id));
  if (!existing) {
    throw new Error(`Expense ${id} not found`);
  }

  // Capture before state
  const before: Partial<Expense> = {
    amount: existing.amount,
    currency: existing.currency,
    description: existing.description,
    category: existing.category,
    expense_date: existing.expense_date,
    paid_by_user_id: existing.paid_by_user_id,
    is_deleted: existing.is_deleted,
    deleted_at: existing.deleted_at,
  };

  const updated: OfflineExpense = {
    ...existing,
    is_deleted: true,
    deleted_at: new Date().toISOString(),
    version: existing.version + 1,
    updated_at: new Date().toISOString(),
    local_updated_at: new Date().toISOString(),
    sync_status: 'pending',
  };

  await promisifyRequest(store.put(updated));

  // Record version (only if userId provided)
  if (!userId) {
    // Wait for transaction to complete
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
    return;
  }
  const version: OfflineExpenseVersion = {
    id: crypto.randomUUID(),
    expense_id: id,
    version_number: updated.version,
    changed_by_user_id: userId,
    change_type: 'deleted',
    changes: {
      before,
      after: {
        is_deleted: true,
        deleted_at: updated.deleted_at
      }
    },
    created_at: new Date().toISOString(),
    sync_status: 'pending',
    local_updated_at: new Date().toISOString()
  };
  await promisifyRequest(transaction.objectStore(STORES.EXPENSE_VERSIONS).add(version));

  // Wait for transaction to complete
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(new Error('Transaction aborted'));
  });
}

/**
 * Restore a deleted expense
 */
export async function restoreExpense(id: string, userId?: string): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction([STORES.EXPENSES, STORES.EXPENSE_VERSIONS], 'readwrite');

  const expense = await promisifyRequest(tx.objectStore(STORES.EXPENSES).get(id));
  if (!expense || !expense.is_deleted) return;

  const before = { is_deleted: true, deleted_at: expense.deleted_at };
  
  expense.is_deleted = false;
  expense.deleted_at = null;
  expense.version += 1;
  expense.updated_at = new Date().toISOString();
  expense.sync_status = 'pending';
  expense.local_updated_at = new Date().toISOString();

  await promisifyRequest(tx.objectStore(STORES.EXPENSES).put(expense));

  // Record version (only if userId provided)
  if (!userId) {
    // Wait for transaction to complete
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));
    });
    return;
  }
  const version: OfflineExpenseVersion = {
    id: crypto.randomUUID(),
    expense_id: id,
    version_number: expense.version,
    changed_by_user_id: userId,
    change_type: 'restored',
    changes: {
      before,
      after: { is_deleted: false }
    },
    created_at: new Date().toISOString(),
    sync_status: 'pending',
    local_updated_at: new Date().toISOString()
  };
  await promisifyRequest(tx.objectStore(STORES.EXPENSE_VERSIONS).add(version));

  // Wait for transaction to complete
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}

// =====================================================
// Expense Participant Operations
// =====================================================

/**
 * Add a participant to an expense
 */
export async function addParticipantToExpense(
  expense_id: string,
  user_id?: string,
  participant_id?: string
): Promise<string> {
  if (!user_id && !participant_id) {
    throw new Error('Either user_id or participant_id must be provided');
  }
  if (user_id && participant_id) {
    throw new Error('Cannot provide both user_id and participant_id');
  }

  const db = await getDatabase();
  const id = crypto.randomUUID();

  const participant: ExpenseParticipant = {
    id,
    expense_id,
    user_id: user_id || null,
    participant_id: participant_id || null,
    created_at: new Date().toISOString(),
  };

  const transaction = db.transaction([STORES.EXPENSE_PARTICIPANTS], 'readwrite');
  const store = transaction.objectStore(STORES.EXPENSE_PARTICIPANTS);
  await promisifyRequest(store.add(participant));

  return id;
}

/**
 * Get all participants for an expense
 */
export async function getExpenseParticipants(
  expense_id: string
): Promise<ExpenseParticipant[]> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.EXPENSE_PARTICIPANTS], 'readonly');
  const store = transaction.objectStore(STORES.EXPENSE_PARTICIPANTS);
  const index = store.index('expense_id');
  return promisifyRequest(index.getAll(expense_id));
}

/**
 * Remove a participant from an expense
 */
export async function removeParticipantFromExpense(
  expense_id: string,
  participant_id: string
): Promise<void> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.EXPENSE_PARTICIPANTS], 'readwrite');
  const store = transaction.objectStore(STORES.EXPENSE_PARTICIPANTS);

  // Find the participant record
  const index = store.index('expense_id');
  const participants = await promisifyRequest(index.getAll(expense_id));
  const toRemove = participants.find(p =>
    p.participant_id === participant_id || p.user_id === participant_id
  );

  if (toRemove) {
    await promisifyRequest(store.delete(toRemove.id));
  }
}

// =====================================================
// Expense Split Operations
// =====================================================

/**
 * Create a new split for an expense
 */
export async function createSplit(
  split: Omit<ExpenseSplit, 'id' | 'created_at'>
): Promise<string> {
  const db = await getDatabase();
  const id = crypto.randomUUID();

  const newSplit: ExpenseSplit = {
    ...split,
    id,
    created_at: new Date().toISOString(),
  };

  const transaction = db.transaction([STORES.EXPENSE_SPLITS], 'readwrite');
  const store = transaction.objectStore(STORES.EXPENSE_SPLITS);
  await promisifyRequest(store.add(newSplit));

  return id;
}

/**
 * Get all splits for an expense
 */
export async function getExpenseSplits(expense_id: string): Promise<ExpenseSplit[]> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.EXPENSE_SPLITS], 'readonly');
  const store = transaction.objectStore(STORES.EXPENSE_SPLITS);
  const index = store.index('expense_id');
  return promisifyRequest(index.getAll(expense_id));
}

/**
 * Update an existing split
 */
export async function updateSplit(
  id: string,
  updates: Partial<ExpenseSplit>
): Promise<void> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.EXPENSE_SPLITS], 'readwrite');
  const store = transaction.objectStore(STORES.EXPENSE_SPLITS);

  const existing = await promisifyRequest(store.get(id));
  if (!existing) {
    throw new Error(`Split ${id} not found`);
  }

  const updated: ExpenseSplit = {
    ...existing,
    ...updates,
    id, // Ensure id cannot be changed
  };

  await promisifyRequest(store.put(updated));
}

// =====================================================
// Expense Tag Operations
// =====================================================

/**
 * Add a tag to an expense
 */
export async function addTagToExpense(expense_id: string, tag: string): Promise<void> {
  const db = await getDatabase();
  const normalizedTag = tag.toLowerCase();

  // Check if tag already exists for this expense
  const transaction = db.transaction([STORES.EXPENSE_TAGS], 'readwrite');
  const store = transaction.objectStore(STORES.EXPENSE_TAGS);
  const index = store.index('expense_id');
  const existingTags = await promisifyRequest(index.getAll(expense_id));

  const alreadyExists = existingTags.some(t => t.tag === normalizedTag);
  if (alreadyExists) {
    return; // Tag already exists, no-op
  }

  const newTag: ExpenseTag = {
    id: crypto.randomUUID(),
    expense_id,
    tag: normalizedTag,
    created_at: new Date().toISOString(),
  };

  await promisifyRequest(store.add(newTag));
}

/**
 * Get all tags for an expense
 */
export async function getExpenseTags(expense_id: string): Promise<string[]> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.EXPENSE_TAGS], 'readonly');
  const store = transaction.objectStore(STORES.EXPENSE_TAGS);
  const index = store.index('expense_id');
  const tags = await promisifyRequest(index.getAll(expense_id));
  return tags.map(t => t.tag);
}

/**
 * Remove a tag from an expense
 */
export async function removeTagFromExpense(
  expense_id: string,
  tag: string
): Promise<void> {
  const db = await getDatabase();
  const normalizedTag = tag.toLowerCase();

  const transaction = db.transaction([STORES.EXPENSE_TAGS], 'readwrite');
  const store = transaction.objectStore(STORES.EXPENSE_TAGS);
  const index = store.index('expense_id');
  const tags = await promisifyRequest(index.getAll(expense_id));

  const toRemove = tags.find(t => t.tag === normalizedTag);
  if (toRemove) {
    await promisifyRequest(store.delete(toRemove.id));
  }
}

/**
 * Get all unique tags across all expenses
 */
export async function getAllTags(): Promise<string[]> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.EXPENSE_TAGS], 'readonly');
  const store = transaction.objectStore(STORES.EXPENSE_TAGS);
  const allTags = await promisifyRequest(store.getAll());

  // Get unique tags
  const uniqueTags = new Set(allTags.map(t => t.tag));
  return Array.from(uniqueTags).sort();
}

/**
 * Rename a tag across all expenses
 */
export async function renameTag(oldTag: string, newTag: string): Promise<void> {
  const db = await getDatabase();
  const normalizedOld = oldTag.toLowerCase();
  const normalizedNew = newTag.toLowerCase();

  if (normalizedOld === normalizedNew) return; // No-op

  const transaction = db.transaction([STORES.EXPENSE_TAGS], 'readwrite');
  const store = transaction.objectStore(STORES.EXPENSE_TAGS);
  const tagIndex = store.index('tag');

  // Get all expense_tags with old tag
  const oldTags = await promisifyRequest(tagIndex.getAll(normalizedOld));

  // For each, update to new tag (if new tag doesn't already exist for that expense)
  for (const tag of oldTags) {
    // Check if new tag already exists for this expense
    const expenseIndex = store.index('expense_id');
    const existingTags = await promisifyRequest(expenseIndex.getAll(tag.expense_id));
    const newTagExists = existingTags.some(t => t.tag === normalizedNew);

    if (newTagExists) {
      // Delete old tag (new already exists)
      await promisifyRequest(store.delete(tag.id));
    } else {
      // Update to new tag
      await promisifyRequest(store.put({ ...tag, tag: normalizedNew }));
    }
  }
}

/**
 * Merge multiple tags into a target tag
 */
export async function mergeTags(sourceTags: string[], targetTag: string): Promise<void> {
  // Rename each source tag to target tag (renameTag handles duplicates)
  for (const source of sourceTags) {
    await renameTag(source, targetTag);
  }
}

/**
 * Delete a tag from all expenses
 */
export async function deleteTag(tag: string): Promise<void> {
  const db = await getDatabase();
  const normalizedTag = tag.toLowerCase();

  const transaction = db.transaction([STORES.EXPENSE_TAGS], 'readwrite');
  const store = transaction.objectStore(STORES.EXPENSE_TAGS);
  const tagIndex = store.index('tag');

  const tags = await promisifyRequest(tagIndex.getAll(normalizedTag));

  for (const tagRecord of tags) {
    await promisifyRequest(store.delete(tagRecord.id));
  }
}

/**
 * Get tag usage statistics
 */
export async function getTagStats(): Promise<Map<string, number>> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.EXPENSE_TAGS], 'readonly');
  const store = transaction.objectStore(STORES.EXPENSE_TAGS);

  // Single scan: get all tag records and count per tag
  const allTagRecords: { tag: string; expense_id: string }[] = await promisifyRequest(store.getAll());
  const stats = new Map<string, Set<string>>();

  for (const record of allTagRecords) {
    if (!stats.has(record.tag)) {
      stats.set(record.tag, new Set());
    }
    stats.get(record.tag)!.add(record.expense_id);
  }

  // Convert Sets to counts
  const result = new Map<string, number>();
  for (const [tag, expenseIds] of stats) {
    result.set(tag, expenseIds.size);
  }
  return result;
}

// =====================================================
// Settlement Operations
// =====================================================

/**
 * Create a new settlement
 */
export async function createSettlement(
  settlement: Omit<Settlement, 'id' | 'created_at'>
): Promise<string> {
  const db = await getDatabase();
  const id = crypto.randomUUID();

  const newSettlement: Settlement = {
    ...settlement,
    id,
    created_at: new Date().toISOString(),
  };

  const transaction = db.transaction([STORES.SETTLEMENTS], 'readwrite');
  const store = transaction.objectStore(STORES.SETTLEMENTS);
  await promisifyRequest(store.add(newSettlement));

  return id;
}

/**
 * Get settlements, optionally filtered by user
 */
export async function getSettlements(user_id?: string): Promise<Settlement[]> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.SETTLEMENTS], 'readonly');
  const store = transaction.objectStore(STORES.SETTLEMENTS);

  if (!user_id) {
    return promisifyRequest(store.getAll());
  }

  // Get settlements where user is either from or to
  const fromIndex = store.index('from_user_id');
  const toIndex = store.index('to_user_id');

  const [fromSettlements, toSettlements] = await Promise.all([
    promisifyRequest(fromIndex.getAll(user_id)),
    promisifyRequest(toIndex.getAll(user_id)),
  ]);

  // Combine and deduplicate
  const settlementMap = new Map<string, Settlement>();
  [...fromSettlements, ...toSettlements].forEach(s => {
    settlementMap.set(s.id, s);
  });

  return Array.from(settlementMap.values());
}

/**
 * Delete a settlement by ID
 * Hard delete - settlements are immutable and can be re-created if needed
 */
export async function deleteSettlement(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const transaction = db.transaction([STORES.SETTLEMENTS], 'readwrite');
    const store = transaction.objectStore(STORES.SETTLEMENTS);

    // Check if settlement exists
    const existing = await promisifyRequest(store.get(id));
    if (!existing) {
      return false;
    }

    // Delete the settlement
    await promisifyRequest(store.delete(id));
    return true;
  } catch (error) {
    console.error('Failed to delete settlement:', error);
    return false;
  }
}

// =====================================================
// Version History Operations
// =====================================================

/**
 * Get all versions for an expense (sorted by version_number desc)
 */
export async function getExpenseVersions(expense_id: string): Promise<OfflineExpenseVersion[]> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.EXPENSE_VERSIONS], 'readonly');
  const store = transaction.objectStore(STORES.EXPENSE_VERSIONS);
  const index = store.index('expense_id');
  const versions = await promisifyRequest(index.getAll(expense_id));
  return versions.sort((a, b) => b.version_number - a.version_number);
}

/**
 * Get specific version by version_number
 */
export async function getExpenseVersion(expense_id: string, version_number: number): Promise<OfflineExpenseVersion | null> {
  const versions = await getExpenseVersions(expense_id);
  return versions.find(v => v.version_number === version_number) || null;
}

/**
 * Get all recent changes (for activity feed - limit to last 100)
 */
export async function getRecentExpenseChanges(limit: number = 100): Promise<OfflineExpenseVersion[]> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.EXPENSE_VERSIONS], 'readonly');
  const store = transaction.objectStore(STORES.EXPENSE_VERSIONS);
  const allVersions = await promisifyRequest(store.getAll());
  return allVersions
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

// =====================================================
// Sync Queue Operations
// =====================================================

/**
 * Add an operation to the sync queue
 */
export async function addToSyncQueue(
  item: Omit<SyncQueueItem, 'id' | 'created_at'>
): Promise<void> {
  const db = await getDatabase();

  const queueItem: SyncQueueItem = {
    ...item,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };

  const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
  const store = transaction.objectStore(STORES.SYNC_QUEUE);
  await promisifyRequest(store.add(queueItem));
}

/**
 * Get all pending sync items
 */
export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly');
  const store = transaction.objectStore(STORES.SYNC_QUEUE);
  const index = store.index('status');
  return promisifyRequest(index.getAll('pending'));
}

/**
 * Mark a sync item as completed
 */
export async function markSyncItemCompleted(id: string): Promise<void> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
  const store = transaction.objectStore(STORES.SYNC_QUEUE);

  const item = await promisifyRequest(store.get(id));
  if (!item) {
    throw new Error(`Sync item ${id} not found`);
  }

  const updated: SyncQueueItem = {
    ...item,
    status: 'synced',
  };

  await promisifyRequest(store.put(updated));
}

/**
 * Mark a sync item as failed with error message
 */
export async function markSyncItemFailed(id: string, error: string): Promise<void> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
  const store = transaction.objectStore(STORES.SYNC_QUEUE);

  const item = await promisifyRequest(store.get(id));
  if (!item) {
    throw new Error(`Sync item ${id} not found`);
  }

  const updated: SyncQueueItem = {
    ...item,
    status: 'failed',
    error_message: error,
  };

  await promisifyRequest(store.put(updated));
}

// =====================================================
// Split Template Operations
// =====================================================

/**
 * Create template with participants (atomic transaction)
 */
export async function createTemplate(template: TemplateCreateInput): Promise<OfflineSplitTemplate> {
  const db = await getDatabase();
  const tx = db.transaction([STORES.SPLIT_TEMPLATES, STORES.TEMPLATE_PARTICIPANTS], 'readwrite');

  const templateRecord: OfflineSplitTemplate = {
    id: crypto.randomUUID(),
    name: template.name,
    split_type: template.split_type,
    created_by_user_id: template.created_by_user_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sync_status: 'pending',
    local_updated_at: new Date().toISOString()
  };

  await promisifyRequest(tx.objectStore(STORES.SPLIT_TEMPLATES).add(templateRecord));

  for (const p of template.participants) {
    const participantRecord: TemplateParticipant = {
      id: crypto.randomUUID(),
      template_id: templateRecord.id,
      user_id: p.user_id || null,
      participant_id: p.participant_id || null,
      split_value: p.split_value || null,
      created_at: new Date().toISOString()
    };
    await promisifyRequest(tx.objectStore(STORES.TEMPLATE_PARTICIPANTS).add(participantRecord));
  }

  // Wait for transaction to complete
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });

  return templateRecord;
}

/**
 * Get all templates for user
 */
export async function getTemplatesByUser(userId?: string): Promise<OfflineSplitTemplate[]> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.SPLIT_TEMPLATES], 'readonly');
  const store = transaction.objectStore(STORES.SPLIT_TEMPLATES);
  const index = store.index('created_by_user_id');
  return promisifyRequest(index.getAll(userId));
}

/**
 * Get template by ID with participants
 */
export async function getTemplateById(templateId: string): Promise<{ template: OfflineSplitTemplate; participants: TemplateParticipant[] } | null> {
  const db = await getDatabase();

  // Get template
  const templateTx = db.transaction([STORES.SPLIT_TEMPLATES], 'readonly');
  const template = await promisifyRequest(templateTx.objectStore(STORES.SPLIT_TEMPLATES).get(templateId));
  if (!template) return null;

  // Get participants
  const participantsTx = db.transaction([STORES.TEMPLATE_PARTICIPANTS], 'readonly');
  const participantsIndex = participantsTx.objectStore(STORES.TEMPLATE_PARTICIPANTS).index('template_id');
  const participants = await promisifyRequest(participantsIndex.getAll(templateId));

  return { template, participants };
}

/**
 * Update template (name or split_type only)
 */
export async function updateTemplate(templateId: string, updates: { name?: string; split_type?: SplitTemplate['split_type'] }): Promise<void> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.SPLIT_TEMPLATES], 'readwrite');
  const store = transaction.objectStore(STORES.SPLIT_TEMPLATES);

  const template = await promisifyRequest(store.get(templateId));
  if (!template) throw new Error('Template not found');

  const updated: OfflineSplitTemplate = {
    ...template,
    ...updates,
    updated_at: new Date().toISOString(),
    sync_status: 'pending' as const,
    local_updated_at: new Date().toISOString()
  };

  await promisifyRequest(store.put(updated));
}

/**
 * Delete template (cascades to participants via transaction)
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction([STORES.SPLIT_TEMPLATES, STORES.TEMPLATE_PARTICIPANTS], 'readwrite');

  // Delete all participants first
  const participantsIndex = tx.objectStore(STORES.TEMPLATE_PARTICIPANTS).index('template_id');
  const participants = await promisifyRequest(participantsIndex.getAll(templateId));
  for (const p of participants) {
    await promisifyRequest(tx.objectStore(STORES.TEMPLATE_PARTICIPANTS).delete(p.id));
  }

  // Delete template
  await promisifyRequest(tx.objectStore(STORES.SPLIT_TEMPLATES).delete(templateId));

  // Wait for transaction to complete
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}
