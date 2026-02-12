import { TagManagement } from '@/components/TagManagement';
import { PageTransition } from '@/components/PageTransition';

export default function TagsPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-white dark:bg-black pt-safe-top pb-safe">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-4 py-3 z-20">
            <h1 className="text-2xl font-semibold text-black dark:text-white">
              Manage Tags
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Rename, merge, or delete tags across all expenses
            </p>
          </div>

          {/* Tag management component */}
          <TagManagement />
        </div>
      </div>
    </PageTransition>
  );
}
