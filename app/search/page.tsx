'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalSearch, type SearchFilters } from '@/components/GlobalSearch';
import { searchExpenses, getUniqueCategories, type SearchResult } from '@/lib/utils/search';
import { getExpenses } from '@/lib/db/stores';
import type { OfflineExpense } from '@/lib/db/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Receipt, ChevronRight } from 'lucide-react';

/**
 * Global search page for finding expenses
 *
 * Features:
 * - GlobalSearch component with debounced input and filters
 * - Real-time search results with relevance ranking
 * - Matched field badges showing where the match was found
 * - Text highlighting in descriptions
 * - iOS-native design with proper safe areas
 * - Dark mode support
 */
export default function SearchPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<OfflineExpense[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');

  // Load all expenses on mount
  useEffect(() => {
    async function loadExpenses() {
      try {
        const allExpenses = await getExpenses();
        setExpenses(allExpenses);
        setCategories(getUniqueCategories(allExpenses));
      } catch (err) {
        console.error('Failed to load expenses:', err);
      } finally {
        setLoading(false);
      }
    }

    loadExpenses();
  }, []);

  // Handle search
  const handleSearch = async (query: string, filters?: SearchFilters) => {
    setCurrentQuery(query);
    setSearching(true);

    try {
      const searchResults = await searchExpenses(query, expenses, filters);
      setResults(searchResults);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Navigate to expense detail
  const handleExpenseClick = (expenseId: string) => {
    router.push(`/expenses/${expenseId}`);
  };

  // Get matched field label for display
  const getMatchedFieldLabel = (fields: string[]): string => {
    if (fields.includes('description')) return 'Description';
    if (fields.includes('tag')) return 'Tag';
    if (fields.includes('participant')) return 'Participant';
    if (fields.includes('category')) return 'Category';
    if (fields.includes('amount')) return 'Amount';
    if (fields.includes('filter')) return 'Filtered';
    return 'Match';
  };

  // Highlight matched text in description
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;

    const normalizedQuery = query.trim().toLowerCase();
    const lowerText = text.toLowerCase();
    const index = lowerText.indexOf(normalizedQuery);

    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <mark className="bg-ios-blue/20 dark:bg-ios-blue/30 text-gray-900 dark:text-white px-0.5 rounded">
          {text.substring(index, index + normalizedQuery.length)}
        </mark>
        {text.substring(index + normalizedQuery.length)}
      </>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-safe-top pb-safe">
        <div className="max-w-2xl mx-auto p-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Search Expenses
            </h1>
            <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-safe-top pb-safe">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Search Expenses
          </h1>

          {/* Global Search Component */}
          <GlobalSearch
            onSearch={handleSearch}
            placeholder="Search by description, amount, tag, or participant..."
            categories={categories}
          />
        </div>

        {/* Search Results */}
        <div className="space-y-4">
          {/* Searching indicator */}
          {searching && (
            <div className="text-center py-8">
              <div className="inline-block w-6 h-6 border-2 border-ios-blue border-t-transparent rounded-full animate-spin" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Searching...</p>
            </div>
          )}

          {/* Results */}
          {!searching && currentQuery && results.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Found {results.length} {results.length === 1 ? 'result' : 'results'}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                <AnimatePresence mode="popLayout">
                  {results.map((result, index) => (
                    <motion.div
                      key={result.expense.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: Math.min(index * 0.05, 0.25) }}
                    >
                      <ListRow
                        onClick={() => handleExpenseClick(result.expense.id)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 w-full">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Receipt className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                              <p className="text-base font-medium text-gray-900 dark:text-white truncate">
                                {result.matchedFields.includes('description')
                                  ? highlightText(result.expense.description, currentQuery)
                                  : result.expense.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(result.expense.expense_date).toLocaleDateString()}
                              </span>

                              {result.expense.category && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                  {result.expense.category}
                                </span>
                              )}

                              {/* Matched field badge */}
                              <span className="text-xs px-2 py-0.5 bg-ios-blue/10 dark:bg-ios-blue/20 text-ios-blue dark:text-ios-blue-light rounded">
                                Found in: {getMatchedFieldLabel(result.matchedFields)}
                              </span>
                            </div>

                            {/* Show highlight text if different from description */}
                            {result.highlightText !== result.expense.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                                {result.matchedFields.includes('description')
                                  ? result.highlightText
                                  : highlightText(result.highlightText, currentQuery)}
                              </p>
                            )}
                          </div>

                          <div className="flex-shrink-0 text-right">
                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                              {result.expense.currency} {result.expense.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </ListRow>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* No results state */}
          {!searching && currentQuery && results.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No results found
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>Try searching for:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Expense description (e.g., &ldquo;lunch&rdquo;, &ldquo;groceries&rdquo;)</li>
                  <li>Amount (e.g., &ldquo;50&rdquo;, &ldquo;100&rdquo;)</li>
                  <li>Tag (e.g., &ldquo;#bali-trip&rdquo;)</li>
                  <li>Participant name</li>
                  <li>Category name</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* Initial state (no search yet) */}
          {!searching && !currentQuery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Start searching
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter a search term above to find expenses
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
