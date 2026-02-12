'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/PageTransition';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ChevronLeft } from 'lucide-react';
import { DateRangeSelector } from '@/components/DateRangeSelector';

export type DateRange = {
  start: Date;
  end: Date;
  preset: string;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().getFullYear(), 0, 1), // Start of year
    end: new Date(),
    preset: 'This Year',
  });

  return (
    <ProtectedRoute>
      <PageTransition>
        <div className="min-h-screen bg-ios-gray-light dark:bg-black pb-safe pb-24">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="text-ios-blue hover:text-ios-blue/80 transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Analytics
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Insights into your spending patterns
                </p>
              </div>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="p-4">
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
          </div>

          {/* Placeholder sections for charts */}
          <div className="p-4 space-y-4">
            {/* Total Spending Card - Placeholder */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Total Spending
              </h2>
              <div className="h-20 flex items-center justify-center text-gray-400 dark:text-gray-600">
                Chart coming soon
              </div>
            </div>

            {/* Spending by Category - Placeholder */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Spending by Category
              </h2>
              <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-600">
                Chart coming soon
              </div>
            </div>

            {/* Spending by Person - Placeholder */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Spending by Person
              </h2>
              <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-600">
                Chart coming soon
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}
