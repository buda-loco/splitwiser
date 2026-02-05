'use client';

import { useState, useEffect } from 'react';
import { getExpenses, getExpenseParticipants } from '@/lib/db/stores';
import type { OfflineExpense } from '@/lib/db/types';

interface TagStats {
  totalExpenses: number;
  totalAmount: number;
  participantCount: number;
  dateRange: { start: string; end: string };
}

export function TagSummary({ tag }: { tag: string }) {
  const [expenses, setExpenses] = useState<OfflineExpense[]>([]);
  const [stats, setStats] = useState<TagStats>({
    totalExpenses: 0,
    totalAmount: 0,
    participantCount: 0,
    dateRange: { start: '', end: '' }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTagData() {
      // 1. Load expenses for tag
      const tagExpenses = await getExpenses({ tag });
      setExpenses(tagExpenses);

      // 2. Calculate statistics
      const totalAmount = tagExpenses.reduce((sum, e) => sum + e.amount, 0);

      // 3. Find unique participants across all expenses
      const participantIds = new Set<string>();
      for (const expense of tagExpenses) {
        const participants = await getExpenseParticipants(expense.id);
        participants.forEach(p => {
          const id = p.user_id || p.participant_id;
          if (id) participantIds.add(id);
        });
      }

      // 4. Find date range
      const dates = tagExpenses.map(e => new Date(e.expense_date)).sort((a, b) => a.getTime() - b.getTime());
      const start = dates[0]?.toISOString().split('T')[0] || '';
      const end = dates[dates.length - 1]?.toISOString().split('T')[0] || '';

      setStats({
        totalExpenses: tagExpenses.length,
        totalAmount,
        participantCount: participantIds.size,
        dateRange: { start, end }
      });

      setLoading(false);
    }

    loadTagData();
  }, [tag]);

  if (loading) {
    return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Tag header card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
          {tag}
        </h2>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
            <p className="text-2xl font-semibold text-black dark:text-white">
              {stats.totalExpenses}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
            <p className="text-2xl font-semibold text-black dark:text-white">
              ${stats.totalAmount.toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Participants</p>
            <p className="text-2xl font-semibold text-black dark:text-white">
              {stats.participantCount}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Date Range</p>
            <p className="text-sm font-medium text-black dark:text-white">
              {stats.dateRange.start && stats.dateRange.end
                ? `${stats.dateRange.start} - ${stats.dateRange.end}`
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Note about balances */}
      <div className="bg-ios-blue/10 dark:bg-gray-800 rounded-xl p-4">
        <p className="text-sm text-ios-blue dark:text-gray-300">
          Tag-specific balance calculation coming in Phase 7. For now, balances are global across all expenses.
        </p>
      </div>

      {/* Expense list for this tag */}
      <div>
        <h3 className="text-lg font-semibold text-black dark:text-white mb-3">
          Expenses
        </h3>
        {/* Reuse ExpenseList but filter to this tag */}
      </div>
    </div>
  );
}
