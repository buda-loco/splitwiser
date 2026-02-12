'use client';

import { use } from 'react';
import { ExpenseDetail } from '@/components/ExpenseDetail';
import { ExpenseVersionHistory } from '@/components/ExpenseVersionHistory';
import { PageTransition } from '@/components/PageTransition';

export default function ExpenseDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <PageTransition>
      <div className="min-h-screen bg-white dark:bg-black pt-safe-top pb-safe">
        <div className="max-w-md mx-auto px-4 py-6">
          <ExpenseDetail id={id} />
          <ExpenseVersionHistory expenseId={id} />
        </div>
      </div>
    </PageTransition>
  );
}
