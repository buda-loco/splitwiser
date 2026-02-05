'use server';

import { createClient } from '@/lib/supabase/server';
import type { Profile, ProfileInsert, ProfileUpdate } from '@/lib/db/types';

/**
 * Get a user profile by user ID
 *
 * @param userId - The UUID of the user to fetch
 * @returns The user's profile or null if not found
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getProfile:', error);
    return null;
  }
}

/**
 * Get the currently authenticated user's profile
 *
 * @returns The current user's profile or null if not authenticated or profile not found
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Error fetching current user:', authError);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching current user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCurrentUserProfile:', error);
    return null;
  }
}

/**
 * Insert or update a user profile
 * Uses Supabase upsert to handle both create and update operations
 *
 * @param profile - The profile data to insert/update
 * @returns The created/updated profile
 * @throws Error if the operation fails
 */
export async function upsertProfile(profile: ProfileInsert): Promise<Profile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting profile:', error);
    throw new Error(`Failed to upsert profile: ${error.message}`);
  }

  return data;
}

/**
 * Update specific fields of a user profile
 *
 * @param userId - The UUID of the user to update
 * @param updates - The fields to update
 * @returns The updated profile
 * @throws Error if the operation fails
 */
export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<Profile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return data;
}
