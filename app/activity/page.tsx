'use client';

import { ActivityFeed } from '@/components/ActivityFeed';
import { PageTransition } from '@/components/PageTransition';

export default function ActivityPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-white dark:bg-black pt-safe-top pb-safe">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-4">
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
    </PageTransition>
  );
}
