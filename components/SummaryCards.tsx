'use client';

import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Award } from 'lucide-react';
import type { OfflineExpense } from '@/lib/db/types';
import type { CurrencyCode } from '@/lib/currency/types';
import type { DateRange } from '@/lib/utils/analytics';
import { aggregateByCategory, getMostExpensiveCategory } from '@/lib/utils/analytics';
import { getCategoryById } from '@/lib/types/category';

interface SummaryCardsProps {
  expenses: OfflineExpense[];
  currency: CurrencyCode;
  dateRange: DateRange;
}

/**
 * SummaryCards component - displays key metrics for expenses
 *
 * Features:
 * - Total Spent metric with large formatted number
 * - Average Per Day calculated from total / days in range
 * - Most Expensive Category showing name, amount, and icon
 * - Responsive layout: horizontal scroll on mobile, 3-column grid on tablet+
 * - iOS-styled cards with subtle background colors
 * - Framer Motion stagger animation on mount
 * - Full dark mode support
 */
export function SummaryCards({ expenses, currency, dateRange }: SummaryCardsProps) {
  // Calculate total spent (excluding deleted expenses)
  const totalSpent = expenses
    .filter(exp => !exp.is_deleted)
    .reduce((sum, exp) => sum + exp.amount, 0);

  // Calculate days in date range
  const dayCount = Math.max(
    1,
    Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Calculate average per day
  const avgPerDay = totalSpent / dayCount;

  // Get most expensive category
  const aggregated = aggregateByCategory(expenses);
  const topCategory = getMostExpensiveCategory(aggregated);
  const topCategoryData = topCategory
    ? getCategoryById(topCategory.categoryId)
    : null;

  const cards = [
    {
      id: 'total',
      icon: DollarSign,
      label: 'Total Spent',
      value: formatCurrency(totalSpent, currency),
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      iconColor: 'text-ios-blue',
    },
    {
      id: 'average',
      icon: TrendingUp,
      label: 'Avg Per Day',
      value: formatCurrency(avgPerDay, currency),
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      iconColor: 'text-green-600 dark:text-green-500',
    },
    {
      id: 'top-category',
      icon: Award,
      label: 'Most Expensive Category',
      value: topCategory
        ? `${topCategoryData?.label || topCategory.categoryId}`
        : 'N/A',
      subtitle: topCategory
        ? formatCurrency(topCategory.total, currency)
        : undefined,
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      iconColor: 'text-orange-600 dark:text-orange-500',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Mobile: Horizontal scroll */}
      <div className="md:hidden flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="flex-shrink-0 w-72 snap-start"
          >
            <SummaryCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* Tablet+: 3-column grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <SummaryCard {...card} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtitle?: string;
  bgColor: string;
  iconColor: string;
}

function SummaryCard({ icon: Icon, label, value, subtitle, bgColor, iconColor }: SummaryCardProps) {
  return (
    <div className={`${bgColor} rounded-xl p-4 border border-gray-200 dark:border-gray-800`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconColor} bg-white dark:bg-gray-900`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Format currency amount with proper symbol
 */
function formatCurrency(amount: number, currency: CurrencyCode): string {
  const symbols: Record<CurrencyCode, string> = {
    AUD: 'A$',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  return `${symbols[currency] || currency}${amount.toFixed(2)}`;
}
