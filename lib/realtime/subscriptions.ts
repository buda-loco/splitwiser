import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import * as stores from '@/lib/db/stores';

export type RealtimeEvent = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
};

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
        async (payload: RealtimePostgresChangesPayload<any>) => {
          await this.handleExpenseChange(payload);

          // Call optional callback for UI updates
          if (callback) {
            callback({
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: 'expenses',
              record: payload.new,
              old_record: payload.old
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
        async (payload) => {
          await this.handleSplitChange(payload);
          if (callback) {
            callback({
              type: payload.eventType as any,
              table: 'expense_splits',
              record: payload.new,
              old_record: payload.old
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
        async (payload) => {
          await this.handleTagChange(payload);
          if (callback) {
            callback({
              type: payload.eventType as any,
              table: 'expense_tags',
              record: payload.new
            });
          }
        }
      )
      .subscribe();

    this.channels.set(channel_name, channel);
    return () => this.unsubscribe(channel_name);
  }

  // Handle expense change from realtime
  private async handleExpenseChange(payload: RealtimePostgresChangesPayload<any>): Promise<void> {
    if (payload.eventType === 'INSERT') {
      // Add new expense to local IndexedDB
      await stores.createExpense({ ...payload.new, sync_status: 'synced' });
    } else if (payload.eventType === 'UPDATE') {
      // Update expense in IndexedDB (only if remote is newer)
      const local = await stores.getExpense(payload.new.id);
      if (!local || new Date(payload.new.updated_at) > new Date(local.updated_at)) {
        await stores.updateExpense(payload.new.id, { ...payload.new, sync_status: 'synced' });
      }
    } else if (payload.eventType === 'DELETE') {
      // Soft delete in IndexedDB
      await stores.deleteExpense(payload.old.id);
    }
  }

  // Handle split changes
  private async handleSplitChange(payload: RealtimePostgresChangesPayload<any>): Promise<void> {
    if (payload.eventType === 'INSERT') {
      await stores.createSplit(payload.new);
    } else if (payload.eventType === 'UPDATE') {
      await stores.updateSplit(payload.new.id, payload.new);
    } else if (payload.eventType === 'DELETE') {
      // Delete from local store (splits don't soft delete)
    }
  }

  // Handle tag changes
  private async handleTagChange(payload: RealtimePostgresChangesPayload<any>): Promise<void> {
    if (payload.eventType === 'INSERT') {
      await stores.addTagToExpense(payload.new.expense_id, payload.new.tag);
    } else if (payload.eventType === 'DELETE') {
      await stores.removeTagFromExpense(payload.old.expense_id, payload.old.tag);
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
