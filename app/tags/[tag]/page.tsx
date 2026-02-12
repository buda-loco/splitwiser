'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { TagSummary } from '@/components/TagSummary';
import { PageTransition } from '@/components/PageTransition';

export default function TagDetailPage({
  params
}: {
  params: Promise<{ tag: string }>;
}) {
  const router = useRouter();
  const { tag } = use(params);
  const decodedTag = decodeURIComponent(tag);

  return (
    <PageTransition>
      <div className="min-h-screen bg-white dark:bg-black pt-safe-top pb-safe">
        <div className="max-w-md mx-auto">
          {/* Header with back button */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
            <button
              onClick={() => router.back()}
              className="text-ios-blue dark:text-ios-blue text-base"
            >
              ← Back
            </button>
            <h1 className="text-xl font-semibold text-black dark:text-white">
              Tag Details
            </h1>
          </div>

          {/* Tag summary component */}
          <div className="p-4">
            <TagSummary tag={decodedTag} />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
