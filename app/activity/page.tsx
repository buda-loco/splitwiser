'use client';

import { ActivityFeed } from '@/components/ActivityFeed';

export default function ActivityPage() {
  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-black pb-safe">
      <div className="max-w-2xl mx-auto px-4 pt-safe">
        {/* Header */}
        <div className="py-4 mb-4">
          <h1 className="text-2xl font-bold text-ios-black dark:text-white">
            Activity
          </h1>
          <p className="text-sm text-ios-gray dark:text-ios-gray3 mt-1">
            Recent changes across all expenses
          </p>
        </div>

        {/* Activity Feed */}
        <ActivityFeed />
      </div>
    </div>
  );
}
