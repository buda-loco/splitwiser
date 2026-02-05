'use client';

import { useState, useEffect } from 'react';
import { getExpenses, getExpenseParticipants } from '@/lib/db/stores';

/**
 * Extended participant type with display information
 * For offline-first architecture, we store participant metadata inline
 */
export type ParticipantWithDetails = {
  user_id: string | null;
  participant_id: string | null;
  name: string;
  email: string | null;
};

/**
 * Hook to provide smart participant suggestions based on expense history
 *
 * Analyzes recent expenses to suggest participants the user frequently
 * collaborates with. Returns two lists: recent (by last use) and frequent
 * (by occurrence count).
 */
export function useParticipants() {
  const [recent, setRecent] = useState<ParticipantWithDetails[]>([]);
  const [frequent, setFrequent] = useState<ParticipantWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSuggestions() {
      try {
        // Get recent expenses (limit to 50 for performance)
        const expenses = await getExpenses();

        // Sort by date descending and take most recent 50
        const recentExpenses = expenses
          .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
          .slice(0, 50);

        // Map to track participant usage
        const participantMap = new Map<string, {
          participant: ParticipantWithDetails;
          count: number;
          lastSeen: number;
        }>();

        // Extract participants from recent expenses
        for (const expense of recentExpenses) {
          const participants = await getExpenseParticipants(expense.id);

          for (const p of participants) {
            const key = p.user_id || p.participant_id || '';
            if (!key) continue;

            const existing = participantMap.get(key);

            // For now, we use the ID as the name since we don't have participant details stored
            // In a future version with Supabase sync, we'll fetch actual participant names
            const participantWithDetails: ParticipantWithDetails = {
              user_id: p.user_id,
              participant_id: p.participant_id,
              name: p.user_id ? `User ${p.user_id.slice(0, 8)}` : `Participant ${p.participant_id?.slice(0, 8) || 'Unknown'}`,
              email: null,
            };

            if (existing) {
              existing.count++;
              // Update last seen if this expense is more recent
              const expenseTime = new Date(expense.expense_date).getTime();
              if (expenseTime > existing.lastSeen) {
                existing.lastSeen = expenseTime;
              }
            } else {
              participantMap.set(key, {
                participant: participantWithDetails,
                count: 1,
                lastSeen: new Date(expense.expense_date).getTime(),
              });
            }
          }
        }

        // Sort by most recent (last 10)
        const byRecent = Array.from(participantMap.values())
          .sort((a, b) => b.lastSeen - a.lastSeen)
          .slice(0, 10)
          .map(item => item.participant);

        // Sort by most frequent (top 10)
        const byFrequent = Array.from(participantMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
          .map(item => item.participant);

        setRecent(byRecent);
        setFrequent(byFrequent);
      } catch (error) {
        console.error('Failed to load participant suggestions:', error);
        setRecent([]);
        setFrequent([]);
      } finally {
        setLoading(false);
      }
    }

    loadSuggestions();
  }, []);

  return { recent, frequent, loading };
}
