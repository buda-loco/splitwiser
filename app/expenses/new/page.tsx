'use client';

import { ExpenseForm, type ExpenseFormData } from '@/components/ExpenseForm';
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { addParticipantToExpense, createSplit, addTagToExpense, deleteExpense, saveParticipant } from '@/lib/db/stores';
import { PageTransition } from '@/components/PageTransition';

/**
 * New Expense Page
 *
 * Enables users to create new expenses with optimistic updates.
 * The expense appears instantly in the UI before sync completes,
 * providing a native-feeling experience.
 *
 * Features:
 * - ExpenseForm integration with validation
 * - Optimistic submission via useOptimisticMutation
 * - Instant navigation after creation
 * - Error display if submission fails
 * - iOS-native page layout
 */
export default function NewExpensePage() {
  const { createExpense, isLoading, error } = useOptimisticMutation();
  const { user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (formData: ExpenseFormData) => {
    if (!user) return;

    try {
      const currentUserId = user.id;

      // Prepare expense data (without participants and splits)
      const expenseData = {
        amount: formData.amount,
        currency: formData.currency,
        description: formData.description,
        category: formData.category,
        expense_date: formData.expense_date,
        paid_by_user_id: currentUserId,
        created_by_user_id: currentUserId,
      };

      // Create expense optimistically (appears instantly in IndexedDB)
      const expenseId = await createExpense(expenseData);

      try {
        // Save and add participants to the expense
        for (const participant of formData.participants) {
          // If this is a new participant (has name but no user_id), save it first
          if (participant.participant_id && !participant.user_id && participant.name) {
            await saveParticipant({
              id: participant.participant_id,
              name: participant.name,
              email: participant.email,
              created_by_user_id: currentUserId,
            });
          }

          await addParticipantToExpense(
            expenseId,
            participant.user_id || undefined,
            participant.participant_id || undefined
          );
        }

        // Add splits to the expense
        for (const split of formData.splits) {
          await createSplit({
            ...split,
            expense_id: expenseId
          });
        }

        // Add tags to the expense
        for (const tag of formData.tags) {
          try {
            await addTagToExpense(expenseId, tag);
          } catch (err) {
            // Log but don't block submission on tag errors
            console.error(`Failed to add tag "${tag}":`, err);
          }
        }
      } catch (detailErr) {
        // If participants/splits fail, clean up the orphaned expense
        console.error('Failed to add expense details, rolling back:', detailErr);
        await deleteExpense(expenseId);
        throw detailErr;
      }

      // Navigate to expense list
      router.push('/');
    } catch (err) {
      // Error is already captured by useOptimisticMutation
      // It will be displayed via the error state below
      console.error('Failed to create expense:', err);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-white dark:bg-black pt-safe-top pb-safe">
        <div className="max-w-md mx-auto px-4 py-6">
          {/* Header */}
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900 dark:text-white mb-6"
          >
            New Expense
          </motion.h1>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ExpenseForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />

            {/* Error display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-ios-red rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-ios-red flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-ios-red mb-1">
                      Failed to create expense
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Loading indicator (though optimistic = instant) */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-center text-sm text-ios-gray"
              >
                Saving expense...
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
