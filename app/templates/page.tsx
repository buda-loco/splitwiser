'use client';

import { useRouter } from 'next/navigation';
import { TemplateList } from '@/components/TemplateList';
import { useTemplates } from '@/hooks/useTemplates';

export default function TemplatesPage() {
  const router = useRouter();
  const userId = 'temp-user-id'; // TODO: Get from auth context
  const { templates, loading } = useTemplates(userId);

  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-black pb-safe">
      <div className="max-w-2xl mx-auto px-4 pt-safe">
        {/* Header */}
        <div className="flex items-center justify-between py-4 mb-4">
          <h1 className="text-2xl font-bold text-ios-black dark:text-white">
            Templates
          </h1>
          <button
            onClick={() => router.push('/templates/new')}
            className="px-4 py-2 bg-ios-blue text-white rounded-xl font-medium active:scale-95 transition-transform"
          >
            + New Template
          </button>
        </div>

        {/* Template List */}
        {loading ? (
          <div className="text-center py-12 text-ios-gray dark:text-ios-gray3">
            Loading templates...
          </div>
        ) : (
          <TemplateList templates={templates} />
        )}
      </div>
    </div>
  );
}
