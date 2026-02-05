'use client';

import { useState, useEffect } from 'react';
import { getExpenses, getExpenseParticipants } from '@/lib/db/stores';
import type { ParticipantWithDetails } from './useParticipants';

/**
 * Hook to provide smart participant suggestions based on tag selection
 *
 * Analyzes expenses with the selected tag to suggest participants who
 * frequently appear in those expenses. This enables faster expense entry
 * by auto-suggesting the typical group for a given tag (e.g., "Tokyo Trip"
 * always suggests the same travel group).
 *
 * @param selectedTags - Array of tags to analyze (uses first tag for suggestions)
 * @returns Suggested participants sorted by frequency in tag context
 */
export function useTagSuggestions(selectedTags: string[]) {
  const [suggestedParticipants, setSuggestedParticipants] = useState<ParticipantWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedTags.length === 0) {
      setSuggestedParticipants([]);
      return;
    }

    async function loadSuggestions() {
      try {
        // 1. Get expenses for the first selected tag (most recent tag)
        // Note: We analyze only the first tag because most tags are mutually exclusive
        // (trip tags, group tags). The first tag is the primary context.
        const taggedExpenses = await getExpenses({ tag: selectedTags[0] });

        if (taggedExpenses.length === 0) {
          setSuggestedParticipants([]);
          return;
        }

        // 2. Extract participants from these expenses and count frequency
        const participantFrequency = new Map<string, number>();
        const participantDetails = new Map<string, ParticipantWithDetails>();

        for (const expense of taggedExpenses) {
          const participants = await getExpenseParticipants(expense.id);

          for (const p of participants) {
            const id = p.user_id || p.participant_id;
            if (!id) continue;

            // Count frequency
            participantFrequency.set(id, (participantFrequency.get(id) || 0) + 1);

            // Store participant details (first occurrence)
            if (!participantDetails.has(id)) {
              // For now, we use the ID as the name since we don't have participant details stored
              // In a future version with Supabase sync, we'll fetch actual participant names
              participantDetails.set(id, {
                user_id: p.user_id,
                participant_id: p.participant_id,
                name: p.user_id
                  ? `User ${p.user_id.slice(0, 8)}`
                  : `Participant ${p.participant_id?.slice(0, 8) || 'Unknown'}`,
                email: null,
              });
            }
          }
        }

        // 3. Sort participants by frequency (most common first)
        // Rationale: People who appear in most expenses for this tag are core group members
        const sortedIds = Array.from(participantFrequency.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([id]) => id);

        // 4. Map to ParticipantWithDetails
        const details = sortedIds
          .map(id => participantDetails.get(id))
          .filter((p): p is ParticipantWithDetails => p !== undefined);

        setSuggestedParticipants(details);
      } catch (error) {
        console.error('Failed to load tag-based participant suggestions:', error);
        setSuggestedParticipants([]);
      }
    }

    setLoading(true);
    loadSuggestions().finally(() => setLoading(false));
  }, [selectedTags]);

  return { suggestedParticipants, loading };
}
