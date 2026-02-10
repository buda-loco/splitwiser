'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getExpenseVersions } from '@/lib/db/stores';
import type { OfflineExpenseVersion } from '@/lib/db/types';

export function ExpenseVersionHistory({ expenseId }: { expenseId: string }) {
  const [versions, setVersions] = useState<OfflineExpenseVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function loadVersions() {
      const v = await getExpenseVersions(expenseId);
      setVersions(v);
      setLoading(false);
    }
    loadVersions();
  }, [expenseId]);

  if (loading) return null; // Don't show loader - optional section
  if (versions.length === 0) return null; // No history yet

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Version History ({versions.length})
        </h3>
        <motion.svg
          animate={{ rotate: expanded ? 180 : 0 }}
          className="w-5 h-5 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </motion.svg>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 space-y-2 overflow-hidden"
          >
            {versions.map((version) => (
              <div
                key={version.id}
                className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {version.change_type}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {formatRelativeTime(version.created_at)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Version {version.version_number}
                </p>
                {renderChanges(version)}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function renderChanges(version: OfflineExpenseVersion) {
  const { before, after } = version.changes;
  if (!before && !after) return null;

  // For 'created', show all fields
  if (version.change_type === 'created' && after) {
    return (
      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
        Amount: {after.amount} {after.currency}
        {after.description && <span> • {after.description}</span>}
      </div>
    );
  }

  // For 'updated', show what changed
  if (version.change_type === 'updated' && before && after) {
    const changes = [];
    if (before.amount !== after.amount) {
      changes.push(`Amount: ${before.amount} → ${after.amount}`);
    }
    if (before.description !== after.description) {
      changes.push(`Description: "${before.description}" → "${after.description}"`);
    }
    if (before.category !== after.category) {
      changes.push(`Category: ${before.category || 'None'} → ${after.category || 'None'}`);
    }
    return changes.length > 0 ? (
      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
        {changes.map((c, i) => <div key={i}>{c}</div>)}
      </div>
    ) : null;
  }

  // For 'deleted' and 'restored', just show the action
  return null;
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}
