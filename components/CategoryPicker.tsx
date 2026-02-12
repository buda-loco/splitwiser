'use client';

import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { PREDEFINED_CATEGORIES, CategoryType } from '@/lib/types/category';

/**
 * Dynamic icon component that renders Lucide icons by name
 */
function CategoryIcon({ iconName, className }: { iconName: string; className?: string }) {
  const Icon = (LucideIcons as any)[iconName];

  if (!Icon) {
    // Fallback to HelpCircle if icon not found
    return <LucideIcons.HelpCircle className={className} />;
  }

  return <Icon className={className} />;
}

/**
 * CategoryPicker component for expense categorization
 *
 * Features:
 * - Grid layout (2 columns on mobile, 3-4 on larger screens)
 * - Lucide icon display for each category
 * - Selected state with ios-blue border
 * - Tap scale animation for interaction feedback
 * - Dark mode support with semantic tokens
 * - iOS-native card styling
 */
export function CategoryPicker({
  value,
  onChange,
}: {
  value: CategoryType | string | null;
  onChange: (categoryId: CategoryType) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {PREDEFINED_CATEGORIES.map((category) => {
        const isSelected = value === category.id;

        return (
          <motion.button
            key={category.id}
            type="button"
            onClick={() => onChange(category.id)}
            whileTap={{ scale: 0.95 }}
            className={`
              relative flex flex-col items-center justify-center
              p-4 rounded-xl
              bg-white dark:bg-gray-800
              border-2 transition-colors
              ${
                isSelected
                  ? 'border-ios-blue dark:border-ios-blue'
                  : 'border-gray-200 dark:border-gray-700'
              }
              shadow-sm hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-ios-blue focus:ring-offset-2
              dark:focus:ring-offset-gray-900
            `}
          >
            {/* Icon with category color background */}
            <div
              className={`
                w-12 h-12 rounded-full
                flex items-center justify-center
                mb-2
                ${category.color}
              `}
            >
              <CategoryIcon
                iconName={category.icon}
                className="w-6 h-6 text-white"
              />
            </div>

            {/* Category label */}
            <span className="text-xs font-medium text-center text-gray-900 dark:text-white leading-tight">
              {category.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
