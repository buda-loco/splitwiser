'use client';

import { PageTransition } from '@/components/PageTransition';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BalanceView } from '@/components/BalanceView';

export default function BalancesPage() {
  return (
    <ProtectedRoute>
      <PageTransition>
        <main className="min-h-screen pt-safe-top pb-safe-bottom px-4 bg-ios-gray-light dark:bg-black">
          <div className="max-w-md mx-auto pt-16">
            <h1 className="text-3xl font-bold text-ios-blue mb-6">
              Balances
            </h1>
            <BalanceView />
          </div>
        </main>
      </PageTransition>
    </ProtectedRoute>
  );
}
