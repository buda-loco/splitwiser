'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getRecentExpenseChanges, getExpense } from '@/lib/db/stores';
import type { OfflineExpenseVersion, OfflineExpense } from '@/lib/db/types';
import { formatRelativeTime } from '@/lib/utils/time';

type ActivityItem = {
  version: OfflineExpenseVersion;
  expense: OfflineExpense | null;
};

export function ActivityFeed() {
  const router = useRouter();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  type FilterOption = 'all' | '7d' | '30d';
  const [filter, setFilter] = useState<FilterOption>('all');

  useEffect(() => {
    async function loadActivity() {
      try {
        const versions = await getRecentExpenseChanges(100);

        // Filter by time
        const now = new Date();
        const filtered = versions.filter(v => {
          if (filter === 'all') return true;
          const age = now.getTime() - new Date(v.created_at).getTime();
          const days = age / 86400000;
          return filter === '7d' ? days <= 7 : days <= 30;
        });

        // Load expense for each version
        const itemsWithExpenses = await Promise.all(
          filtered.map(async (version) => ({
            version,
            expense: await getExpense(version.expense_id)
          }))
        );

        setItems(itemsWithExpenses);
      } catch (err) {
        console.error('Failed to load activity:', err);
      } finally {
        setLoading(false);
      }
    }

    loadActivity();
  }, [filter]);

  if (loading) {
    return (
      <div className="text-center py-12 text-ios-gray dark:text-ios-gray3">
        Loading activity...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-ios-gray dark:text-ios-gray3 text-base">
          No activity yet
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {([
          { id: 'all' as FilterOption, label: 'All' },
          { id: '7d' as FilterOption, label: 'Last 7 days' },
          { id: '30d' as FilterOption, label: 'Last 30 days' }
        ]).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === id
                ? 'bg-ios-blue text-white'
                : 'bg-ios-gray5 dark:bg-ios-gray2 text-ios-black dark:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Activity list */}
      <div className="space-y-2">
        {items.map(({ version, expense }) => (
          <motion.div
            key={version.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-ios-gray1 rounded-xl p-4 shadow-sm cursor-pointer active:scale-98 transition-transform"
            onClick={() => expense && router.push(`/expenses/${expense.id}`)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <span className={`text-sm font-medium capitalize ${
                  version.change_type === 'created' ? 'text-ios-green' :
                  version.change_type === 'updated' ? 'text-ios-blue' :
                  version.change_type === 'deleted' ? 'text-ios-red' :
                  'text-ios-purple'
                }`}>
                  {version.change_type}
                </span>
                <p className="text-base font-semibold text-ios-black dark:text-white mt-1">
                  {expense?.description || 'Deleted expense'}
                </p>
                {expense && (
                  <p className="text-sm text-ios-gray dark:text-ios-gray3">
                    {expense.amount} {expense.currency}
                  </p>
                )}
              </div>
              <span className="text-xs text-ios-gray dark:text-ios-gray3">
                {formatRelativeTime(version.created_at)}
              </span>
            </div>

            {renderChangeSummary(version)}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function renderChangeSummary(version: OfflineExpenseVersion): React.ReactNode {
  const { before, after } = version.changes;
  if (version.change_type === 'created' && after) {
    return (
      <p className="text-xs text-ios-gray dark:text-ios-gray3">
        Created new expense
      </p>
    );
  }
  if (version.change_type === 'updated' && before && after) {
    const changes = [];
    if (before.amount !== after.amount) changes.push('amount');
    if (before.description !== after.description) changes.push('description');
    if (before.category !== after.category) changes.push('category');

    return changes.length > 0 ? (
      <p className="text-xs text-ios-gray dark:text-ios-gray3">
        Changed: {changes.join(', ')}
      </p>
    ) : null;
  }
  return null;
}

