'use client';

import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/PageTransition';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BalanceView } from '@/components/BalanceView';

export default function BalancesPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <PageTransition>
        <div className="min-h-screen bg-ios-gray-light dark:bg-black pb-safe">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="text-ios-blue hover:text-ios-blue/80 transition-colors"
                aria-label="Go back"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Balances
              </h1>
            </div>
          </div>

          {/* Balance view */}
          <div className="p-4">
            <BalanceView />
          </div>
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}
