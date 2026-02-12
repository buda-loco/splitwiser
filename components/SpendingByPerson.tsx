'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { OfflineExpense } from '@/lib/db/types';
import { aggregateByPerson } from '@/lib/utils/analytics';
import { getParticipantById } from '@/lib/db/stores';
import type { CurrencyCode } from '@/lib/currency/types';

interface SpendingByPersonProps {
  expenses: OfflineExpense[];
  userId: string;
  currency: CurrencyCode;
}

interface PersonData {
  id: string;
  name: string;
  totalPaid: number;
  count: number;
  isCurrentUser: boolean;
}

/**
 * SpendingByPerson component - displays who paid the most across expenses
 *
 * Features:
 * - Horizontal bar chart sorted by total paid descending
 * - Current user highlighted in iOS blue
 * - Others shown in gray
 * - Tooltip shows expense count and average per expense
 * - Responsive design for mobile
 * - Dark mode support
 */
export function SpendingByPerson({ expenses, userId, currency }: SpendingByPersonProps) {
  const [personData, setPersonData] = useState<PersonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPersonData() {
      setLoading(true);

      // Aggregate by person
      const aggregated = aggregateByPerson(expenses, userId);
      const persons = Object.values(aggregated);

      // Load participant/user names
      const personDataPromises = persons.map(async (person) => {
        let name = 'Unknown';

        // Try to get participant name
        if (person.personId && person.personId !== 'Unknown') {
          try {
            const participant = await getParticipantById(person.personId);
            if (participant?.name) {
              name = participant.name;
            } else {
              // Fallback to shortened ID
              name = `User ${person.personId.slice(0, 8)}`;
            }
          } catch (error) {
            console.error('Failed to load participant:', error);
            name = `User ${person.personId.slice(0, 8)}`;
          }
        }

        // Count how many expenses this person paid for
        const count = expenses.filter(
          (exp) => !exp.is_deleted && exp.paid_by_user_id === person.personId
        ).length;

        return {
          id: person.personId,
          name,
          totalPaid: person.totalPaid,
          count,
          isCurrentUser: person.personId === userId,
        };
      });

      const loaded = await Promise.all(personDataPromises);
      setPersonData(loaded);
      setLoading(false);
    }

    loadPersonData();
  }, [expenses, userId]);

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>Loading...</p>
      </div>
    );
  }

  // No data state
  if (personData.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>No expenses in this date range</p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = personData.map((person) => ({
    name: person.name,
    totalPaid: person.totalPaid,
    count: person.count,
    average: person.count > 0 ? person.totalPaid / person.count : 0,
    color: person.isCurrentUser ? '#007AFF' : '#8E8E93', // iOS blue for current user, gray for others
  }));

  return (
    <div>
      {/* Summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {personData.length} {personData.length === 1 ? 'person' : 'people'} paid for expenses
        </p>
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 50)}>
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
          <Bar dataKey="totalPaid" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-ios-blue" />
          <span className="text-gray-700 dark:text-gray-300">You</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-gray-500" />
          <span className="text-gray-700 dark:text-gray-300">Others</span>
        </div>
      </div>
    </div>
  );
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
        Total paid: {formatCurrency(data.totalPaid, currency)}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {data.count} {data.count === 1 ? 'expense' : 'expenses'}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Avg: {formatCurrency(data.average, currency)}
      </p>
    </div>
  );
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
