'use server';

/**
 * Server actions for invite token management
 *
 * Handles creating invite links, validating tokens, and marking invites as used.
 * Used by the invite landing page and participant invite flow.
 */

import { createClient } from '@/lib/supabase/server';
import { generateInviteToken, hashToken } from '@/lib/utils/token';
import type { Participant } from '@/lib/db/types';

/**
 * Create an invite link for a participant
 *
 * Generates a secure token, stores the hashed version in the database,
 * and returns the raw token with a full invite URL.
 *
 * @param participantId - The UUID of the participant to create an invite for
 * @returns Object with raw token and full invite URL, or null if creation failed
 *
 * @example
 * const result = await createInvite('123e4567-e89b-12d3-a456-426614174000');
 * // Returns: { token: "a3f5c8...", inviteUrl: "https://app.com/invite/a3f5c8..." }
 */
export async function createInvite(
  participantId: string
): Promise<{ token: string; inviteUrl: string } | null> {
  const supabase = await createClient();

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  // Generate secure token
  const token = generateInviteToken();
  const tokenHash = hashToken(token);

  // Insert invite token record
  const { error } = await supabase.from('invite_tokens').insert({
    token_hash: tokenHash,
    participant_id: participantId,
    created_by_user_id: user.id,
  });

  if (error) {
    console.error('Failed to create invite token:', error);
    return null;
  }

  // Build invite URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const inviteUrl = `${baseUrl}/invite/${token}`;

  return {
    token,
    inviteUrl,
  };
}

/**
 * Get invite details by token and validate it
 *
 * Hashes the provided token, looks up the invite record, checks expiry and usage,
 * and fetches the associated participant details.
 *
 * @param token - The raw invite token from the URL
 * @returns Object with participant details and validity status, or null if not found
 *
 * @example
 * const invite = await getInviteByToken('a3f5c8d2e1b4f6c9...');
 * if (invite?.isValid) {
 *   console.log(`Invite for ${invite.participant.name}`);
 * }
 */
export async function getInviteByToken(
  token: string
): Promise<{ participant: Participant; isValid: boolean } | null> {
  const supabase = await createClient();
  const tokenHash = hashToken(token);

  // Fetch invite token record with participant details
  const { data: inviteToken, error: inviteError } = await supabase
    .from('invite_tokens')
    .select('*, participant:participants(*)')
    .eq('token_hash', tokenHash)
    .single();

  if (inviteError || !inviteToken) {
    return null;
  }

  // Check if token is valid (not expired and not used)
  const now = new Date();
  const expiresAt = new Date(inviteToken.expires_at);
  const isValid = expiresAt > now && !inviteToken.used_at;

  // Extract participant from the nested query result
  const participant = inviteToken.participant as unknown as Participant;

  return {
    participant,
    isValid,
  };
}

/**
 * Mark an invite token as used
 *
 * Updates the used_at timestamp to prevent token reuse.
 * Called when a participant claims their identity or views their balances.
 *
 * @param token - The raw invite token from the URL
 * @returns true if successfully marked as used, false otherwise
 *
 * @example
 * const success = await markInviteUsed('a3f5c8d2e1b4f6c9...');
 */
export async function markInviteUsed(token: string): Promise<boolean> {
  const supabase = await createClient();
  const tokenHash = hashToken(token);

  const { error } = await supabase
    .from('invite_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token_hash', tokenHash);

  if (error) {
    console.error('Failed to mark invite as used:', error);
    return false;
  }

  return true;
}
