'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ParticipantPicker } from './ParticipantPicker';
import { SplitEqual } from './SplitEqual';
import { SplitByPercentage } from './SplitByPercentage';
import { SplitByShares } from './SplitByShares';
import type { ExpenseSplit } from '@/lib/db/types';
import type { ParticipantWithDetails } from '@/hooks/useParticipants';

type SplitMethod = 'equal' | 'percentage' | 'shares' | 'exact';

/**
 * Form data type for expense creation
 */
export type ExpenseFormData = {
  amount: number;
  currency: string;
  description: string;
  category: string;
  expense_date: string;
  participants: ParticipantWithDetails[];
  splits: ExpenseSplit[];
};

/**
 * ExpenseForm component with iOS-native styling and validation
 *
 * Features:
 * - 3-step flow: Basic info → Participants → Split method
 * - Amount input with currency selector
 * - Description, category, and date fields
 * - Participant picker with smart suggestions
 * - Multiple split methods (equal/percentage/shares)
 * - Inline validation with error messages
 * - iOS-native design (San Francisco font, native controls)
 * - Disabled submit when form is invalid
 */
export function ExpenseForm({
  initialData,
  onSubmit,
  onCancel
}: {
  initialData?: Partial<ExpenseFormData>;
  onSubmit: (expense: ExpenseFormData) => void;
  onCancel?: () => void;
}) {
  // Form state
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [currency, setCurrency] = useState(initialData?.currency || 'AUD');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [expenseDate, setExpenseDate] = useState(
    initialData?.expense_date || new Date().toISOString().split('T')[0]
  );

  // Participant and split state
  const [participants, setParticipants] = useState<ParticipantWithDetails[]>(initialData?.participants || []);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [splits, setSplits] = useState<ExpenseSplit[]>(initialData?.splits || []);

  // Multi-step navigation
  const [step, setStep] = useState<'basic' | 'participants' | 'splits'>('basic');

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

  // Step validation
  const basicValid = Object.values(errors).every(error => error === null);
  const participantsValid = participants.length > 0;
  const splitsValid = splits.length > 0 &&
    Math.abs(splits.reduce((sum, s) => sum + s.amount, 0) - parseFloat(amount || '0')) < 0.01;

  // Handle field blur to mark as touched
  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'basic') {
      // Mark all fields as touched to show validation errors
      setTouched({
        amount: true,
        description: true,
        category: true,
        expense_date: true
      });

      // Only advance if basic form is valid
      if (basicValid) {
        setStep('participants');
      }
    } else if (step === 'participants') {
      // Advance to split method selection if participants selected
      if (participantsValid) {
        setStep('splits');
      }
    } else if (step === 'splits') {
      // Final submission
      if (splitsValid) {
        onSubmit({
          amount: parseFloat(amount),
          currency,
          description,
          category,
          expense_date: expenseDate,
          participants,
          splits
        });

        // Clear form after successful submission
        setAmount('');
        setDescription('');
        setCategory('');
        setExpenseDate(new Date().toISOString().split('T')[0]);
        setParticipants([]);
        setSplits([]);
        setStep('basic');
        setTouched({
          amount: false,
          description: false,
          category: false,
          expense_date: false
        });
      }
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
      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        <div className={`flex-1 h-1 rounded transition-colors ${step === 'basic' ? 'bg-ios-blue' : 'bg-ios-gray5 dark:bg-gray-700'}`} />
        <div className={`flex-1 h-1 rounded transition-colors ${step === 'participants' ? 'bg-ios-blue' : 'bg-ios-gray5 dark:bg-gray-700'}`} />
        <div className={`flex-1 h-1 rounded transition-colors ${step === 'splits' ? 'bg-ios-blue' : 'bg-ios-gray5 dark:bg-gray-700'}`} />
      </div>

      {/* Step 1: Basic info */}
      {step === 'basic' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-5"
        >
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
        </motion.div>
      )}

      {/* Step 2: Participants */}
      {step === 'participants' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <button
            type="button"
            onClick={() => setStep('basic')}
            className="flex items-center gap-2 text-ios-blue dark:text-blue-400 font-medium active:opacity-70 transition-opacity"
          >
            <span>←</span>
            <span>Back</span>
          </button>

          <ParticipantPicker
            selected={participants}
            onChange={setParticipants}
          />

          {!participantsValid && (
            <p className="text-sm text-ios-red mt-2">
              Please select at least one participant
            </p>
          )}
        </motion.div>
      )}

      {/* Step 3: Split method */}
      {step === 'splits' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <button
            type="button"
            onClick={() => setStep('participants')}
            className="flex items-center gap-2 text-ios-blue dark:text-blue-400 font-medium active:opacity-70 transition-opacity"
          >
            <span>←</span>
            <span>Back</span>
          </button>

          {/* Split method selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How to split?
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSplitMethod('equal')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  splitMethod === 'equal'
                    ? 'bg-ios-blue text-white'
                    : 'bg-ios-gray6 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                Equally
              </button>
              <button
                type="button"
                onClick={() => setSplitMethod('percentage')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  splitMethod === 'percentage'
                    ? 'bg-ios-blue text-white'
                    : 'bg-ios-gray6 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                By %
              </button>
              <button
                type="button"
                onClick={() => setSplitMethod('shares')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  splitMethod === 'shares'
                    ? 'bg-ios-blue text-white'
                    : 'bg-ios-gray6 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                By Shares
              </button>
            </div>
          </div>

          {/* Split component */}
          {splitMethod === 'equal' && (
            <SplitEqual
              amount={parseFloat(amount)}
              participants={participants}
              onChange={setSplits}
            />
          )}
          {splitMethod === 'percentage' && (
            <SplitByPercentage
              amount={parseFloat(amount)}
              participants={participants}
              onChange={setSplits}
            />
          )}
          {splitMethod === 'shares' && (
            <SplitByShares
              amount={parseFloat(amount)}
              participants={participants}
              onChange={setSplits}
            />
          )}

          {!splitsValid && splits.length > 0 && (
            <p className="text-sm text-ios-red mt-2">
              Split amounts must total ${parseFloat(amount).toFixed(2)}
            </p>
          )}
        </motion.div>
      )}

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
          disabled={
            (step === 'basic' && !basicValid) ||
            (step === 'participants' && !participantsValid) ||
            (step === 'splits' && !splitsValid)
          }
          whileTap={{ scale:
            (step === 'basic' && basicValid) ||
            (step === 'participants' && participantsValid) ||
            (step === 'splits' && splitsValid)
              ? 0.97
              : 1
          }}
          className={`flex-1 px-6 py-3.5 rounded-xl font-semibold text-base ${
            (step === 'basic' && basicValid) ||
            (step === 'participants' && participantsValid) ||
            (step === 'splits' && splitsValid)
              ? 'bg-ios-blue text-white'
              : 'bg-ios-gray5 dark:bg-gray-700 text-ios-gray2 cursor-not-allowed'
          }`}
        >
          {step === 'splits' ? 'Create Expense' : 'Next'}
        </motion.button>
      </div>
    </form>
  );
}
