import webpush from 'web-push';
import { createClient } from '@/lib/supabase/client';

/**
 * Generate VAPID keys for Web Push
 * Run this once to generate keys and store in .env.local
 */
export function generateVAPIDKeys() {
  const vapidKeys = webpush.generateVAPIDKeys();

  console.log('=== VAPID Keys Generated ===');
  console.log('Add these to your .env.local file:');
  console.log('');
  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  console.log('');
  console.log('Also add your contact email:');
  console.log('VAPID_SUBJECT=mailto:your-email@example.com');

  return vapidKeys;
}

/**
 * Register push notifications for a user
 * Requests permission, subscribes to push, and saves subscription to Supabase
 */
export async function registerPushNotifications(userId: string): Promise<PushSubscription | null> {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return null;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('This browser does not support service workers');
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Register service worker if not already registered
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
    }

    // Get VAPID public key from environment
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error('VAPID public key not found in environment');
      return null;
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });

    // Save subscription to Supabase
    const supabase = createClient();
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        subscription: subscription.toJSON(),
        device_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,endpoint',
      });

    if (error) {
      console.error('Error saving push subscription:', error);
      return null;
    }

    console.log('Push notification subscription successful');
    return subscription;
  } catch (error) {
    console.error('Error registering push notifications:', error);
    return null;
  }
}

/**
 * Unregister push notifications for a user
 */
export async function unregisterPushNotifications(userId: string): Promise<boolean> {
  try {
    // Get current subscription
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return true;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return true;
    }

    // Unsubscribe from push
    await subscription.unsubscribe();

    // Remove from Supabase
    const supabase = createClient();
    const endpoint = subscription.endpoint;
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('subscription->>endpoint', endpoint);

    console.log('Push notification unsubscription successful');
    return true;
  } catch (error) {
    console.error('Error unregistering push notifications:', error);
    return false;
  }
}

/**
 * Check if user has granted push notification permission
 */
export function hasNotificationPermission(): boolean {
  if (!('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

/**
 * Check if user can be prompted for notification permission
 */
export function canRequestNotificationPermission(): boolean {
  if (!('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'default';
}

/**
 * Convert VAPID public key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
