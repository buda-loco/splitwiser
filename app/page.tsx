'use client';

import { PageTransition } from '@/components/PageTransition';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ExpenseList } from '@/components/ExpenseList';

export default function Home() {
  return (
    <ProtectedRoute>
      <PageTransition>
        <main className="min-h-screen pt-safe-top pb-safe-bottom">
          <ExpenseList />
        </main>
      </PageTransition>
    </ProtectedRoute>
  );
}
