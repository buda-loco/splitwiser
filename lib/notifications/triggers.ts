/**
 * Notification triggers for expense and settlement events
 *
 * This module provides functions to trigger push notifications for key events:
 * - New expenses shared with participants
 * - Expense updates (when amount/splits change significantly)
 * - Settlement requests
 *
 * All triggers respect user notification preferences and skip self-notifications.
 */

import { sendPushNotification } from '@/lib/actions/sendPushNotification';
import { getExpense } from '@/lib/db/stores';
import { getDatabase, promisifyRequest, STORES } from '@/lib/db/indexeddb';

/**
 * Get notification preferences for a user
 */
async function getNotificationPreferences(userId: string): Promise<{
  expense_shared: boolean;
  expense_updated: boolean;
  settlement_requested: boolean;
} | null> {
  try {
    const db = await getDatabase();
    const transaction = db.transaction([STORES.NOTIFICATION_PREFERENCES], 'readonly');
    const store = transaction.objectStore(STORES.NOTIFICATION_PREFERENCES);
    const prefs = await promisifyRequest(store.get(userId));

    if (!prefs) {
      // Default preferences if not set
      return {
        expense_shared: true,
        expense_updated: true,
        settlement_requested: true,
      };
    }

    return prefs;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    // Default to enabled if preferences can't be fetched
    return {
      expense_shared: true,
      expense_updated: true,
      settlement_requested: true,
    };
  }
}

/**
 * Get participant display name (user or participant name)
 */
async function getParticipantName(userId: string | null, participantId: string | null): Promise<string> {
  if (!userId && !participantId) return 'Someone';

  // For now, return a generic name - this would be enhanced with actual user/participant lookup
  // In a real implementation, you'd fetch from users/participants tables
  return 'A friend';
}

/**
 * Notify participants when an expense is shared with them
 *
 * @param expenseId - ID of the created expense
 * @param participantIds - Array of participant user IDs (not participant_ids, only registered users)
 * @param createdByUserId - User who created the expense (to skip self-notification)
 */
export async function notifyExpenseShared(
  expenseId: string,
  participantIds: string[],
  createdByUserId: string
): Promise<void> {
  try {
    const expense = await getExpense(expenseId);
    if (!expense) {
      console.error('Expense not found:', expenseId);
      return;
    }

    // Get payer name
    const payerName = await getParticipantName(expense.paid_by_user_id, null);

    // Filter out the creator (don't notify yourself)
    const participantsToNotify = participantIds.filter(id => id !== createdByUserId);

    // Send notifications to each participant
    for (const participantId of participantsToNotify) {
      // Check if user has enabled expense_shared notifications
      const prefs = await getNotificationPreferences(participantId);
      if (!prefs || !prefs.expense_shared) {
        continue;
      }

      // Send push notification
      await sendPushNotification(participantId, {
        title: `New Expense: ${expense.description}`,
        body: `${payerName} added a ${expense.currency} ${expense.amount.toFixed(2)} expense`,
        data: {
          expenseId,
          url: `/expenses/${expenseId}`,
        },
      });
    }
  } catch (error) {
    console.error('Error sending expense shared notifications:', error);
  }
}

/**
 * Notify participants when an expense is updated significantly
 *
 * @param expenseId - ID of the updated expense
 * @param participantIds - Array of participant user IDs
 * @param updatedByUserId - User who updated the expense (to skip self-notification)
 * @param previousAmount - Previous expense amount (for calculating change threshold)
 */
export async function notifyExpenseUpdated(
  expenseId: string,
  participantIds: string[],
  updatedByUserId: string,
  previousAmount?: number
): Promise<void> {
  try {
    const expense = await getExpense(expenseId);
    if (!expense) {
      console.error('Expense not found:', expenseId);
      return;
    }

    // Check if change is significant (>10% change in amount)
    if (previousAmount !== undefined) {
      const changePercent = Math.abs((expense.amount - previousAmount) / previousAmount) * 100;
      if (changePercent < 10) {
        // Change is not significant, skip notifications
        return;
      }
    }

    // Get updater name
    const updaterName = await getParticipantName(updatedByUserId, null);

    // Filter out the updater (don't notify yourself)
    const participantsToNotify = participantIds.filter(id => id !== updatedByUserId);

    // Send notifications to each participant
    for (const participantId of participantsToNotify) {
      // Check if user has enabled expense_updated notifications
      const prefs = await getNotificationPreferences(participantId);
      if (!prefs || !prefs.expense_updated) {
        continue;
      }

      // Send push notification
      await sendPushNotification(participantId, {
        title: `Expense Updated: ${expense.description}`,
        body: `${updaterName} updated the expense details`,
        data: {
          expenseId,
          url: `/expenses/${expenseId}`,
        },
      });
    }
  } catch (error) {
    console.error('Error sending expense updated notifications:', error);
  }
}

/**
 * Notify user when a settlement is recorded
 *
 * @param settlementId - ID of the settlement
 * @param toUserId - User who should receive the money
 * @param fromUserId - User who paid/recorded the settlement (to skip self-notification)
 * @param amount - Settlement amount
 * @param currency - Settlement currency
 */
export async function notifySettlementRequested(
  settlementId: string,
  toUserId: string | null,
  fromUserId: string | null,
  amount: number,
  currency: string
): Promise<void> {
  try {
    // Only notify if toUserId is a registered user
    if (!toUserId) {
      return;
    }

    // Don't notify yourself
    if (toUserId === fromUserId) {
      return;
    }

    // Check if user has enabled settlement_requested notifications
    const prefs = await getNotificationPreferences(toUserId);
    if (!prefs || !prefs.settlement_requested) {
      return;
    }

    // Get from user name
    const fromName = await getParticipantName(fromUserId, null);

    // Send push notification
    await sendPushNotification(toUserId, {
      title: 'Settlement Recorded',
      body: `${fromName} recorded a ${currency} ${amount.toFixed(2)} settlement`,
      data: {
        settlementId,
        url: `/settlements`,
      },
    });
  } catch (error) {
    console.error('Error sending settlement notification:', error);
  }
}

/**
 * Queue a notification for offline sending
 * Stores notification in IndexedDB to be sent when device is back online
 */
async function queueOfflineNotification(notification: {
  userId: string;
  type: 'expense_shared' | 'expense_updated' | 'settlement_requested';
  data: any;
}): Promise<void> {
  try {
    const db = await getDatabase();
    const transaction = db.transaction(['notification_queue'], 'readwrite');
    const store = transaction.objectStore('notification_queue');

    await promisifyRequest(store.add({
      id: crypto.randomUUID(),
      ...notification,
      created_at: new Date().toISOString(),
      status: 'pending',
    }));
  } catch (error) {
    console.error('Error queuing offline notification:', error);
  }
}
