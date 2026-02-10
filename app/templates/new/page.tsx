'use client';

import { TemplateForm, type TemplateFormData } from '@/components/TemplateForm';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { createTemplate } from '@/lib/db/stores';
import type { TemplateCreateInput } from '@/lib/db/types';
import { useState } from 'react';

/**
 * New Template Page
 *
 * Enables users to create reusable split templates that can be applied
 * to future expenses. Templates store participant lists and split configurations
 * for common expense patterns (e.g., "Trip with Friends", "Weekly Groceries").
 *
 * Features:
 * - TemplateForm integration with validation
 * - Direct creation (no optimistic updates needed for templates)
 * - Navigation to templates list after creation
 * - Error display if submission fails
 * - iOS-native page layout
 */
export default function NewTemplatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (formData: TemplateFormData) => {
    if (!user) {
      setError(new Error('You must be logged in to create a template'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Prepare template data
      const input: TemplateCreateInput = {
        name: formData.name,
        split_type: formData.split_type,
        created_by_user_id: user.id,
        participants: formData.splits.map(split => ({
          user_id: split.user_id || null,
          participant_id: split.participant_id || null,
          split_value: split.split_value || null
        }))
      };

      // Create template (stored locally in IndexedDB, synced in background)
      await createTemplate(input);

      // Navigate to templates list page after creation
      router.push('/templates');
    } catch (err) {
      console.error('Failed to create template:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
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
          New Template
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-2 text-sm text-gray-600 dark:text-gray-400"
        >
          Create a reusable split configuration for common expenses
        </motion.p>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-md mx-auto px-4 py-6"
      >
        <TemplateForm
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
                  Failed to create template
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error.message}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center text-sm text-ios-gray"
          >
            Creating template...
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
