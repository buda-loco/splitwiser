/**
 * Generate a display name for a participant.
 * Uses the name field if available, falls back to truncated IDs.
 */
export function getParticipantDisplayName(participant: {
  user_id?: string | null;
  participant_id?: string | null;
  name?: string | null;
}): string {
  if (participant.name) return participant.name;
  if (participant.user_id) return `User ${participant.user_id.slice(0, 8)}`;
  if (participant.participant_id) return `Participant ${participant.participant_id.slice(0, 8)}`;
  return 'Unknown';
}
