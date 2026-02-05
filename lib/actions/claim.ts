'use server';

import { createClient } from '@/lib/supabase/server';
import type { Participant } from '@/lib/db/types';
import { claimParticipant } from './participant';
import { upsertProfile } from './user';

/**
 * Get all claimable participants for a given email
 * Returns participants that have not been claimed yet (claimed_by_user_id IS NULL)
 */
export async function getClaimableParticipants(email: string): Promise<Participant[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('email', email)
      .is('claimed_by_user_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching claimable participants:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getClaimableParticipants:', error);
    return [];
  }
}

/**
 * Claim a participant account by linking it to the current authenticated user
 * Also creates or updates the user's profile with the participant's name
 *
 * @returns Object with success status and optional error message
 */
export async function claimParticipantAccount(
  participantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'You must be logged in to claim an account' };
    }

    // Get the participant to verify it's unclaimed
    const { data: participant, error: fetchError } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .is('claimed_by_user_id', null)
      .single();

    if (fetchError || !participant) {
      return { success: false, error: 'Participant not found or already claimed' };
    }

    // Claim the participant
    const claimedParticipant = await claimParticipant(participantId, user.id);
    if (!claimedParticipant) {
      return { success: false, error: 'Failed to claim participant account' };
    }

    // Create/update user profile with participant's name as display_name
    // Note: If this fails, we don't rollback the participant claim
    // The participant claim is the source of truth
    try {
      await upsertProfile({
        id: user.id,
        display_name: participant.name,
        avatar_url: null,
        currency_preference: 'USD',
      });
    } catch (profileError) {
      console.error('Failed to create/update profile after claiming:', profileError);
      // Continue anyway - participant claim succeeded
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in claimParticipantAccount:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Automatically claim a participant account after login
 * If exactly one claimable participant exists, auto-claim it
 * If multiple exist, they should be shown the claiming UI
 *
 * @returns Object with needsManualClaim flag indicating if user should choose
 */
export async function autoClaimOnLogin(
  email: string
): Promise<{ needsManualClaim: boolean }> {
  try {
    const participants = await getClaimableParticipants(email);

    if (participants.length === 0) {
      // No participants to claim
      return { needsManualClaim: false };
    }

    if (participants.length === 1) {
      // Exactly one participant - auto-claim it
      await claimParticipantAccount(participants[0].id);
      return { needsManualClaim: false };
    }

    // Multiple participants - user needs to manually choose
    return { needsManualClaim: true };
  } catch (error) {
    console.error('Error in autoClaimOnLogin:', error);
    // On error, don't block login - just skip claiming
    return { needsManualClaim: false };
  }
}
