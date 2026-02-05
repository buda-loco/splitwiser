'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getExpenses, getExpenseParticipants } from '@/lib/db/stores';
import type { OfflineExpense, ExpenseParticipant } from '@/lib/db/types';
import { motion } from 'framer-motion';

export function ExpenseList() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<(OfflineExpense & { participants: ExpenseParticipant[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '7days' | '30days'>('all');

  useEffect(() => {
    async function loadExpenses() {
      let query: { startDate?: Date; endDate?: Date } = {};

      if (filter === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = { startDate: sevenDaysAgo };
      } else if (filter === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = { startDate: thirtyDaysAgo };
      }

      const items = await getExpenses(query);

      // Sort by date descending (most recent first)
      const sorted = items.sort((a, b) =>
        new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
      );

      // Load participants for each expense
      const withParticipants = await Promise.all(
        sorted.map(async (expense) => ({
          ...expense,
          participants: await getExpenseParticipants(expense.id)
        }))
      );

      setExpenses(withParticipants);
      setLoading(false);
    }

    loadExpenses();
  }, [filter]);

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Filter tabs */}
      <div className="flex gap-2 p-4 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full whitespace-nowrap ${
            filter === 'all'
              ? 'bg-ios-blue text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('7days')}
          className={`px-4 py-2 rounded-full whitespace-nowrap ${
            filter === '7days'
              ? 'bg-ios-blue text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Last 7 days
        </button>
        <button
          onClick={() => setFilter('30days')}
          className={`px-4 py-2 rounded-full whitespace-nowrap ${
            filter === '30days'
              ? 'bg-ios-blue text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Last 30 days
        </button>
      </div>

      {/* Expense list */}
      <div className="divide-y divide-gray-200">
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No expenses yet. Tap + to create one.
          </div>
        ) : (
          expenses.map((expense) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              onClick={() => router.push(`/expenses/${expense.id}`)}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-gray-900">{expense.description}</h3>
                <span className="font-semibold text-gray-900">
                  ${expense.amount.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {expense.category && (
                    <>
                      <span className="text-sm text-gray-500">{expense.category}</span>
                      <span className="text-sm text-gray-400">•</span>
                    </>
                  )}
                  <span className="text-sm text-gray-500">
                    {new Date(expense.expense_date).toLocaleDateString()}
                  </span>
                </div>

                {expense.participants.length > 0 && (
                  <div className="text-sm text-gray-500">
                    {expense.participants.length} {expense.participants.length === 1 ? 'person' : 'people'}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* FAB (Floating Action Button) */}
      <button
        onClick={() => router.push('/expenses/new')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-ios-blue text-white rounded-full shadow-lg flex items-center justify-center text-2xl"
      >
        +
      </button>
    </div>
  );
}
