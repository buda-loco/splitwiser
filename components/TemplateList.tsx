'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { deleteTemplate } from '@/lib/db/stores';
import type { OfflineSplitTemplate } from '@/lib/db/types';

export function TemplateList({ templates }: { templates: OfflineSplitTemplate[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(templateId: string) {
    // Show confirmation (iOS-style alert)
    const confirmed = window.confirm('Delete this template? This cannot be undone.');
    if (!confirmed) return;

    setDeletingId(templateId);
    try {
      await deleteTemplate(templateId);
      // Trigger re-render by navigating to same page (Next.js will refetch)
      router.refresh();
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-ios-gray dark:text-ios-gray3 text-base mb-4">
          No templates yet
        </p>
        <button
          onClick={() => router.push('/templates/new')}
          className="text-ios-blue text-base font-medium"
        >
          Create your first template
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {templates.map((template) => (
        <motion.div
          key={template.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-ios-gray1 rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-ios-black dark:text-white mb-1">
                {template.name}
              </h3>
              <p className="text-sm text-ios-gray dark:text-ios-gray3 capitalize">
                Split type: {template.split_type}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/templates/${template.id}/edit`)}
                className="px-3 py-1.5 text-sm font-medium text-ios-blue bg-ios-blue/10 rounded-lg hover:bg-ios-blue/20 active:scale-95 transition-all"
                disabled={deletingId === template.id}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                className="px-3 py-1.5 text-sm font-medium text-ios-red bg-ios-red/10 rounded-lg hover:bg-ios-red/20 active:scale-95 transition-all disabled:opacity-50"
                disabled={deletingId === template.id}
              >
                {deletingId === template.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
