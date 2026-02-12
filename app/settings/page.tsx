'use client';

import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/PageTransition';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ListRow } from '@/components/ListRow';

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
