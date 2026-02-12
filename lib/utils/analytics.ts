/**
 * Analytics utility functions for data aggregation and filtering
 *
 * This module provides functions to process expense data for analytics views,
 * including date range filtering, category aggregation, and multi-currency conversion.
 */

import type { OfflineExpense } from '@/lib/db/types';
import { convertAmount } from '@/lib/currency/exchangeRates';
import type { CurrencyCode } from '@/lib/currency/types';

export type DateRange = {
  start: Date;
  end: Date;
  preset: string;
};

export type CategoryAggregate = {
  categoryId: string;
  total: number;
  count: number;
  expenses: OfflineExpense[];
};

export type PersonAggregate = {
  personId: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
};

/**
 * Filter expenses by date range
 *
 * @param expenses - Array of expenses to filter
 * @param dateRange - Date range object with start and end dates
 * @returns Filtered array of expenses within the date range
 */
export function filterExpensesByDateRange(
  expenses: OfflineExpense[],
  dateRange: DateRange
): OfflineExpense[] {
  const startTime = dateRange.start.getTime();
  const endTime = dateRange.end.getTime();

  return expenses.filter((expense) => {
    if (expense.is_deleted) return false;
    const expenseTime = new Date(expense.expense_date).getTime();
    return expenseTime >= startTime && expenseTime <= endTime;
  });
}

/**
 * Aggregate expenses by category
 *
 * @param expenses - Array of expenses to aggregate
 * @returns Object mapping category IDs to aggregated data (total, count, expenses)
 */
export function aggregateByCategory(
  expenses: OfflineExpense[]
): Record<string, CategoryAggregate> {
  const aggregates: Record<string, CategoryAggregate> = {};

  for (const expense of expenses) {
    if (expense.is_deleted) continue;

    const categoryId = expense.category || 'Uncategorized';

    if (!aggregates[categoryId]) {
      aggregates[categoryId] = {
        categoryId,
        total: 0,
        count: 0,
        expenses: [],
      };
    }

    aggregates[categoryId].total += expense.amount;
    aggregates[categoryId].count += 1;
    aggregates[categoryId].expenses.push(expense);
  }

  // Sort by total descending
  return Object.fromEntries(
    Object.entries(aggregates).sort(([, a], [, b]) => b.total - a.total)
  );
}

/**
 * Aggregate expenses by person (paid vs owed)
 *
 * Note: This is a simplified version that only tracks who paid.
 * Full implementation would require split data to calculate who owes what.
 *
 * @param expenses - Array of expenses to aggregate
 * @param userId - Current user's ID to calculate net balance
 * @returns Object mapping person IDs to aggregated payment data
 */
export function aggregateByPerson(
  expenses: OfflineExpense[],
  userId: string
): Record<string, PersonAggregate> {
  const aggregates: Record<string, PersonAggregate> = {};

  for (const expense of expenses) {
    if (expense.is_deleted) continue;

    const personId = expense.paid_by_user_id || 'Unknown';

    if (!aggregates[personId]) {
      aggregates[personId] = {
        personId,
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0,
      };
    }

    aggregates[personId].totalPaid += expense.amount;

    // Note: This is simplified. Full implementation would:
    // 1. Load expense splits for each expense
    // 2. Calculate how much each person owes
    // 3. Compute net balance (totalPaid - totalOwed)
  }

  // Sort by total paid descending
  return Object.fromEntries(
    Object.entries(aggregates).sort(([, a], [, b]) => b.totalPaid - a.totalPaid)
  );
}

/**
 * Calculate total spent across all expenses
 *
 * Handles multi-currency conversion to user's preferred currency.
 *
 * @param expenses - Array of expenses to sum
 * @param targetCurrency - Currency to convert all amounts to
 * @returns Total spent in target currency, rounded to 2 decimal places
 */
export async function calculateTotalSpent(
  expenses: OfflineExpense[],
  targetCurrency: CurrencyCode
): Promise<number> {
  let total = 0;

  for (const expense of expenses) {
    if (expense.is_deleted) continue;

    const convertedAmount = await convertAmount(
      expense.amount,
      expense.currency as CurrencyCode,
      targetCurrency,
      expense.manual_exchange_rate
    );

    total += convertedAmount;
  }

  return parseFloat(total.toFixed(2));
}

/**
 * Get the category with the highest total spending
 *
 * @param aggregated - Object of category aggregates
 * @returns The category with the highest total, or null if no categories
 */
export function getMostExpensiveCategory(
  aggregated: Record<string, CategoryAggregate>
): CategoryAggregate | null {
  const categories = Object.values(aggregated);

  if (categories.length === 0) {
    return null;
  }

  // Already sorted by total descending from aggregateByCategory
  return categories[0];
}
