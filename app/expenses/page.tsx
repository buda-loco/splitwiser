'use client';

import { ExpenseList } from '@/components/ExpenseList';

export default function ExpensesPage() {
  return (
    <div className="pb-safe">
      <h1 className="text-2xl font-semibold p-4">Expenses</h1>
      <ExpenseList />
    </div>
  );
}
