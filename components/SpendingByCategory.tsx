'use client';

import { useState } from 'react';
import { PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import type { OfflineExpense } from '@/lib/db/types';
import { aggregateByCategory } from '@/lib/utils/analytics';
import { getCategoryById } from '@/lib/types/category';
import type { CurrencyCode } from '@/lib/currency/types';

type ChartType = 'pie' | 'bar';

interface SpendingByCategoryProps {
  expenses: OfflineExpense[];
  currency: CurrencyCode;
}

/**
 * SpendingByCategory component - displays expense breakdown by category
 *
 * Features:
 * - Toggle between pie chart and bar chart views
 * - Category colors and icons from predefined categories
 * - Responsive design for mobile
 * - Dark mode support
 * - Shows total spending and percentages
 */
export function SpendingByCategory({ expenses, currency }: SpendingByCategoryProps) {
  const [chartType, setChartType] = useState<ChartType>('pie');

  // Aggregate expenses by category
  const aggregated = aggregateByCategory(expenses);
  const categories = Object.values(aggregated);

  // Calculate total for percentages
  const total = categories.reduce((sum, cat) => sum + cat.total, 0);

  // Prepare data for charts
  const chartData = categories.map(cat => {
    const category = getCategoryById(cat.categoryId);
    const percentage = total > 0 ? (cat.total / total * 100).toFixed(1) : '0.0';

    return {
      name: category?.label || cat.categoryId,
      value: cat.total,
      percentage,
      count: cat.count,
      color: category ? extractColorFromClass(category.color) : '#8E8E93',
    };
  });

  // No data state
  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>No expenses in this date range</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total: {formatCurrency(total, currency)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('pie')}
            className={`p-2 rounded-lg transition-colors ${
              chartType === 'pie'
                ? 'bg-ios-blue text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-label="Pie chart view"
          >
            <PieChartIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`p-2 rounded-lg transition-colors ${
              chartType === 'bar'
                ? 'bg-ios-blue text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-label="Bar chart view"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chart container with animation */}
      <AnimatePresence mode="wait">
        {chartType === 'pie' ? (
          <motion.div
            key="pie"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderPieLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip currency={currency} />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="bar"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40)}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  stroke="#8E8E93"
                  tick={{ fill: '#8E8E93', fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#8E8E93"
                  tick={{ fill: '#8E8E93', fontSize: 12 }}
                  width={90}
                />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Custom label renderer for pie chart
 */
function renderPieLabel(props: any) {
  const percentage = props.percent ? (props.percent * 100).toFixed(0) : '0';
  if (parseFloat(percentage) < 5) return null; // Hide small labels
  return `${percentage}%`;
}

/**
 * Custom tooltip component
 */
function CustomTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: any[];
  currency: CurrencyCode;
}) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
      <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
        {data.name}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        {formatCurrency(data.value, currency)} ({data.percentage}%)
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {data.count} {data.count === 1 ? 'expense' : 'expenses'}
      </p>
    </div>
  );
}

/**
 * Extract hex color from Tailwind class name
 */
function extractColorFromClass(colorClass: string): string {
  // Map Tailwind color classes to hex values
  const colorMap: Record<string, string> = {
    'bg-orange-500': '#f97316',
    'bg-orange-600': '#ea580c',
    'bg-blue-500': '#3b82f6',
    'bg-blue-600': '#2563eb',
    'bg-purple-500': '#a855f7',
    'bg-purple-600': '#9333ea',
    'bg-pink-500': '#ec4899',
    'bg-pink-600': '#db2777',
    'bg-yellow-500': '#eab308',
    'bg-yellow-600': '#ca8a04',
    'bg-teal-500': '#14b8a6',
    'bg-teal-600': '#0d9488',
    'bg-red-500': '#ef4444',
    'bg-red-600': '#dc2626',
    'bg-green-500': '#22c55e',
    'bg-green-600': '#16a34a',
    'bg-indigo-500': '#6366f1',
    'bg-indigo-600': '#4f46e5',
    'bg-gray-500': '#6b7280',
    'bg-gray-600': '#4b5563',
  };

  // Extract the base color class (light mode version)
  const baseClass = colorClass.split(' ')[0];
  return colorMap[baseClass] || '#8E8E93';
}

/**
 * Format currency amount
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
