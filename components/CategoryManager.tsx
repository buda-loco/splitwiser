'use client';

import { useEffect, useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { PREDEFINED_CATEGORIES } from '@/lib/types/category';
import {
  getCustomCategories,
  createCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
} from '@/lib/db/stores';
import { ListRow } from './ListRow';

/**
 * Dynamic icon component that renders Lucide icons by name
 */
function CategoryIcon({ iconName, className }: { iconName: string; className?: string }) {
  const Icon = (LucideIcons as any)[iconName];

  if (!Icon) {
    return <LucideIcons.HelpCircle className={className} />;
  }

  return <Icon className={className} />;
}

interface CustomCategory {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
  is_deleted: boolean;
}

interface EditingCategory {
  id: string | null;
  name: string;
  icon: string;
  color: string;
}

/**
 * CategoryManager component for managing custom expense categories
 *
 * Features:
 * - Display predefined categories (read-only)
 * - Create, edit, delete custom categories
 * - Drag-to-reorder custom categories
 * - Icon and color picker for custom categories
 * - iOS-native list styling with ListRow components
 */
export function CategoryManager({ userId }: { userId: string }) {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Available Lucide icons for selection
  const availableIcons = [
    'UtensilsCrossed', 'Car', 'Film', 'ShoppingBag', 'FileText',
    'Plane', 'Heart', 'ShoppingCart', 'Home', 'Coffee', 'Briefcase',
    'Gift', 'Music', 'Book', 'Palette', 'Gamepad2', 'Dumbbell',
    'Laptop', 'Smartphone', 'Camera', 'Sparkles', 'Rocket',
  ];

  // Available Tailwind color classes
  const availableColors = [
    'bg-orange-500 dark:bg-orange-600',
    'bg-blue-500 dark:bg-blue-600',
    'bg-purple-500 dark:bg-purple-600',
    'bg-pink-500 dark:bg-pink-600',
    'bg-yellow-500 dark:bg-yellow-600',
    'bg-teal-500 dark:bg-teal-600',
    'bg-red-500 dark:bg-red-600',
    'bg-green-500 dark:bg-green-600',
    'bg-indigo-500 dark:bg-indigo-600',
    'bg-cyan-500 dark:bg-cyan-600',
    'bg-rose-500 dark:bg-rose-600',
    'bg-lime-500 dark:bg-lime-600',
  ];

  // Load custom categories on mount
  useEffect(() => {
    loadCustomCategories();
  }, [userId]);

  async function loadCustomCategories() {
    setLoading(true);
    try {
      const categories = await getCustomCategories(userId);
      setCustomCategories(categories);
    } catch (err) {
      console.error('Failed to load custom categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  // Handle add new category
  async function handleAdd() {
    if (!editingCategory || !editingCategory.name.trim()) return;

    try {
      setError(null);
      await createCustomCategory(userId, {
        name: editingCategory.name.trim(),
        icon: editingCategory.icon,
        color: editingCategory.color,
      });
      setShowAddForm(false);
      setEditingCategory(null);
      await loadCustomCategories();
    } catch (err) {
      console.error('Failed to create category:', err);
      setError('Failed to create category');
    }
  }

  // Handle update category
  async function handleUpdate() {
    if (!editingCategory || !editingCategory.id || !editingCategory.name.trim()) return;

    try {
      setError(null);
      await updateCustomCategory(editingCategory.id, {
        name: editingCategory.name.trim(),
        icon: editingCategory.icon,
        color: editingCategory.color,
      });
      setEditingCategory(null);
      await loadCustomCategories();
    } catch (err) {
      console.error('Failed to update category:', err);
      setError('Failed to update category');
    }
  }

  // Handle delete category
  async function handleDelete(categoryId: string, categoryName: string) {
    if (!confirm(`Delete custom category "${categoryName}"? This cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      await deleteCustomCategory(categoryId);
      await loadCustomCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
      setError('Failed to delete category');
    }
  }

  // Handle reorder
  async function handleReorder(newOrder: CustomCategory[]) {
    setCustomCategories(newOrder);

    // Update sort_order for all categories
    try {
      for (let i = 0; i < newOrder.length; i++) {
        await updateCustomCategory(newOrder[i].id, {
          sort_order: i + 1,
        });
      }
    } catch (err) {
      console.error('Failed to reorder categories:', err);
      setError('Failed to reorder categories');
      await loadCustomCategories(); // Reload on error
    }
  }

  // Start editing a category
  function startEdit(category: CustomCategory) {
    setEditingCategory({
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
    });
  }

  // Start adding a new category
  function startAdd() {
    setEditingCategory({
      id: null,
      name: '',
      icon: availableIcons[0],
      color: availableColors[0],
    });
    setShowAddForm(true);
  }

  // Cancel editing
  function cancelEdit() {
    setEditingCategory(null);
    setShowAddForm(false);
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-ios-gray dark:text-gray-400">
        Loading categories...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Helper text */}
      <div className="px-4 py-3 bg-ios-blue-light dark:bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Categories help organize your expenses and power analytics
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Predefined Categories Section */}
      <div className="space-y-2">
        <div className="px-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ios-gray dark:text-gray-400 uppercase tracking-wide">
            Predefined Categories
          </h3>
          <span className="text-xs text-ios-gray dark:text-gray-500">
            {PREDEFINED_CATEGORIES.length} default
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {PREDEFINED_CATEGORIES.map((category, index) => (
            <div key={category.id}>
              <ListRow
                title={category.label}
                subtitle="Default"
                leftIcon={
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${category.color}`}>
                    <CategoryIcon iconName={category.icon} className="w-4 h-4 text-white" />
                  </div>
                }
              />
              {index < PREDEFINED_CATEGORIES.length - 1 && (
                <div className="border-b border-gray-200 dark:border-gray-700" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Categories Section */}
      <div className="space-y-2">
        <div className="px-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ios-gray dark:text-gray-400 uppercase tracking-wide">
            Custom Categories
          </h3>
          <span className="text-xs text-ios-gray dark:text-gray-500">
            {customCategories.length} custom
          </span>
        </div>

        {customCategories.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <Reorder.Group
              axis="y"
              values={customCategories}
              onReorder={handleReorder}
              className="divide-y divide-gray-200 dark:divide-gray-700"
            >
              {customCategories.map((category) => (
                <Reorder.Item
                  key={category.id}
                  value={category}
                  className="bg-white dark:bg-gray-800"
                >
                  {editingCategory?.id === category.id ? (
                    // Edit form
                    <div className="p-4 space-y-3">
                      <input
                        type="text"
                        value={editingCategory.name}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, name: e.target.value })
                        }
                        placeholder="Category name"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />

                      {/* Icon picker */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Icon
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                          {availableIcons.map((iconName) => (
                            <button
                              key={iconName}
                              type="button"
                              onClick={() =>
                                setEditingCategory({ ...editingCategory, icon: iconName })
                              }
                              className={`
                                p-2 rounded-lg border-2 transition-colors
                                ${
                                  editingCategory.icon === iconName
                                    ? 'border-ios-blue bg-ios-blue-light dark:bg-ios-blue/20'
                                    : 'border-gray-200 dark:border-gray-700'
                                }
                              `}
                            >
                              <CategoryIcon iconName={iconName} className="w-5 h-5" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color picker */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Color
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                          {availableColors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() =>
                                setEditingCategory({ ...editingCategory, color })
                              }
                              className={`
                                w-8 h-8 rounded-full border-2 transition-all
                                ${color}
                                ${
                                  editingCategory.color === color
                                    ? 'border-ios-blue scale-110'
                                    : 'border-transparent'
                                }
                              `}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleUpdate}
                          className="flex-1 px-4 py-2 bg-ios-blue text-white rounded-lg font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display row
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 flex-1">
                        <LucideIcons.GripVertical className="w-5 h-5 text-ios-gray dark:text-gray-500" />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${category.color}`}>
                          <CategoryIcon iconName={category.icon} className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => startEdit(category)}
                          className="p-2 text-ios-blue hover:bg-ios-blue-light dark:hover:bg-ios-blue/20 rounded-lg"
                        >
                          <LucideIcons.Pencil className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(category.id, category.name)}
                          className="p-2 text-ios-red hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <LucideIcons.Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  )}
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}
      </div>

      {/* Add New Category Section */}
      {showAddForm ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white">Add Custom Category</h4>

          <input
            type="text"
            value={editingCategory?.name || ''}
            onChange={(e) =>
              setEditingCategory({ ...editingCategory!, name: e.target.value })
            }
            placeholder="Category name"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />

          {/* Icon picker */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {availableIcons.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() =>
                    setEditingCategory({ ...editingCategory!, icon: iconName })
                  }
                  className={`
                    p-2 rounded-lg border-2 transition-colors
                    ${
                      editingCategory?.icon === iconName
                        ? 'border-ios-blue bg-ios-blue-light dark:bg-ios-blue/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }
                  `}
                >
                  <CategoryIcon iconName={iconName} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {availableColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    setEditingCategory({ ...editingCategory!, color })
                  }
                  className={`
                    w-8 h-8 rounded-full border-2 transition-all
                    ${color}
                    ${
                      editingCategory?.color === color
                        ? 'border-ios-blue scale-110'
                        : 'border-transparent'
                    }
                  `}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleAdd}
              className="flex-1 px-4 py-2 bg-ios-blue text-white rounded-lg font-medium"
            >
              Add Category
            </button>
            <button
              onClick={cancelEdit}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={startAdd}
          className="w-full px-4 py-3 bg-ios-blue text-white rounded-lg font-medium flex items-center justify-center gap-2"
        >
          <LucideIcons.Plus className="w-5 h-5" />
          Add Custom Category
        </motion.button>
      )}
    </div>
  );
}
