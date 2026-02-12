'use server';

import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';

interface NotificationPayload {
  title: string;
  body: string;
  data?: {
    expenseId?: string;
    settlementId?: string;
    url?: string;
    [key: string]: any;
  };
  icon?: string;
  badge?: string;
}

interface SendPushNotificationResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * Send push notification to a user
 * Fetches user's push subscriptions and sends notifications to all registered devices
 */
export async function sendPushNotification(
  userId: string,
  notification: NotificationPayload
): Promise<SendPushNotificationResult> {
  const result: SendPushNotificationResult = {
    success: false,
    sentCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    // Validate VAPID configuration
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:notifications@splitwiser.app';

    if (!vapidPublicKey || !vapidPrivateKey) {
      const error = 'VAPID keys not configured. Run generateVAPIDKeys() to generate keys.';
      console.error(error);
      result.errors.push(error);
      return result;
    }

    // Configure web-push with VAPID details
    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    // Fetch user's push subscriptions from database
    const supabase = await createClient();
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Error fetching push subscriptions:', fetchError);
      result.errors.push(`Database error: ${fetchError.message}`);
      return result;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return result;
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: notification.badge || '/icons/icon-72x72.png',
      data: notification.data || {},
    });

    // Send push notification to each subscription
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = sub.subscription as any;
        await webpush.sendNotification(pushSubscription, payload);
        result.sentCount++;
        return { success: true, subscriptionId: sub.id };
      } catch (error: any) {
        result.failedCount++;

        // Check if subscription has expired (410 Gone or 404 Not Found)
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`Subscription expired for user ${userId}, removing from database`);

          // Delete expired subscription
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);

          result.errors.push(`Subscription ${sub.id} expired and removed`);
        } else {
          console.error(`Error sending push to subscription ${sub.id}:`, error);
          result.errors.push(`Subscription ${sub.id}: ${error.message}`);
        }

        return { success: false, subscriptionId: sub.id, error };
      }
    });

    await Promise.allSettled(sendPromises);

    result.success = result.sentCount > 0;

    if (result.success) {
      console.log(`Successfully sent ${result.sentCount} push notifications to user ${userId}`);
    }

    return result;
  } catch (error: any) {
    console.error('Error in sendPushNotification:', error);
    result.errors.push(error.message || 'Unknown error occurred');
    return result;
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationToMultipleUsers(
  userIds: string[],
  notification: NotificationPayload
): Promise<{ [userId: string]: SendPushNotificationResult }> {
  const results: { [userId: string]: SendPushNotificationResult } = {};

  const sendPromises = userIds.map(async (userId) => {
    const result = await sendPushNotification(userId, notification);
    results[userId] = result;
  });

  await Promise.allSettled(sendPromises);

  return results;
}

/**
 * Helper function to send expense notification
 */
export async function sendExpenseNotification(
  userIds: string[],
  expenseDescription: string,
  expenseId: string,
  paidByName: string
) {
  return sendPushNotificationToMultipleUsers(userIds, {
    title: 'New Expense Added',
    body: `${paidByName} added "${expenseDescription}"`,
    data: {
      expenseId,
      url: `/expenses/${expenseId}`,
    },
  });
}

/**
 * Helper function to send settlement notification
 */
export async function sendSettlementNotification(
  userId: string,
  amount: string,
  currency: string,
  fromName: string,
  settlementId?: string
) {
  return sendPushNotification(userId, {
    title: 'Settlement Request',
    body: `${fromName} settled ${currency} ${amount}`,
    data: {
      settlementId,
      url: '/settlements',
    },
  });
}
