'use client';

import { useState, useEffect } from 'react';
import { AvatarUpload } from './AvatarUpload';
import { profileUpdateSchema } from '@/lib/validation/schemas';
import { updateProfile } from '@/lib/actions/user';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { Profile } from '@/lib/db/types';
import { z } from 'zod';

interface ProfileFormProps {
  profile: Profile;
  onSuccess?: () => void;
}

const CURRENCIES = [
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'SGD', name: 'Singapore Dollar' },
];

export function ProfileForm({ profile, onSuccess }: ProfileFormProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [currencyPreference, setCurrencyPreference] = useState(profile.currency_preference);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const changed =
      displayName !== profile.display_name ||
      avatarUrl !== profile.avatar_url ||
      currencyPreference !== profile.currency_preference;
    setHasChanges(changed);
  }, [displayName, avatarUrl, currencyPreference, profile]);

  const validateForm = (): boolean => {
    try {
      profileUpdateSchema.parse({
        display_name: displayName,
        avatar_url: avatarUrl,
        currency_preference: currencyPreference,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setShowSuccess(false);

    try {
      await updateProfile(profile.id, {
        display_name: displayName.trim(),
        avatar_url: avatarUrl,
        currency_preference: currencyPreference,
      });

      setShowSuccess(true);
      setHasChanges(false);

      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Upload */}
      <div className="flex flex-col items-center">
        <AvatarUpload
          value={avatarUrl}
          onChange={setAvatarUrl}
          userId={user?.id || profile.id}
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
          Click to upload avatar
        </p>
      </div>

      {/* Display Name */}
      <div>
        <label
          htmlFor="display_name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Display Name
        </label>
        <input
          id="display_name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border ${
            errors.display_name
              ? 'border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-ios-blue text-gray-900 dark:text-white`}
          placeholder="Enter your name"
          maxLength={50}
        />
        {errors.display_name && (
          <p className="text-red-500 text-sm mt-1">{errors.display_name}</p>
        )}
      </div>

      {/* Email (read-only for now) */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={user?.email || ''}
          readOnly
          className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Email used for login
        </p>
      </div>

      {/* Currency Preference */}
      <div>
        <label
          htmlFor="currency_preference"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Default Currency
        </label>
        <select
          id="currency_preference"
          value={currencyPreference}
          onChange={(e) => setCurrencyPreference(e.target.value)}
          className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border ${
            errors.currency_preference
              ? 'border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-ios-blue text-gray-900 dark:text-white`}
        >
          {CURRENCIES.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} - {currency.name}
            </option>
          ))}
        </select>
        {errors.currency_preference && (
          <p className="text-red-500 text-sm mt-1">{errors.currency_preference}</p>
        )}
      </div>

      {/* Timezone (auto-detected, read-only) */}
      <div>
        <label
          htmlFor="timezone"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Timezone
        </label>
        <input
          id="timezone"
          type="text"
          value={Intl.DateTimeFormat().resolvedOptions().timeZone}
          readOnly
          className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Auto-detected from your device
        </p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200 text-sm font-medium">
            Profile updated successfully!
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!hasChanges || saving}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
          !hasChanges || saving
            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : 'bg-ios-blue text-white active:scale-95'
        }`}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
