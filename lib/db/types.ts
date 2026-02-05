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
