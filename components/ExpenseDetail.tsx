'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getExpense, getExpenseParticipants, getExpenseSplits } from '@/lib/db/stores';
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';
import type { OfflineExpense, ExpenseParticipant, ExpenseSplit } from '@/lib/db/types';
import type { ParticipantWithDetails } from '@/hooks/useParticipants';
import { ExpenseForm } from './ExpenseForm';

export function ExpenseDetail({ id }: { id: string }) {
  const router = useRouter();
  const { updateExpense, deleteExpense } = useOptimisticMutation();
  const [expense, setExpense] = useState<OfflineExpense | null>(null);
  const [participants, setParticipants] = useState<ExpenseParticipant[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExpense() {
      const exp = await getExpense(id);
      if (!exp) {
        router.push('/expenses');
        return;
      }

      const parts = await getExpenseParticipants(id);
      const spl = await getExpenseSplits(id);

      setExpense(exp);
      setParticipants(parts);
      setSplits(spl);
      setLoading(false);
    }

    loadExpense();
  }, [id, router]);

  const handleUpdate = async (formData: any) => {
    try {
      // Update the basic expense fields
      await updateExpense(id, {
        amount: formData.amount,
        currency: formData.currency,
        description: formData.description,
        category: formData.category,
        expense_date: formData.expense_date
      });
      setIsEditing(false);
      // Reload the expense data
      const exp = await getExpense(id);
      if (exp) setExpense(exp);
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
      name: p.user_id
        ? `User ${p.user_id.slice(0, 8)}`
        : p.participant_id
        ? `Participant ${p.participant_id.slice(0, 8)}`
        : 'Unknown',
      email: null
    }));

    return (
      <div className="max-w-md mx-auto p-4 pb-safe">
        <ExpenseForm
          initialData={{
            amount: expense.amount,
            currency: expense.currency,
            description: expense.description,
            category: expense.category || '',
            expense_date: expense.expense_date,
            participants: participantsWithDetails,
            splits
          }}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-safe">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.back()}
          className="text-ios-blue dark:text-blue-400"
        >
          ← Back
        </button>
        <div className="flex gap-2">
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

      {/* Participants */}
      {participants.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Participants</h2>
          <div className="space-y-2">
            {participants.map(p => {
              // Generate display name from ID for now (until we have participant details)
              const displayName = p.user_id
                ? `User ${p.user_id.slice(0, 8)}`
                : p.participant_id
                ? `Participant ${p.participant_id.slice(0, 8)}`
                : 'Unknown';

              return (
                <div key={p.id} className="text-gray-700 dark:text-gray-300">
                  {displayName}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Splits */}
      {splits.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Split Details</h2>
          <div className="space-y-2">
            {splits.map(split => {
              const participant = participants.find(p =>
                p.user_id === split.user_id || p.participant_id === split.participant_id
              );

              // Generate display name
              const displayName = split.user_id
                ? `User ${split.user_id.slice(0, 8)}`
                : split.participant_id
                ? `Participant ${split.participant_id.slice(0, 8)}`
                : 'Unknown';

              return (
                <div key={split.id} className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">{displayName}</span>
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
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between font-semibold text-gray-900 dark:text-white">
              <span>Total</span>
              <span>${splits.reduce((sum, s) => sum + s.amount, 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
