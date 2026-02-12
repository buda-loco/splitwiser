/**
 * Search utilities for global expense search functionality
 */

import type { OfflineExpense, ExpenseParticipant } from '@/lib/db/types';
import { getExpenseParticipants, getExpenseTags } from '@/lib/db/stores';

export type SearchFilters = {
  amountRange?: {
    min?: number;
    max?: number;
  };
  dateRange?: {
    start?: string;
    end?: string;
  };
  category?: string;
};

export type SearchResult = {
  expense: OfflineExpense;
  matchedFields: string[];
  highlightText: string;
  relevanceScore: number;
};

/**
 * Search expenses across multiple fields with relevance ranking
 *
 * Search fields:
 * - Description (case-insensitive substring match)
 * - Participant names (lookup via participant store)
 * - Tags (array includes)
 * - Category (exact match)
 * - Amount (if query is number, match ±10%)
 *
 * Relevance ranking:
 * - Exact description match: 100 points
 * - Description contains: 50 points
 * - Tag match: 30 points
 * - Participant match: 20 points
 * - Category match: 10 points
 * - Amount match: 5 points
 *
 * @param query - Search query string
 * @param expenses - Array of expenses to search
 * @param filters - Optional filters for amount range, date range, and category
 * @returns Array of search results sorted by relevance and date
 */
export async function searchExpenses(
  query: string,
  expenses: OfflineExpense[],
  filters?: SearchFilters
): Promise<SearchResult[]> {
  // If no query and no filters, return empty results
  if (!query.trim() && !filters) {
    return [];
  }

  const normalizedQuery = query.trim().toLowerCase();
  const results: SearchResult[] = [];

  // Check if query is a number for amount matching
  const queryAsNumber = parseFloat(normalizedQuery);
  const isNumericQuery = !isNaN(queryAsNumber) && queryAsNumber > 0;

  // Process each expense
  for (const expense of expenses) {
    const matchedFields: string[] = [];
    let relevanceScore = 0;
    let highlightText = '';

    // Skip deleted expenses
    if (expense.is_deleted) {
      continue;
    }

    // Apply filters first (before relevance scoring)
    if (filters) {
      // Amount range filter
      if (filters.amountRange) {
        const { min, max } = filters.amountRange;
        if (min !== undefined && expense.amount < min) continue;
        if (max !== undefined && expense.amount > max) continue;
      }

      // Date range filter
      if (filters.dateRange) {
        const expenseDate = new Date(expense.expense_date);
        if (filters.dateRange.start) {
          const startDate = new Date(filters.dateRange.start);
          if (expenseDate < startDate) continue;
        }
        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end);
          endDate.setHours(23, 59, 59, 999); // Include full end day
          if (expenseDate > endDate) continue;
        }
      }

      // Category filter
      if (filters.category && expense.category !== filters.category) {
        continue;
      }
    }

    // If no query, but passed filters, include all filtered results
    if (!normalizedQuery) {
      results.push({
        expense,
        matchedFields: ['filter'],
        highlightText: expense.description,
        relevanceScore: 1
      });
      continue;
    }

    // 1. Description matching
    const descriptionLower = expense.description.toLowerCase();
    if (descriptionLower === normalizedQuery) {
      matchedFields.push('description');
      relevanceScore += 100;
      highlightText = expense.description;
    } else if (descriptionLower.includes(normalizedQuery)) {
      matchedFields.push('description');
      relevanceScore += 50;
      highlightText = expense.description;
    }

    // 2. Tag matching
    try {
      const tags = await getExpenseTags(expense.id);
      const tagMatch = tags.some(tag => tag.toLowerCase().includes(normalizedQuery));
      if (tagMatch) {
        matchedFields.push('tag');
        relevanceScore += 30;
        const matchedTag = tags.find(tag => tag.toLowerCase().includes(normalizedQuery));
        if (!highlightText && matchedTag) {
          highlightText = matchedTag;
        }
      }
    } catch {
      // Ignore errors loading tags
    }

    // 3. Participant matching
    try {
      const participants = await getExpenseParticipants(expense.id);
      const participantMatch = participants.some(p =>
        p.name && p.name.toLowerCase().includes(normalizedQuery)
      );
      if (participantMatch) {
        matchedFields.push('participant');
        relevanceScore += 20;
        const matchedParticipant = participants.find(p =>
          p.name && p.name.toLowerCase().includes(normalizedQuery)
        );
        if (!highlightText && matchedParticipant?.name) {
          highlightText = matchedParticipant.name;
        }
      }
    } catch {
      // Ignore errors loading participants
    }

    // 4. Category matching
    if (expense.category && expense.category.toLowerCase().includes(normalizedQuery)) {
      matchedFields.push('category');
      relevanceScore += 10;
      if (!highlightText) {
        highlightText = expense.category;
      }
    }

    // 5. Amount matching (±10% if query is numeric)
    if (isNumericQuery) {
      const lowerBound = queryAsNumber * 0.9;
      const upperBound = queryAsNumber * 1.1;
      if (expense.amount >= lowerBound && expense.amount <= upperBound) {
        matchedFields.push('amount');
        relevanceScore += 5;
        if (!highlightText) {
          highlightText = `${expense.currency} ${expense.amount.toFixed(2)}`;
        }
      }
    }

    // Only include if at least one field matched
    if (matchedFields.length > 0) {
      results.push({
        expense,
        matchedFields,
        highlightText: highlightText || expense.description,
        relevanceScore
      });
    }
  }

  // Sort by relevance score descending, then by date descending
  results.sort((a, b) => {
    if (a.relevanceScore !== b.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    return new Date(b.expense.expense_date).getTime() - new Date(a.expense.expense_date).getTime();
  });

  return results;
}

/**
 * Get unique categories from expenses for filter dropdown
 */
export function getUniqueCategories(expenses: OfflineExpense[]): string[] {
  const categories = new Set<string>();

  expenses.forEach(expense => {
    if (expense.category && !expense.is_deleted) {
      categories.add(expense.category);
    }
  });

  return Array.from(categories).sort();
}
