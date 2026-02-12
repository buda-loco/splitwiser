'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, SlidersHorizontal } from 'lucide-react';

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

type GlobalSearchProps = {
  onSearch: (query: string, filters?: SearchFilters) => void;
  placeholder?: string;
  categories?: string[];
};

/**
 * GlobalSearch component with debounced input and filter panel
 *
 * Features:
 * - Debounced search input (500ms delay)
 * - iOS-native search bar styling
 * - Clear button when input has value
 * - Expandable filter panel for amount range, date range, and category
 * - Framer Motion animations for smooth UX
 * - Full dark mode support
 */
export function GlobalSearch({
  onSearch,
  placeholder = 'Search expenses...',
  categories = []
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 500);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<SearchFilters>({});
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Trigger search when debounced query changes
  useEffect(() => {
    const currentFilters: SearchFilters = {};

    // Only add filters if they have values
    if (minAmount || maxAmount) {
      currentFilters.amountRange = {
        ...(minAmount && { min: parseFloat(minAmount) }),
        ...(maxAmount && { max: parseFloat(maxAmount) })
      };
    }

    if (startDate || endDate) {
      currentFilters.dateRange = {
        ...(startDate && { start: startDate }),
        ...(endDate && { end: endDate })
      };
    }

    if (selectedCategory) {
      currentFilters.category = selectedCategory;
    }

    setFilters(currentFilters);
    onSearch(debouncedQuery, Object.keys(currentFilters).length > 0 ? currentFilters : undefined);
  }, [debouncedQuery, minAmount, maxAmount, startDate, endDate, selectedCategory, onSearch]);

  // Clear all filters
  const clearFilters = () => {
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
    setSelectedCategory('');
  };

  // Clear search input
  const clearSearch = () => {
    setQuery('');
    clearFilters();
  };

  const hasActiveFilters = minAmount || maxAmount || startDate || endDate || selectedCategory;

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />

          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={clearSearch}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </motion.button>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 rounded-full transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-ios-blue text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="pt-4 pb-2 space-y-4">
              {/* Amount Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder="Min"
                    step="0.01"
                    min="0"
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ios-blue"
                  />
                  <span className="text-gray-500 dark:text-gray-400">-</span>
                  <input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder="Max"
                    step="0.01"
                    min="0"
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ios-blue"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ios-blue"
                  />
                  <span className="text-gray-500 dark:text-gray-400">-</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ios-blue"
                  />
                </div>
              </div>

              {/* Category Filter */}
              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ios-blue"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-sm font-medium text-ios-blue hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
