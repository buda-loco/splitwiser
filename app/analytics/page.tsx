'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/PageTransition';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ChevronLeft } from 'lucide-react';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import { SummaryCards } from '@/components/SummaryCards';
import { SpendingByCategory } from '@/components/SpendingByCategory';
import { SpendingByPerson } from '@/components/SpendingByPerson';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getExpenses } from '@/lib/db/stores';
import { filterExpensesByDateRange } from '@/lib/utils/analytics';
import type { OfflineExpense } from '@/lib/db/types';
import type { CurrencyCode } from '@/lib/currency/types';
import { motion } from 'framer-motion';

export type DateRange = {
  start: Date;
  end: Date;
  preset: string;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().getFullYear(), 0, 1), // Start of year
    end: new Date(),
    preset: 'This Year',
  });
  const [expenses, setExpenses] = useState<OfflineExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // Load expenses on mount
  useEffect(() => {
    async function loadExpenses() {
      setLoading(true);
      try {
        const allExpenses = await getExpenses();
        setExpenses(allExpenses);
      } catch (error) {
        console.error('Failed to load expenses:', error);
      } finally {
        setLoading(false);
      }
    }

    loadExpenses();
  }, []);

  // Filter expenses by selected date range
  const filteredExpenses = filterExpensesByDateRange(expenses, dateRange);

  // Get user's preferred currency
  const currency = (profile?.currency_preference || 'USD') as CurrencyCode;
  const userId = user?.id || '';

  return (
    <ProtectedRoute>
      <PageTransition>
        <div className="min-h-screen bg-ios-gray-light dark:bg-black pb-safe">
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

          {/* Loading state */}
          {loading && (
            <div className="p-4 space-y-4">
              <motion.div
                className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="h-32 flex items-center justify-center text-gray-400 dark:text-gray-600">
                  Loading analytics...
                </div>
              </motion.div>
            </div>
          )}

          {/* Content */}
          {!loading && (
            <div className="p-4 space-y-6">
              {/* Summary Cards */}
              <SummaryCards
                expenses={filteredExpenses}
                currency={currency}
                dateRange={dateRange}
              />

              {/* Spending by Category */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Spending by Category
                </h2>
                <SpendingByCategory
                  expenses={filteredExpenses}
                  currency={currency}
                />
              </div>

              {/* Spending by Person */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Who Paid the Most
                </h2>
                <SpendingByPerson
                  expenses={filteredExpenses}
                  userId={userId}
                  currency={currency}
                />
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}
