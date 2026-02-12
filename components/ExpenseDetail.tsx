'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getExpense, getExpenseParticipants, getExpenseSplits, getExpenseTags, addTagToExpense, removeTagFromExpense, getExpenseVersions, revertExpenseToVersion, updateExpense as updateExpenseStore } from '@/lib/db/stores';
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';
import type { OfflineExpense, ExpenseParticipant, ExpenseSplit, OfflineExpenseVersion } from '@/lib/db/types';
import type { ParticipantWithDetails } from '@/hooks/useParticipants';
import { getParticipantDisplayName } from '@/lib/utils/display-name';
import { ExpenseForm, type ExpenseFormData } from './ExpenseForm';
import { ReceiptGallery } from './ReceiptGallery';

export function ExpenseDetail({ id }: { id: string }) {
  const router = useRouter();
  const { updateExpense, deleteExpense } = useOptimisticMutation();
  const [expense, setExpense] = useState<OfflineExpense | null>(null);
  const [participants, setParticipants] = useState<ExpenseParticipant[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [versions, setVersions] = useState<OfflineExpenseVersion[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [undoError, setUndoError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExpense() {
      const exp = await getExpense(id);
      if (!exp) {
        router.push('/expenses');
        return;
      }

      const parts = await getExpenseParticipants(id);
      const spl = await getExpenseSplits(id);
      const tgs = await getExpenseTags(id);
      const vers = await getExpenseVersions(id);

      setExpense(exp);
      setParticipants(parts);
      setSplits(spl);
      setTags(tgs);
      setVersions(vers);
      setLoading(false);
    }

    loadExpense();
  }, [id, router]);

  const handleUpdate = async (formData: ExpenseFormData) => {
    try {
      // Update the basic expense fields
      await updateExpense(id, {
        amount: formData.amount,
        currency: formData.currency,
        description: formData.description,
        category: formData.category,
        expense_date: formData.expense_date,
        receipt_urls: formData.receipt_urls
      });

      // Update tags
      const existingTags = await getExpenseTags(id);
      const newTags = formData.tags || [];

      // Remove tags that are no longer present
      for (const tag of existingTags) {
        if (!newTags.includes(tag)) {
          try {
            await removeTagFromExpense(id, tag);
          } catch (err) {
            console.error(`Failed to remove tag "${tag}":`, err);
          }
        }
      }

      // Add new tags that weren't in existing tags
      for (const tag of newTags) {
        if (!existingTags.includes(tag)) {
          try {
            await addTagToExpense(id, tag);
          } catch (err) {
            console.error(`Failed to add tag "${tag}":`, err);
          }
        }
      }

      setIsEditing(false);
      // Reload the expense data
      const exp = await getExpense(id);
      const tgs = await getExpenseTags(id);
      if (exp) setExpense(exp);
      setTags(tgs);
    } catch (err) {
      console.error('Failed to update expense:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this expense? This cannot be undone.')) return;

    try {
      await deleteExpense(id);
      router.push('/expenses');
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  const handleUndo = async () => {
    const canUndo = versions.length > 1;
    const previousVersion = versions[1];

    if (!canUndo || !previousVersion) return;

    const confirmed = window.confirm(
      `Undo last change? This will revert to version ${previousVersion.version_number}.`
    );
    if (!confirmed) return;

    setUndoError(null);
    try {
      const userId = 'temp-user-id'; // TODO: Get from auth context
      await revertExpenseToVersion(id, previousVersion.version_number, userId);

      // Reload the expense data
      const exp = await getExpense(id);
      const tgs = await getExpenseTags(id);
      const vers = await getExpenseVersions(id);
      if (exp) setExpense(exp);
      setTags(tgs);
      setVersions(vers);
    } catch (error) {
      console.error('Failed to undo:', error);
      setUndoError('Failed to undo change. Please try again.');
    }
  };

  const handleReceiptDelete = async (url: string) => {
    if (!expense) return;

    try {
      const updatedReceipts = (expense.receipt_urls || []).filter(r => r !== url);
      const userId = 'temp-user-id'; // TODO: Get from auth context
      await updateExpenseStore(id, { receipt_urls: updatedReceipts }, userId);

      // Reload the expense data
      const exp = await getExpense(id);
      if (exp) setExpense(exp);
    } catch (error) {
      console.error('Failed to delete receipt:', error);
      alert('Failed to delete receipt. Please try again.');
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading...</div>;
  }

  if (!expense) {
    return <div className="p-4 text-center text-gray-500">Expense not found</div>;
  }

  if (isEditing) {
    // Convert ExpenseParticipant to ParticipantWithDetails for the form
    const participantsWithDetails = participants.map(p => ({
      user_id: p.user_id,
      participant_id: p.participant_id,
      name: getParticipantDisplayName(p),
      email: null
    }));

    return (
      <ExpenseForm
        initialData={{
          amount: expense.amount,
          currency: expense.currency,
          description: expense.description,
          category: expense.category || '',
          expense_date: expense.expense_date,
          participants: participantsWithDetails,
          splits,
          tags,
          receipt_urls: expense.receipt_urls
        }}
        onSubmit={handleUpdate}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.back()}
          className="text-ios-blue dark:text-blue-400"
        >
          ← Back
        </button>
        <div className="flex gap-2">
          {versions.length > 1 && (
            <button
              onClick={handleUndo}
              className="px-3 py-1.5 text-sm font-medium text-ios-blue bg-ios-blue/10 rounded-lg hover:bg-ios-blue/20 active:scale-95 transition-all"
            >
              Undo Last Change
            </button>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-ios-blue dark:text-blue-400"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-ios-red dark:text-red-400"
          >
            Delete
          </button>
        </div>
      </div>

      {undoError && (
        <div className="mx-4 mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{undoError}</p>
        </div>
      )}

      {/* Expense details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-4">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
          ${expense.amount.toFixed(2)} {expense.currency}
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">{expense.description}</p>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          {expense.category && (
            <div className="flex justify-between">
              <span>Category</span>
              <span className="font-medium text-gray-900 dark:text-white">{expense.category}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Date</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Date(expense.expense_date).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Receipt Gallery */}
      {expense.receipt_urls && expense.receipt_urls.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Receipts</h2>
          <ReceiptGallery
            receiptUrls={expense.receipt_urls}
            onDelete={handleReceiptDelete}
          />
        </div>
      )}

      {/* Participants */}
      {participants.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Participants</h2>
          <div className="space-y-2">
            {participants.map(p => (
                <div key={p.id} className="text-gray-700 dark:text-gray-300">
                  {getParticipantDisplayName(p)}
                </div>
            ))}
          </div>
        </div>
      )}

      {/* Splits */}
      {splits.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Split Details</h2>
          <div className="space-y-2">
            {splits.map(split => (
                <div key={split.id} className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">{getParticipantDisplayName(split)}</span>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">
                      ${split.amount.toFixed(2)}
                    </div>
                    {split.split_type !== 'equal' && split.split_value !== null && (
                      <div className="text-xs text-gray-500">
                        {split.split_type === 'percentage' && `${split.split_value}%`}
                        {split.split_type === 'shares' && `${split.split_value} shares`}
                      </div>
                    )}
                  </div>
                </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between font-semibold text-gray-900 dark:text-white">
              <span>Total</span>
              <span>${splits.reduce((sum, s) => sum + s.amount, 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
