'use client';

import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/PageTransition';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/contexts/AuthContext';

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
            <div className="mb-8 bg-white rounded-lg p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-ios-gray mb-2">
                Account
              </h2>
              <p className="text-base mb-1">{profile?.display_name}</p>
              <p className="text-sm text-ios-gray">{user?.email}</p>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="w-full bg-red-500 text-white font-semibold py-3 px-4 rounded-lg active:bg-red-600 transition-colors"
            >
              Sign Out
            </button>

            <p className="text-ios-gray mt-6">
              Settings coming in later phases
            </p>
          </div>
        </main>
      </PageTransition>
    </ProtectedRoute>
  );
}
