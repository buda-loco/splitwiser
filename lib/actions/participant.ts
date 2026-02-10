'use server';

import { createClient } from '@/lib/supabase/server';
import type { Participant, ParticipantInsert, ParticipantUpdate } from '@/lib/db/types';

/**
 * Create a new participant
 * Automatically sets created_by_user_id to the current authenticated user
 */
export async function createParticipant(
  data: Omit<ParticipantInsert, 'created_by_user_id'>
): Promise<Participant | null> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Failed to get current user:', authError);
      return null;
    }

    // Insert participant with created_by_user_id set to current user
    const { data: participant, error } = await supabase
      .from('participants')
      .insert({
        ...data,
        created_by_user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating participant:', error);
      return null;
    }

    return participant;
  } catch (error) {
    console.error('Unexpected error creating participant:', error);
    return null;
  }
}

/**
 * Get a participant by ID
 */
export async function getParticipant(id: string): Promise<Participant | null> {
  try {
    const supabase = await createClient();

    // Verify authentication for defense-in-depth (RLS is primary boundary)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', id)
      .eq('created_by_user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching participant:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching participant:', error);
    return null;
  }
}

/**
 * Find an unclaimed participant by email
 * Only returns participants where claimed_by_user_id IS NULL
 */
export async function getParticipantByEmail(email: string): Promise<Participant | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('email', email)
      .is('claimed_by_user_id', null)
      .maybeSingle();

    if (error) {
      console.error('Error fetching participant by email:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching participant by email:', error);
    return null;
  }
}

/**
 * Get all participants created by the current user
 */
export async function getUserParticipants(): Promise<Participant[]> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Failed to get current user:', authError);
      return [];
    }

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('created_by_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user participants:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching user participants:', error);
    return [];
  }
}

/**
 * Update a participant
 * Only allows updating name, email, and phone for participants created by current user
 */
export async function updateParticipant(
  id: string,
  updates: ParticipantUpdate
): Promise<Participant | null> {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Failed to get current user:', authError);
      return null;
    }

    // Only allow updating participants created by the current user
    const { data, error } = await supabase
      .from('participants')
      .update(updates)
      .eq('id', id)
      .eq('created_by_user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating participant:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error updating participant:', error);
    return null;
  }
}

/**
 * Claim a participant by linking it to a user account
 * Used in the account claiming flow when a participant signs up
 */
export async function claimParticipant(
  participantId: string,
  userId: string
): Promise<Participant | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('participants')
      .update({ claimed_by_user_id: userId })
      .eq('id', participantId)
      .is('claimed_by_user_id', null) // Only claim if not already claimed
      .select()
      .single();

    if (error) {
      console.error('Error claiming participant:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error claiming participant:', error);
    return null;
  }
}
