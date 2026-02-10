import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import * as stores from '@/lib/db/stores';

export type RealtimeEvent = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
};

type RealtimeRecord = Record<string, unknown>;

/** Type guard: check that a realtime payload record has a valid 'id' field */
function hasId(record: unknown): record is RealtimeRecord & { id: string } {
  return typeof record === 'object' && record !== null && 'id' in record && typeof (record as RealtimeRecord).id === 'string';
}

export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private supabase = createClient();

  // Subscribe to expense changes
  subscribeToExpenses(user_id: string, callback?: (event: RealtimeEvent) => void): () => void {
    const channel_name = `expenses_${user_id}`;

    // Remove existing channel if present
    if (this.channels.has(channel_name)) {
      this.unsubscribe(channel_name);
    }

    // Create new channel with Postgres Changes filter
    const channel = this.supabase
      .channel(channel_name)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'expenses',
          filter: `created_by_user_id=eq.${user_id}` // Only expenses user has access to
        },
        async (payload: RealtimePostgresChangesPayload<RealtimeRecord>) => {
          try {
            await this.handleExpenseChange(payload);
          } catch (err) {
            console.error('Failed to handle realtime expense change:', err);
          }

          // Call optional callback for UI updates
          if (callback) {
            callback({
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: 'expenses',
              record: payload.new as RealtimeRecord,
              old_record: payload.old as RealtimeRecord
            });
          }
        }
      )
      .subscribe();

    this.channels.set(channel_name, channel);

    // Return unsubscribe function
    return () => this.unsubscribe(channel_name);
  }

  // Subscribe to splits/participants/tags for an expense
  subscribeToExpenseDetails(expense_id: string, callback?: (event: RealtimeEvent) => void): () => void {
    const channel_name = `expense_details_${expense_id}`;

    if (this.channels.has(channel_name)) {
      this.unsubscribe(channel_name);
    }

    const channel = this.supabase
      .channel(channel_name)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expense_splits',
          filter: `expense_id=eq.${expense_id}`
        },
        async (payload: RealtimePostgresChangesPayload<RealtimeRecord>) => {
          try {
            await this.handleSplitChange(payload);
          } catch (err) {
            console.error('Failed to handle realtime split change:', err);
          }
          if (callback) {
            callback({
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: 'expense_splits',
              record: payload.new as RealtimeRecord,
              old_record: payload.old as RealtimeRecord
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expense_tags',
          filter: `expense_id=eq.${expense_id}`
        },
        async (payload: RealtimePostgresChangesPayload<RealtimeRecord>) => {
          try {
            await this.handleTagChange(payload);
          } catch (err) {
            console.error('Failed to handle realtime tag change:', err);
          }
          if (callback) {
            callback({
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: 'expense_tags',
              record: payload.new as RealtimeRecord
            });
          }
        }
      )
      .subscribe();

    this.channels.set(channel_name, channel);
    return () => this.unsubscribe(channel_name);
  }

  // Handle expense change from realtime
  private async handleExpenseChange(payload: RealtimePostgresChangesPayload<RealtimeRecord>): Promise<void> {
    if (payload.eventType === 'INSERT') {
      if (!hasId(payload.new)) return;
      // Realtime INSERT delivers the full server record — write it directly via update
      // (createExpense generates a new ID, but we want to keep the server's ID)
      const record = payload.new as unknown as Parameters<typeof stores.updateExpense>[1];
      const existing = await stores.getExpense(payload.new.id);
      if (!existing) {
        // Use createExpense with the server data cast through unknown
        await stores.createExpense({ ...(payload.new as unknown as Parameters<typeof stores.createExpense>[0]) });
      }
    } else if (payload.eventType === 'UPDATE') {
      if (!hasId(payload.new)) return;
      const local = await stores.getExpense(payload.new.id);
      if (!local || new Date(payload.new.updated_at as string) > new Date(local.updated_at)) {
        await stores.updateExpense(payload.new.id, { ...(payload.new as unknown as Parameters<typeof stores.updateExpense>[1]), sync_status: 'synced' as const });
      }
    } else if (payload.eventType === 'DELETE') {
      if (!hasId(payload.old)) return;
      await stores.deleteExpense(payload.old.id);
    }
  }

  // Handle split changes
  private async handleSplitChange(payload: RealtimePostgresChangesPayload<RealtimeRecord>): Promise<void> {
    if (payload.eventType === 'INSERT') {
      if (!hasId(payload.new)) return;
      await stores.createSplit(payload.new as unknown as Parameters<typeof stores.createSplit>[0]);
    } else if (payload.eventType === 'UPDATE') {
      if (!hasId(payload.new)) return;
      await stores.updateSplit(payload.new.id, payload.new as unknown as Parameters<typeof stores.updateSplit>[1]);
    } else if (payload.eventType === 'DELETE') {
      // Delete from local store (splits don't soft delete)
    }
  }

  // Handle tag changes
  private async handleTagChange(payload: RealtimePostgresChangesPayload<RealtimeRecord>): Promise<void> {
    const rec = payload.new as RealtimeRecord;
    if (payload.eventType === 'INSERT') {
      if (!rec.expense_id || !rec.tag) return;
      await stores.addTagToExpense(rec.expense_id as string, rec.tag as string);
    } else if (payload.eventType === 'DELETE') {
      const old = payload.old as RealtimeRecord;
      if (!old.expense_id || !old.tag) return;
      await stores.removeTagFromExpense(old.expense_id as string, old.tag as string);
    }
  }

  // Unsubscribe from channel
  private unsubscribe(channel_name: string): void {
    const channel = this.channels.get(channel_name);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(channel_name);
    }
  }

  // Unsubscribe all channels
  unsubscribeAll(): void {
    for (const channel_name of this.channels.keys()) {
      this.unsubscribe(channel_name);
    }
  }
}

export const realtimeManager = new RealtimeManager();
