'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettlements } from '@/hooks/useSettlements';
import type { Settlement } from '@/lib/db/types';
import { getParticipantDisplayName } from '@/lib/utils/display-name';
import { deleteSettlement } from '@/lib/db/stores';

type GroupedSettlements = {
  [key: string]: Settlement[];
};

/**
 * Get date group label for a settlement
 */
function getDateGroup(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const settlementDate = new Date(date);
  const settlementDay = new Date(
    settlementDate.getFullYear(),
    settlementDate.getMonth(),
    settlementDate.getDate()
  );

  if (settlementDay.getTime() === today.getTime()) {
    return 'Today';
  } else if (settlementDay.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else if (settlementDay >= thisWeekStart) {
    return 'This Week';
  } else if (settlementDay >= thisMonthStart) {
    return 'This Month';
  } else {
    return 'Older';
  }
}

/**
 * Get badge color and text for settlement type
 */
function getSettlementTypeBadge(type: Settlement['settlement_type']) {
  switch (type) {
    case 'global':
      return { color: 'bg-green-500 text-white', label: 'Global' };
    case 'tag_specific':
      return { color: 'bg-blue-500 text-white', label: 'Tag' };
    case 'partial':
      return { color: 'bg-gray-500 text-white', label: 'Partial' };
  }
}

/**
 * Get full text for settlement type
 */
function getSettlementTypeText(settlement: Settlement): string {
  switch (settlement.settlement_type) {
    case 'global':
      return 'Global settlement';
    case 'tag_specific':
      return `Tag-specific settlement for #${settlement.tag}`;
    case 'partial':
      return 'Partial payment';
  }
}

/**
 * Format full date for detail view
 */
function formatFullDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function SettlementHistory() {
  const { settlements, loading, refetch } = useSettlements();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const success = await deleteSettlement(id);
      if (success) {
        // Dispatch settlement-deleted event for balance re-calculation
        window.dispatchEvent(new CustomEvent('settlement-deleted'));

        setExpandedId(null);
        setShowDeleteConfirm(null);
        await refetch();
      } else {
        alert('Failed to delete settlement');
      }
    } catch (error) {
      console.error('Error deleting settlement:', error);
      alert('Failed to delete settlement');
    } finally {
      setDeleting(false);
    }
  };

  // Group settlements by date
  const groupedSettlements: GroupedSettlements = settlements.reduce((acc, settlement) => {
    const group = getDateGroup(new Date(settlement.settlement_date));
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(settlement);
    return acc;
  }, {} as GroupedSettlements);

  // Order groups
  const groupOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];
  const orderedGroups = groupOrder.filter((group) => groupedSettlements[group]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-4">
        {/* Skeleton loading */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (settlements.length === 0) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <div className="text-6xl mb-4">💸</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No settlements yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Settlements you record will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-4">
      {orderedGroups.map((group) => (
        <div key={group} className="mb-6">
          {/* Group header */}
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 mb-2">
            {group}
          </h2>

          {/* Settlements in group */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {groupedSettlements[group].map((settlement) => {
              const isExpanded = expandedId === settlement.id;
              const badge = getSettlementTypeBadge(settlement.settlement_type);
              const fromName = getParticipantDisplayName({
                user_id: settlement.from_user_id,
                participant_id: settlement.from_participant_id,
              });
              const toName = getParticipantDisplayName({
                user_id: settlement.to_user_id,
                participant_id: settlement.to_participant_id,
              });

              return (
                <motion.div
                  key={settlement.id}
                  className="bg-white dark:bg-gray-800"
                  layout
                >
                  {/* Settlement row - clickable */}
                  <motion.div
                    className="p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-750 dark:active:bg-gray-700"
                    onClick={() => setExpandedId(isExpanded ? null : settlement.id)}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            {fromName}
                          </span>
                          <span className="text-gray-400 dark:text-gray-600">→</span>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            {toName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>
                            {badge.label}
                          </span>
                          {settlement.tag && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              #{settlement.tag}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {settlement.currency} {settlement.amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(settlement.settlement_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Expand indicator */}
                    <div className="flex justify-center">
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg
                          className="w-5 h-5 text-gray-400"
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
                        </svg>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Expanded detail view */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                          {/* Settlement type */}
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Type
                            </div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {getSettlementTypeText(settlement)}
                            </div>
                          </div>

                          {/* From person */}
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              From
                            </div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                              {fromName}
                            </div>
                          </div>

                          {/* To person */}
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              To
                            </div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                              {toName}
                            </div>
                          </div>

                          {/* Amount */}
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Amount
                            </div>
                            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                              {settlement.currency} {settlement.amount.toFixed(2)}
                            </div>
                          </div>

                          {/* Date */}
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Settlement Date
                            </div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {formatFullDate(settlement.settlement_date)}
                            </div>
                          </div>

                          {/* Created timestamp */}
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Created {new Date(settlement.created_at).toLocaleString()}
                            </div>
                          </div>

                          {/* Delete button */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(settlement.id);
                              }}
                              disabled={deleting}
                              className="w-full py-3 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 active:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {deleting ? 'Deleting...' : 'Delete Settlement'}
                            </button>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* Alert Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
                {/* Title */}
                <div className="px-6 pt-6 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Delete Settlement?
                  </h3>
                </div>

                {/* Message */}
                <div className="px-6 pb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This will remove this{' '}
                    {settlements.find((s) => s.id === showDeleteConfirm)
                      ? `${settlements.find((s) => s.id === showDeleteConfirm)!.currency} ${settlements
                          .find((s) => s.id === showDeleteConfirm)!
                          .amount.toFixed(2)}`
                      : ''}{' '}
                    settlement. This cannot be undone.
                  </p>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    disabled={deleting}
                    className="py-3 text-center font-medium text-ios-blue hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (showDeleteConfirm) {
                        handleDelete(showDeleteConfirm);
                      }
                    }}
                    disabled={deleting}
                    className="py-3 text-center font-medium text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
