'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff } from 'lucide-react';
import { getNotificationPreferences, updateNotificationPreferences, type NotificationPreferences } from '@/lib/db/stores';

interface NotificationPreferencesProps {
  userId: string;
}

export default function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
    checkPermissionStatus();
  }, [userId]);

  async function loadPreferences() {
    try {
      const prefs = await getNotificationPreferences(userId);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  }

  function checkPermissionStatus() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }

  async function handleToggle(key: keyof Omit<NotificationPreferences, 'user_id'>, value: boolean) {
    try {
      await updateNotificationPreferences(userId, { [key]: value });
      setPreferences(prev => prev ? { ...prev, [key]: value } : null);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }

  async function requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        // Enable all notifications by default when permission is granted
        await updateNotificationPreferences(userId, {
          expense_shared: true,
          expense_updated: true,
          settlement_requested: true,
        });
        await loadPreferences();
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-ios-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const permissionDenied = permissionStatus === 'denied';
  const permissionDefault = permissionStatus === 'default';
  const permissionGranted = permissionStatus === 'granted';

  return (
    <div className="space-y-6">
      {/* Master toggle section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              permissionGranted ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              {permissionGranted ? (
                <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Push Notifications
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {permissionGranted && 'Notifications enabled'}
                {permissionDefault && 'Not configured'}
                {permissionDenied && 'Permission denied'}
              </p>
            </div>
          </div>
        </div>

        {permissionDenied && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Enable in System Settings</strong>
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              To receive notifications, you need to enable them in your device settings. Go to Settings → Notifications → Splitwiser and enable notifications.
            </p>
          </div>
        )}

        {permissionDefault && (
          <div className="p-4">
            <button
              onClick={requestPermission}
              className="w-full bg-ios-blue text-white font-medium py-3 px-4 rounded-xl active:scale-95 transition-transform"
            >
              Enable Notifications
            </button>
          </div>
        )}
      </div>

      {/* Individual notification type toggles */}
      {permissionGranted && preferences && (
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-gray-700">
          {/* New expenses */}
          <ToggleRow
            label="New Expenses"
            description="When someone adds you to an expense"
            enabled={preferences.expense_shared}
            onChange={(value) => handleToggle('expense_shared', value)}
          />

          {/* Expense updates */}
          <ToggleRow
            label="Expense Updates"
            description="When an expense you're part of is changed"
            enabled={preferences.expense_updated}
            onChange={(value) => handleToggle('expense_updated', value)}
          />

          {/* Settlement requests */}
          <ToggleRow
            label="Settlement Requests"
            description="When someone records a settlement with you"
            enabled={preferences.settlement_requested}
            onChange={(value) => handleToggle('settlement_requested', value)}
          />
        </div>
      )}
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ label, description, enabled, onChange }: ToggleRowProps) {
  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex-1 pr-4">
        <h4 className="text-base font-medium text-gray-900 dark:text-white">
          {label}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {description}
        </p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
          enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
        role="switch"
        aria-checked={enabled}
      >
        <motion.span
          className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg"
          animate={{
            x: enabled ? 30 : 4,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        />
      </button>
    </div>
  );
}
