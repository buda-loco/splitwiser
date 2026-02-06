'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ParticipantPicker } from './ParticipantPicker';
import { submitSettlement } from '@/lib/actions/settlement';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { ParticipantWithDetails } from '@/hooks/useParticipants';
import type { BalanceEntry } from '@/lib/balances/types';

/**
 * Form data for settlement submission
 */
export type SettlementFormData = {
  from: ParticipantWithDetails;
  to: ParticipantWithDetails;
  amount: number;
  currency: string;
  settlement_date: string;
};

type SettlementFormProps = {
  initialBalance?: BalanceEntry;
  onSubmit?: (data: SettlementFormData) => void | Promise<void>;
  onSuccess?: () => void;
  onCancel?: () => void;
};

/**
 * Settlement form component for recording debt payments
 *
 * Features:
 * - Person selection (from/to) with participant picker
 * - Amount input with currency selector
 * - Settlement date picker
 * - Pre-fills from balance entry if provided
 * - iOS-native styling matching ExpenseForm patterns
 * - Validation: amount > 0, from/to selected, from !== to
 */
export function SettlementForm({
  initialBalance,
  onSubmit,
  onSuccess,
  onCancel
}: SettlementFormProps) {
  // Form state - pre-fill from initialBalance if provided
  const [fromPerson, setFromPerson] = useState<ParticipantWithDetails | null>(
    initialBalance ? {
      user_id: initialBalance.from.user_id,
      participant_id: initialBalance.from.participant_id,
      name: initialBalance.from.name,
      email: null
    } : null
  );

  const [toPerson, setToPerson] = useState<ParticipantWithDetails | null>(
    initialBalance ? {
      user_id: initialBalance.to.user_id,
      participant_id: initialBalance.to.participant_id,
      name: initialBalance.to.name,
      email: null
    } : null
  );

  const [amount, setAmount] = useState(
    initialBalance?.amount.toString() || ''
  );

  const [currency, setCurrency] = useState(
    initialBalance?.currency || 'AUD'
  );

  const [settlementDate, setSettlementDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Track touched fields for validation display
  const [touched, setTouched] = useState({
    from: false,
    to: false,
    amount: false,
    settlement_date: false
  });

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Error message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation errors
  const errors = {
    from: !fromPerson ? 'Please select who is paying' : null,
    to: !toPerson ? 'Please select who is receiving payment' : null,
    amount: (() => {
      if (!amount) return 'Amount is required';
      const num = parseFloat(amount);
      if (isNaN(num) || num <= 0) return 'Amount must be greater than 0';
      if (!/^\d+(\.\d{1,2})?$/.test(amount)) return 'Amount must have at most 2 decimal places';
      return null;
    })(),
    settlement_date: (() => {
      if (!settlementDate) return 'Date is required';
      const selectedDate = new Date(settlementDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) return 'Date cannot be in the future';
      return null;
    })(),
    samePerson: fromPerson && toPerson &&
      ((fromPerson.user_id && fromPerson.user_id === toPerson.user_id) ||
       (fromPerson.participant_id && fromPerson.participant_id === toPerson.participant_id))
      ? 'From and To must be different people'
      : null
  };

  // Form is valid if no errors exist
  const isValid = !errors.from && !errors.to && !errors.amount && !errors.settlement_date && !errors.samePerson;

  // Handle field blur
  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
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

  // Get current user for created_by_user_id
  const { user } = useAuth();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      from: true,
      to: true,
      amount: true,
      settlement_date: true
    });

    // Validate
    if (!isValid || !fromPerson || !toPerson) {
      return;
    }

    // Check user authentication
    if (!user) {
      setErrorMessage('You must be logged in to record a settlement');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Call onSubmit callback if provided (for custom handling)
      if (onSubmit) {
        await onSubmit({
          from: fromPerson,
          to: toPerson,
          amount: parseFloat(amount),
          currency,
          settlement_date: settlementDate
        });
      } else {
        // Default: call server action to submit settlement
        const result = await submitSettlement({
          from_user_id: fromPerson.user_id,
          from_participant_id: fromPerson.participant_id,
          to_user_id: toPerson.user_id,
          to_participant_id: toPerson.participant_id,
          amount: parseFloat(amount),
          currency,
          settlement_date: settlementDate,
          settlement_type: 'partial', // Default to partial (other types in plans 02-03)
          created_by_user_id: user.id
        });

        if (!result.success) {
          throw new Error(result.error);
        }
      }

      // Reset form on success
      setFromPerson(null);
      setToPerson(null);
      setAmount('');
      setCurrency('AUD');
      setSettlementDate(new Date().toISOString().split('T')[0]);
      setTouched({
        from: false,
        to: false,
        amount: false,
        settlement_date: false
      });

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Settlement submission failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit settlement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* From person selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          From (who is paying)
        </label>
        <ParticipantPicker
          selected={fromPerson ? [fromPerson] : []}
          onChange={(participants) => {
            setFromPerson(participants[0] || null);
            handleBlur('from');
          }}
          selectedTags={[]}
          singleSelect
        />
        {touched.from && errors.from && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mt-1.5 text-xs text-ios-red"
          >
            {errors.from}
          </motion.p>
        )}
      </div>

      {/* To person selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          To (who is receiving payment)
        </label>
        <ParticipantPicker
          selected={toPerson ? [toPerson] : []}
          onChange={(participants) => {
            setToPerson(participants[0] || null);
            handleBlur('to');
          }}
          selectedTags={[]}
          singleSelect
        />
        {touched.to && errors.to && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mt-1.5 text-xs text-ios-red"
          >
            {errors.to}
          </motion.p>
        )}
      </div>

      {/* Same person error */}
      {errors.samePerson && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="text-xs text-ios-red"
        >
          {errors.samePerson}
        </motion.p>
      )}

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
                role="alert"
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

      {/* Settlement Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Settlement Date
        </label>
        <input
          type="date"
          value={settlementDate}
          onChange={(e) => setSettlementDate(e.target.value)}
          onBlur={() => handleBlur('settlement_date')}
          max={new Date().toISOString().split('T')[0]}
          className={`w-full px-4 py-3 bg-ios-gray6 dark:bg-gray-800 rounded-xl border ${
            touched.settlement_date && errors.settlement_date
              ? 'border-ios-red'
              : 'border-transparent'
          } focus:outline-none focus:ring-2 focus:ring-ios-blue focus:border-transparent text-base`}
        />
        {touched.settlement_date && errors.settlement_date && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mt-1.5 text-xs text-ios-red"
          >
            {errors.settlement_date}
          </motion.p>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
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
          disabled={!isValid || isSubmitting}
          whileTap={{ scale: isValid && !isSubmitting ? 0.97 : 1 }}
          className={`flex-1 px-6 py-3.5 rounded-xl font-semibold text-base ${
            isValid && !isSubmitting
              ? 'bg-ios-blue text-white'
              : 'bg-ios-gray5 dark:bg-gray-700 text-ios-gray2 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Record Settlement'}
        </motion.button>
      </div>
    </form>
  );
}
