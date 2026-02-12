'use client';

import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/PageTransition';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ListRow } from '@/components/ListRow';
import { Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <ProtectedRoute>
      <PageTransition>
        <main className="min-h-screen pt-safe-top pb-safe-bottom px-4">
          <div className="max-w-md mx-auto pt-16">
            <h1 className="text-3xl font-bold text-ios-blue mb-4">
              Settings
            </h1>
            <p className="text-ios-gray mb-6">
              Welcome back, {profile?.display_name || user?.email}
            </p>

            {/* User Info Section */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-ios-gray mb-2 px-4">
                Account
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <ListRow
                  title="Edit Profile"
                  subtitle="Update your name, avatar, and preferences"
                  onClick={() => router.push('/settings/profile')}
                  showChevron={true}
                />
                <ListRow
                  title={profile?.display_name || 'User'}
                  subtitle={user?.email || ''}
                  showChevron={false}
                />
              </div>
            </div>

            {/* Settings Options */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-ios-gray mb-2 px-4">
                Data & Privacy
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <ListRow
                  title="Export Your Data"
                  subtitle="Download all your data (GDPR)"
                  onClick={() => router.push('/settings/export')}
                  showChevron={true}
                />
              </div>
            </div>

            {/* Danger Zone */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-red-600 dark:text-red-500 mb-2 px-4">
                Danger Zone
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border-2 border-red-200 dark:border-red-900">
                <button
                  onClick={() => router.push('/settings/delete-account')}
                  className="w-full px-4 py-4 flex items-center justify-between
                           text-left active:bg-red-50 dark:active:bg-red-900/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full
                                  flex items-center justify-center">
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-red-600 dark:text-red-500">
                        Delete My Account
                      </div>
                      <div className="text-sm text-red-500 dark:text-red-400">
                        Permanently delete your account and data
                      </div>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-red-400 dark:text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="w-full bg-red-500 text-white font-semibold py-3 px-4 rounded-lg active:bg-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </main>
      </PageTransition>
    </ProtectedRoute>
  );
}
