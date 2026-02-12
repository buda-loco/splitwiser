'use client';

import { ExpenseList } from '@/components/ExpenseList';
import { PageTransition } from '@/components/PageTransition';

export default function ExpensesPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-white dark:bg-black pt-safe-top pb-safe">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold">Expenses</h1>
          <ExpenseList />
        </div>
      </div>
    </PageTransition>
  );
}
