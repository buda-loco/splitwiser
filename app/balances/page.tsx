'use client';

import { PageTransition } from '@/components/PageTransition';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function BalancesPage() {
  const { user, profile } = useAuth();

  return (
    <ProtectedRoute>
      <PageTransition>
        <main className="min-h-screen pt-safe-top pb-safe-bottom px-4">
          <div className="max-w-md mx-auto pt-16">
            <h1 className="text-3xl font-bold text-ios-blue mb-4">
              Balances
            </h1>
            <p className="text-ios-gray mb-6">
              Welcome back, {profile?.display_name || user?.email}
            </p>
            <p className="text-ios-gray">
              Balance calculations coming in Phase 6
            </p>
          </div>
        </main>
      </PageTransition>
    </ProtectedRoute>
  );
}
