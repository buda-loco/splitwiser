/**
 * IndexedDB wrapper for offline-first local storage
 *
 * This module provides the foundation for offline expense tracking by wrapping
 * the native IndexedDB API with a Promise-based interface. It handles database
 * initialization, versioning, and store creation for all expense-related data.
 */

// Database configuration
const DB_NAME = 'splitwiser-offline';
const DB_VERSION = 3; // Incremented for split_templates and template_participants stores

// Store names matching our schema
export const STORES = {
  EXPENSES: 'expenses',
  EXPENSE_PARTICIPANTS: 'expense_participants',
  EXPENSE_SPLITS: 'expense_splits',
  EXPENSE_TAGS: 'expense_tags',
  SETTLEMENTS: 'settlements',
  EXPENSE_VERSIONS: 'expense_versions',
  SYNC_QUEUE: 'sync_queue', // For pending operations
  EXCHANGE_RATES: 'exchange_rates', // For cached exchange rates
  SPLIT_TEMPLATES: 'split_templates', // For reusable split configurations
  TEMPLATE_PARTICIPANTS: 'template_participants', // For template participant mappings
} as const;

/**
 * Initialize the IndexedDB database
 *
 * Creates all necessary object stores with appropriate indexes for efficient querying.
 * Uses Promise-based API for better async/await support.
 *
 * @returns Promise resolving to IDBDatabase instance
 */
export function initDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create expenses store
      if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
        const expensesStore = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id' });
        expensesStore.createIndex('expense_date', 'expense_date', { unique: false });
        expensesStore.createIndex('is_deleted', 'is_deleted', { unique: false });
        expensesStore.createIndex('created_by_user_id', 'created_by_user_id', { unique: false });
        expensesStore.createIndex('sync_status', 'sync_status', { unique: false });
      }

      // Create expense_participants store
      if (!db.objectStoreNames.contains(STORES.EXPENSE_PARTICIPANTS)) {
        const participantsStore = db.createObjectStore(STORES.EXPENSE_PARTICIPANTS, { keyPath: 'id' });
        participantsStore.createIndex('expense_id', 'expense_id', { unique: false });
      }

      // Create expense_splits store
      if (!db.objectStoreNames.contains(STORES.EXPENSE_SPLITS)) {
        const splitsStore = db.createObjectStore(STORES.EXPENSE_SPLITS, { keyPath: 'id' });
        splitsStore.createIndex('expense_id', 'expense_id', { unique: false });
      }

      // Create expense_tags store
      if (!db.objectStoreNames.contains(STORES.EXPENSE_TAGS)) {
        const tagsStore = db.createObjectStore(STORES.EXPENSE_TAGS, { keyPath: 'id' });
        tagsStore.createIndex('expense_id', 'expense_id', { unique: false });
        tagsStore.createIndex('tag', 'tag', { unique: false });
      }

      // Create settlements store
      if (!db.objectStoreNames.contains(STORES.SETTLEMENTS)) {
        const settlementsStore = db.createObjectStore(STORES.SETTLEMENTS, { keyPath: 'id' });
        settlementsStore.createIndex('from_user_id', 'from_user_id', { unique: false });
        settlementsStore.createIndex('to_user_id', 'to_user_id', { unique: false });
        settlementsStore.createIndex('settlement_date', 'settlement_date', { unique: false });
      }

      // Create expense_versions store
      if (!db.objectStoreNames.contains(STORES.EXPENSE_VERSIONS)) {
        const versionsStore = db.createObjectStore(STORES.EXPENSE_VERSIONS, { keyPath: 'id' });
        versionsStore.createIndex('expense_id', 'expense_id', { unique: false });
      }

      // Create sync_queue store for tracking pending operations
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
        syncStore.createIndex('status', 'status', { unique: false });
      }

      // Create exchange_rates store for cached currency exchange rates
      if (!db.objectStoreNames.contains(STORES.EXCHANGE_RATES)) {
        const ratesStore = db.createObjectStore(STORES.EXCHANGE_RATES, { keyPath: 'base_currency' });
        ratesStore.createIndex('expires_at', 'expires_at', { unique: false });
      }

      // Create split_templates store for reusable split configurations
      if (!db.objectStoreNames.contains(STORES.SPLIT_TEMPLATES)) {
        const templatesStore = db.createObjectStore(STORES.SPLIT_TEMPLATES, { keyPath: 'id' });
        templatesStore.createIndex('created_by_user_id', 'created_by_user_id', { unique: false });
        templatesStore.createIndex('sync_status', 'sync_status', { unique: false });
      }

      // Create template_participants store for template participant mappings
      if (!db.objectStoreNames.contains(STORES.TEMPLATE_PARTICIPANTS)) {
        const templateParticipantsStore = db.createObjectStore(STORES.TEMPLATE_PARTICIPANTS, { keyPath: 'id' });
        templateParticipantsStore.createIndex('template_id', 'template_id', { unique: false });
      }
    };
  });
}

/**
 * Get database instance
 * Opens connection if not already open
 */
export async function getDatabase(): Promise<IDBDatabase> {
  return initDatabase();
}

/**
 * Wrapper for IndexedDB request as Promise
 */
export function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Wrapper for IndexedDB transaction as Promise
 */
export function promisifyTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(new Error('Transaction aborted'));
  });
}
