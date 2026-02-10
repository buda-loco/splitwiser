'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getExpenses, getExpenseParticipants, getAllTags, getExpenseTags } from '@/lib/db/stores';
import type { OfflineExpense, ExpenseParticipant } from '@/lib/db/types';
import { motion } from 'framer-motion';
import { ListRow } from '@/components/ListRow';

export function ExpenseList() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<(OfflineExpense & { participants: ExpenseParticipant[]; tags: string[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '7days' | '30days'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    async function loadTags() {
      try {
        const tags = await getAllTags();
        setAvailableTags(tags);
      } catch (err) {
        console.error('Failed to load tags:', err);
      }
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
        sorted.map(async (expense) => {
          try {
            return {
              ...expense,
              participants: await getExpenseParticipants(expense.id),
              tags: await getExpenseTags(expense.id)
            };
          } catch {
            return { ...expense, participants: [], tags: [] };
          }
        })
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

      {/* View Balances button */}
      <div className="px-4 pb-4">
        <button
          onClick={() => router.push('/balances')}
          className="w-full px-4 py-3 rounded-xl border-2 border-ios-blue text-ios-blue font-medium hover:bg-ios-blue/10 dark:hover:bg-ios-blue/20 transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
            />
          </svg>
          View Balances
        </button>
      </div>

      {/* Expense list */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {selectedTag ? `No expenses tagged "${selectedTag}"` : 'No expenses yet. Tap + to create one.'}
          </div>
        ) : (
          expenses.map((expense) => {
            // Build subtitle with category and date
            const subtitleParts = [];
            if (expense.category) {
              subtitleParts.push(expense.category);
            }
            subtitleParts.push(new Date(expense.expense_date).toLocaleDateString());
            const subtitle = subtitleParts.join(' • ');

            return (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ListRow
                  title={expense.description}
                  subtitle={subtitle}
                  value={`$${expense.amount.toFixed(2)}`}
                  showChevron={true}
                  onClick={() => router.push(`/expenses/${expense.id}`)}
                />
              </motion.div>
            );
          })
        )}
      </div>

      {/* FAB (Floating Action Button) */}
      <button
        onClick={() => router.push('/expenses/new')}
        aria-label="Create new expense"
        className="fixed bottom-20 right-4 w-14 h-14 bg-ios-blue text-white rounded-full shadow-lg flex items-center justify-center text-2xl"
      >
        +
      </button>
    </div>
  );
}
