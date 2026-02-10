'use client';

import { use } from 'react';
import { ExpenseDetail } from '@/components/ExpenseDetail';
import { ExpenseVersionHistory } from '@/components/ExpenseVersionHistory';

export default function ExpenseDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <>
      <ExpenseDetail id={id} />
      <div className="max-w-md mx-auto px-4">
        <ExpenseVersionHistory expenseId={id} />
      </div>
    </>
  );
}
