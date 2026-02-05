'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Form data type for expense creation
 */
export type ExpenseFormData = {
  amount: number;
  currency: string;
  description: string;
  category: string;
  expense_date: string;
};

/**
 * ExpenseForm component with iOS-native styling and validation
 *
 * Features:
 * - Amount input with currency selector
 * - Description, category, and date fields
 * - Inline validation with error messages
 * - iOS-native design (San Francisco font, native controls)
 * - Disabled submit when form is invalid
 */
export function ExpenseForm({
  onSubmit,
  onCancel
}: {
  onSubmit: (expense: ExpenseFormData) => void;
  onCancel?: () => void;
}) {
  // Form state
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('AUD');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Track which fields have been touched for validation display
  const [touched, setTouched] = useState({
    amount: false,
    description: false,
    category: false,
    expense_date: false
  });

  // Validation errors
  const errors = {
    amount: (() => {
      if (!amount) return 'Amount is required';
      const num = parseFloat(amount);
      if (isNaN(num) || num <= 0) return 'Amount must be greater than 0';
      if (!/^\d+(\.\d{1,2})?$/.test(amount)) return 'Amount must have at most 2 decimal places';
      return null;
    })(),
    description: (() => {
      if (!description) return 'Description is required';
      if (description.length > 255) return 'Description must be less than 255 characters';
      return null;
    })(),
    category: !category ? 'Category is required' : null,
    expense_date: (() => {
      if (!expenseDate) return 'Date is required';
      const selectedDate = new Date(expenseDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) return 'Date cannot be in the future';
      return null;
    })()
  };

  // Form is valid when all fields have no errors
  const isValid = Object.values(errors).every(error => error === null);

  // Handle field blur to mark as touched
  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched to show validation errors
    setTouched({
      amount: true,
      description: true,
      category: true,
      expense_date: true
    });

    // Only submit if valid
    if (isValid) {
      onSubmit({
        amount: parseFloat(amount),
        currency,
        description,
        category,
        expense_date: expenseDate
      });

      // Clear form after successful submission
      setAmount('');
      setDescription('');
      setCategory('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setTouched({
        amount: false,
        description: false,
        category: false,
        expense_date: false
      });
    }
  };

  // Currency symbols
  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'AUD': return 'A$';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return curr;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Amount and Currency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Amount
        </label>
        <div className="flex gap-2">
          {/* Amount input */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ios-gray">
                {getCurrencySymbol(currency)}
              </div>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={() => handleBlur('amount')}
                placeholder="0.00"
                className={`w-full pl-10 pr-4 py-3 bg-ios-gray6 dark:bg-gray-800 rounded-xl border ${
                  touched.amount && errors.amount
                    ? 'border-ios-red'
                    : 'border-transparent'
                } focus:outline-none focus:ring-2 focus:ring-ios-blue focus:border-transparent text-base`}
              />
            </div>
            {touched.amount && errors.amount && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 text-xs text-ios-red"
              >
                {errors.amount}
              </motion.p>
            )}
          </div>

          {/* Currency selector */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="px-4 py-3 bg-ios-gray6 dark:bg-gray-800 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-ios-blue focus:border-transparent text-base font-medium"
          >
            <option value="AUD">AUD</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => handleBlur('description')}
          placeholder="What was this expense for?"
          maxLength={255}
          className={`w-full px-4 py-3 bg-ios-gray6 dark:bg-gray-800 rounded-xl border ${
            touched.description && errors.description
              ? 'border-ios-red'
              : 'border-transparent'
          } focus:outline-none focus:ring-2 focus:ring-ios-blue focus:border-transparent text-base`}
        />
        {touched.description && errors.description && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs text-ios-red"
          >
            {errors.description}
          </motion.p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          onBlur={() => handleBlur('category')}
          className={`w-full px-4 py-3 bg-ios-gray6 dark:bg-gray-800 rounded-xl border ${
            touched.category && errors.category
              ? 'border-ios-red'
              : 'border-transparent'
          } focus:outline-none focus:ring-2 focus:ring-ios-blue focus:border-transparent text-base appearance-none ${
            !category ? 'text-ios-gray' : ''
          }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%238E8E93' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center'
          }}
        >
          <option value="" disabled>Select a category</option>
          <option value="Food">Food</option>
          <option value="Transport">Transport</option>
          <option value="Accommodation">Accommodation</option>
          <option value="Activities">Activities</option>
          <option value="Other">Other</option>
        </select>
        {touched.category && errors.category && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs text-ios-red"
          >
            {errors.category}
          </motion.p>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Date
        </label>
        <input
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
          onBlur={() => handleBlur('expense_date')}
          max={new Date().toISOString().split('T')[0]}
          className={`w-full px-4 py-3 bg-ios-gray6 dark:bg-gray-800 rounded-xl border ${
            touched.expense_date && errors.expense_date
              ? 'border-ios-red'
              : 'border-transparent'
          } focus:outline-none focus:ring-2 focus:ring-ios-blue focus:border-transparent text-base`}
        />
        {touched.expense_date && errors.expense_date && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs text-ios-red"
          >
            {errors.expense_date}
          </motion.p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <motion.button
            type="button"
            onClick={onCancel}
            whileTap={{ scale: 0.97 }}
            className="flex-1 px-6 py-3.5 bg-ios-gray6 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-base"
          >
            Cancel
          </motion.button>
        )}
        <motion.button
          type="submit"
          disabled={!isValid}
          whileTap={{ scale: isValid ? 0.97 : 1 }}
          className={`flex-1 px-6 py-3.5 rounded-xl font-semibold text-base ${
            isValid
              ? 'bg-ios-blue text-white'
              : 'bg-ios-gray5 dark:bg-gray-700 text-ios-gray2 cursor-not-allowed'
          }`}
        >
          Add Expense
        </motion.button>
      </div>
    </form>
  );
}
