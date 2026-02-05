'use client';

import { ExpenseForm, ExpenseFormData } from '@/components/ExpenseForm';
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

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
  const router = useRouter();

  const handleSubmit = async (formData: ExpenseFormData) => {
    try {
      // TODO: Replace with actual auth when authentication is implemented
      // For now, use a temporary user ID placeholder
      const currentUserId = 'temp-user-id';

      // Prepare expense data with user IDs
      const expense = {
        ...formData,
        paid_by_user_id: currentUserId,
        created_by_user_id: currentUserId,
        // Note: Participants and splits will be added in later plans (04-02, 04-03)
        // For now, expenses are created without splits
      };

      // Create expense optimistically (appears instantly in IndexedDB)
      const id = await createExpense(expense);

      // Navigate to expense detail page
      // Note: This assumes the expense detail page exists or will be created
      // For now, navigate back to home (expenses list)
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
    <div className="min-h-screen bg-white dark:bg-black pb-24">
      {/* Header */}
      <div className="pt-safe-top px-4 py-6 border-b border-ios-gray5 dark:border-gray-800">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900 dark:text-white"
        >
          New Expense
        </motion.h1>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-md mx-auto px-4 py-6"
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
              <span className="text-xl">⚠️</span>
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
  );
}
