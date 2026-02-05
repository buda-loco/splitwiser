'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getExpenses, getExpenseParticipants, getAllTags, getExpenseTags } from '@/lib/db/stores';
import type { OfflineExpense, ExpenseParticipant } from '@/lib/db/types';
import { motion } from 'framer-motion';

export function ExpenseList() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<(OfflineExpense & { participants: ExpenseParticipant[]; tags: string[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '7days' | '30days'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    async function loadTags() {
      const tags = await getAllTags();
      setAvailableTags(tags);
    }
    loadTags();
  }, []);

  useEffect(() => {
    async function loadExpenses() {
      let query: { startDate?: Date; endDate?: Date; tag?: string } = {};

      if (filter === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = { startDate: sevenDaysAgo };
      } else if (filter === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = { startDate: thirtyDaysAgo };
      }

      if (selectedTag) {
        query.tag = selectedTag;
      }

      const items = await getExpenses(query);

      // Sort by date descending (most recent first)
      const sorted = items.sort((a, b) =>
        new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
      );

      // Load participants and tags for each expense
      const withParticipantsAndTags = await Promise.all(
        sorted.map(async (expense) => ({
          ...expense,
          participants: await getExpenseParticipants(expense.id),
          tags: await getExpenseTags(expense.id)
        }))
      );

      setExpenses(withParticipantsAndTags);
      setLoading(false);
    }

    loadExpenses();
  }, [filter, selectedTag]);

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Tag filter chips */}
      {availableTags.length > 0 && (
        <div className="flex gap-2 px-4 pt-4 overflow-x-auto">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedTag(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm ${
              selectedTag === null
                ? 'bg-ios-blue text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            All Tags
          </motion.button>
          {availableTags.map((tag) => (
            <motion.button
              key={tag}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/tags/${encodeURIComponent(tag)}`)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm flex items-center gap-2 transition-colors hover:bg-ios-blue/20 dark:hover:bg-gray-700 ${
                selectedTag === tag
                  ? 'bg-ios-blue text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {tag}
              {selectedTag === tag && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTag(null);
                  }}
                  className="ml-1 font-bold"
                >
                  ×
                </span>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Time filter tabs */}
      <div className="flex gap-2 p-4 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full whitespace-nowrap ${
            filter === 'all'
              ? 'bg-ios-blue text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('7days')}
          className={`px-4 py-2 rounded-full whitespace-nowrap ${
            filter === '7days'
              ? 'bg-ios-blue text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          Last 7 days
        </button>
        <button
          onClick={() => setFilter('30days')}
          className={`px-4 py-2 rounded-full whitespace-nowrap ${
            filter === '30days'
              ? 'bg-ios-blue text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          Last 30 days
        </button>
      </div>

      {/* Expense count and filter state */}
      <div className="px-4 pb-2 text-sm text-gray-600 dark:text-gray-400">
        {selectedTag ? (
          <span>Showing {expenses.length} expenses tagged &quot;{selectedTag}&quot;</span>
        ) : (
          <span>Showing {expenses.length} expenses</span>
        )}
      </div>

      {/* Expense list */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {selectedTag ? `No expenses tagged "${selectedTag}"` : 'No expenses yet. Tap + to create one.'}
          </div>
        ) : (
          expenses.map((expense) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-800 dark:active:bg-gray-700"
              onClick={() => router.push(`/expenses/${expense.id}`)}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{expense.description}</h3>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  ${expense.amount.toFixed(2)}
                </span>
              </div>

              {/* Tags */}
              {expense.tags.length > 0 && (
                <div className="flex items-center gap-1 mb-2 flex-wrap">
                  {expense.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/tags/${encodeURIComponent(tag)}`);
                      }}
                      className="text-xs rounded-full px-2 py-1 bg-ios-blue/10 text-ios-blue dark:bg-gray-800 dark:text-gray-300 cursor-pointer hover:bg-ios-blue/20 dark:hover:bg-gray-700 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                  {expense.tags.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{expense.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {expense.category && (
                    <>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{expense.category}</span>
                      <span className="text-sm text-gray-400 dark:text-gray-600">•</span>
                    </>
                  )}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(expense.expense_date).toLocaleDateString()}
                  </span>
                </div>

                {expense.participants.length > 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
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
