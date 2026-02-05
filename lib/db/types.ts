/**
 * Database types for user profiles
 *
 * These types mirror the database schema defined in lib/db/schema.sql
 * and provide type safety for profile operations throughout the app.
 */

/**
 * Profile record as stored in the database
 */
export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  currency_preference: string;
  created_at: string;
  updated_at: string;
};

/**
 * Type for inserting a new profile
 * Omits auto-generated timestamp fields
 */
export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;

/**
 * Type for updating an existing profile
 * All fields are optional except id (which cannot be changed)
 */
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;

/**
 * Participant record as stored in the database
 *
 * Participants are non-registered users who can be added to expenses.
 * They have a name and optional contact info (email/phone) but no login credentials.
 * This supports the hybrid account model - participants can later claim their identity
 * by signing up, at which point claimed_by_user_id links them to their user account.
 */
export type Participant = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  claimed_by_user_id: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
};

/**
 * Type for inserting a new participant
 * Omits auto-generated fields (id, timestamps, claimed_by_user_id)
 * created_by_user_id is set automatically in server actions
 */
export type ParticipantInsert = Omit<Participant, 'id' | 'created_at' | 'updated_at' | 'claimed_by_user_id'>;

/**
 * Type for updating an existing participant
 * Only name, email, and phone can be updated
 */
export type ParticipantUpdate = Partial<Pick<Participant, 'name' | 'email' | 'phone'>>;

/**
 * Invite token record as stored in the database
 *
 * Invite tokens enable secure participant onboarding via invite links.
 * Security model: Raw tokens are sent in URLs, hashed tokens are stored in DB.
 * This prevents token theft if the database is compromised.
 */
export type InviteToken = {
  id: string;
  token_hash: string;
  participant_id: string;
  created_by_user_id: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

/**
 * Expense record as stored in the database
 */
export type Expense = {
  id: string;
  amount: number;
  currency: string;
  description: string;
  category: string | null;
  expense_date: string;
  paid_by_user_id: string | null;
  created_by_user_id: string;
  is_deleted: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/**
 * Offline-specific expense type with sync tracking
 */
export type OfflineExpense = Expense & {
  sync_status: 'pending' | 'synced' | 'conflict';
  local_updated_at: string; // For conflict detection
  manual_exchange_rate?: {
    from_currency: string;  // e.g., "EUR"
    to_currency: string;    // e.g., "AUD"
    rate: number;           // e.g., 1.65
  } | null;
};

/**
 * Expense participant record linking expenses to users or non-registered participants
 */
export type ExpenseParticipant = {
  id: string;
  expense_id: string;
  user_id: string | null;
  participant_id: string | null;
  created_at: string;
};

/**
 * Expense split record showing how an expense is divided
 */
export type ExpenseSplit = {
  id: string;
  expense_id: string;
  user_id: string | null;
  participant_id: string | null;
  amount: number;
  split_type: 'equal' | 'percentage' | 'shares' | 'exact';
  split_value: number | null;
  created_at: string;
};

/**
 * Expense tag record for organizing expenses
 */
export type ExpenseTag = {
  id: string;
  expense_id: string;
  tag: string;
  created_at: string;
};

/**
 * Settlement record tracking when debts are paid back
 */
export type Settlement = {
  id: string;
  from_user_id: string | null;
  from_participant_id: string | null;
  to_user_id: string | null;
  to_participant_id: string | null;
  amount: number;
  currency: string;
  settlement_type: 'global' | 'tag_specific' | 'partial';
  tag: string | null;
  settlement_date: string;
  created_by_user_id: string;
  created_at: string;
};

/**
 * Expense version record for tracking edit history
 */
export type ExpenseVersion = {
  id: string;
  expense_id: string;
  version_number: number;
  changed_by_user_id: string;
  change_type: 'created' | 'updated' | 'deleted' | 'restored';
  changes: any; // jsonb field with before/after diff
  created_at: string;
};

/**
 * Sync queue item for tracking pending operations that need to be synced
 */
export type SyncQueueItem = {
  id: string;
  operation: 'create' | 'update' | 'delete';
  table: string;
  record_id: string;
  payload: any;
  status: 'pending' | 'synced' | 'failed';
  created_at: string;
  error_message?: string;
};
