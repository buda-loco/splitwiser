/**
 * Predefined category system for expense organization
 *
 * Provides structured categorization for analytics and filtering.
 * Each category has an associated Lucide icon and color for visual distinction.
 */

/**
 * Category type enum for type safety
 */
export enum CategoryType {
  FOOD_DINING = 'food_dining',
  TRANSPORTATION = 'transportation',
  ENTERTAINMENT = 'entertainment',
  SHOPPING = 'shopping',
  BILLS_UTILITIES = 'bills_utilities',
  TRAVEL = 'travel',
  HEALTH_MEDICAL = 'health_medical',
  GROCERIES = 'groceries',
  HOME_RENT = 'home_rent',
  OTHER = 'other',
}

/**
 * Category definition with display properties
 */
export interface Category {
  id: CategoryType;
  label: string;
  icon: string; // Lucide icon name (e.g., "UtensilsCrossed")
  color: string; // Tailwind color class for badge
}

/**
 * Predefined categories available for expense classification
 */
export const PREDEFINED_CATEGORIES: Category[] = [
  {
    id: CategoryType.FOOD_DINING,
    label: 'Food & Dining',
    icon: 'UtensilsCrossed',
    color: 'bg-orange-500 dark:bg-orange-600',
  },
  {
    id: CategoryType.TRANSPORTATION,
    label: 'Transportation',
    icon: 'Car',
    color: 'bg-blue-500 dark:bg-blue-600',
  },
  {
    id: CategoryType.ENTERTAINMENT,
    label: 'Entertainment',
    icon: 'Film',
    color: 'bg-purple-500 dark:bg-purple-600',
  },
  {
    id: CategoryType.SHOPPING,
    label: 'Shopping',
    icon: 'ShoppingBag',
    color: 'bg-pink-500 dark:bg-pink-600',
  },
  {
    id: CategoryType.BILLS_UTILITIES,
    label: 'Bills & Utilities',
    icon: 'FileText',
    color: 'bg-yellow-500 dark:bg-yellow-600',
  },
  {
    id: CategoryType.TRAVEL,
    label: 'Travel',
    icon: 'Plane',
    color: 'bg-teal-500 dark:bg-teal-600',
  },
  {
    id: CategoryType.HEALTH_MEDICAL,
    label: 'Health & Medical',
    icon: 'Heart',
    color: 'bg-red-500 dark:bg-red-600',
  },
  {
    id: CategoryType.GROCERIES,
    label: 'Groceries',
    icon: 'ShoppingCart',
    color: 'bg-green-500 dark:bg-green-600',
  },
  {
    id: CategoryType.HOME_RENT,
    label: 'Home & Rent',
    icon: 'Home',
    color: 'bg-indigo-500 dark:bg-indigo-600',
  },
  {
    id: CategoryType.OTHER,
    label: 'Other',
    icon: 'MoreHorizontal',
    color: 'bg-gray-500 dark:bg-gray-600',
  },
];

/**
 * Get category by ID
 */
export function getCategoryById(id: CategoryType | string | null): Category | undefined {
  if (!id) return undefined;
  return PREDEFINED_CATEGORIES.find(cat => cat.id === id);
}
