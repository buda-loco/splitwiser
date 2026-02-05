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
