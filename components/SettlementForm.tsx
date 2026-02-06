'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticipantPicker } from './ParticipantPicker';
import { submitSettlement } from '@/lib/actions/settlement';
import { useAuth } from '@/lib/contexts/AuthContext';
import { calculateNetBalance, calculateTagBalance, getTagsWithBalances } from '@/lib/balances/calculator';
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
  initialSettlementType?: 'partial' | 'global' | 'tag_specific';
  initialTag?: string | null;
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
  initialSettlementType = 'partial',
  initialTag = null,
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

  // Settlement type: 'partial', 'global', or 'tag_specific'
  const [settlementType, setSettlementType] = useState<'partial' | 'global' | 'tag_specific'>(initialSettlementType);

  // Net balance for global settlement
  const [netBalance, setNetBalance] = useState<{ amount: number; currency: string; direction: string } | null>(null);
  const [calculatingNet, setCalculatingNet] = useState(false);

  // Tag-specific settlement state
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag);
  const [tagsWithBalances, setTagsWithBalances] = useState<Array<{ tag: string; balance: number; currency: string }>>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [tagBalance, setTagBalance] = useState<{ amount: number; currency: string; direction: string } | null>(null);
  const [calculatingTag, setCalculatingTag] = useState(false);

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

  // Load tags with balances when tag_specific mode is selected
  useEffect(() => {
    const loadTags = async () => {
      if (settlementType === 'tag_specific' && fromPerson && toPerson) {
        setLoadingTags(true);
        try {
          const tags = await getTagsWithBalances(
            {
              user_id: fromPerson.user_id,
              participant_id: fromPerson.participant_id,
              name: fromPerson.name,
            },
            {
              user_id: toPerson.user_id,
              participant_id: toPerson.participant_id,
              name: toPerson.name,
            }
          );

          setTagsWithBalances(tags);

          // If no tags, clear selection
          if (tags.length === 0) {
            setSelectedTag(null);
          }
        } catch (error) {
          console.error('Failed to load tags with balances:', error);
          setErrorMessage('Failed to load tags');
        } finally {
          setLoadingTags(false);
        }
      }
    };

    loadTags();
  }, [settlementType, fromPerson, toPerson]);

  // Calculate tag balance when tag is selected
  useEffect(() => {
    const calculateTag = async () => {
      if (settlementType === 'tag_specific' && fromPerson && toPerson && selectedTag) {
        setCalculatingTag(true);
        try {
          const result = await calculateTagBalance(
            {
              user_id: fromPerson.user_id,
              participant_id: fromPerson.participant_id,
              name: fromPerson.name,
            },
            {
              user_id: toPerson.user_id,
              participant_id: toPerson.participant_id,
              name: toPerson.name,
            },
            selectedTag
          );

          setTagBalance(result);

          // Auto-fill amount and currency from tag balance
          if (result.direction === 'settled') {
            setAmount('0');
          } else {
            setAmount(result.amount.toFixed(2));
          }
          setCurrency(result.currency);
        } catch (error) {
          console.error('Failed to calculate tag balance:', error);
          setErrorMessage('Failed to calculate tag balance');
        } finally {
          setCalculatingTag(false);
        }
      }
    };

    calculateTag();
  }, [settlementType, fromPerson, toPerson, selectedTag]);

  // Calculate net balance when settlement type is 'global' and both people are selected
  useEffect(() => {
    const calculateNet = async () => {
      if (settlementType === 'global' && fromPerson && toPerson) {
        setCalculatingNet(true);
        try {
          const result = await calculateNetBalance(
            {
              user_id: fromPerson.user_id,
              participant_id: fromPerson.participant_id,
              name: fromPerson.name,
            },
            {
              user_id: toPerson.user_id,
              participant_id: toPerson.participant_id,
              name: toPerson.name,
            }
          );

          setNetBalance(result);

          // Auto-fill amount and currency from net balance
          if (result.direction === 'settled') {
            setAmount('0');
          } else {
            setAmount(result.amount.toFixed(2));
          }
          setCurrency(result.currency);
        } catch (error) {
          console.error('Failed to calculate net balance:', error);
          setErrorMessage('Failed to calculate net balance');
        } finally {
          setCalculatingNet(false);
        }
      }
    };

    calculateNet();
  }, [settlementType, fromPerson, toPerson]);

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
          settlement_type: settlementType,
          tag: settlementType === 'tag_specific' ? selectedTag : null,
          created_by_user_id: user.id
        });

        if (!result.success) {
          throw new Error(result.error);
        }
      }

      // Dispatch settlement-created event for balance re-calculation
      window.dispatchEvent(new CustomEvent('settlement-created'));

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
      {/* Settlement Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Settlement Type
        </label>
        <div className="grid grid-cols-3 gap-2 p-1 bg-ios-gray6 dark:bg-gray-800 rounded-xl">
          <button
            type="button"
            onClick={() => setSettlementType('global')}
            className={`px-3 py-2 rounded-lg font-medium text-xs transition-all ${
              settlementType === 'global'
                ? 'bg-white dark:bg-gray-700 text-ios-blue shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Settle All
          </button>
          <button
            type="button"
            onClick={() => setSettlementType('tag_specific')}
            className={`px-3 py-2 rounded-lg font-medium text-xs transition-all ${
              settlementType === 'tag_specific'
                ? 'bg-white dark:bg-gray-700 text-ios-blue shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Settle Tag
          </button>
          <button
            type="button"
            onClick={() => setSettlementType('partial')}
            className={`px-3 py-2 rounded-lg font-medium text-xs transition-all ${
              settlementType === 'partial'
                ? 'bg-white dark:bg-gray-700 text-ios-blue shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Partial Amount
          </button>
        </div>
      </div>

      {/* Tag selector for tag_specific settlement */}
      {settlementType === 'tag_specific' && fromPerson && toPerson && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Tag
          </label>

          {loadingTags ? (
            <div className="px-4 py-3 bg-ios-gray6 dark:bg-gray-800 rounded-xl text-sm text-ios-gray">
              Loading tags...
            </div>
          ) : tagsWithBalances.length === 0 ? (
            <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                No tagged expenses between these people
              </p>
            </div>
          ) : (
            <select
              value={selectedTag || ''}
              onChange={(e) => setSelectedTag(e.target.value || null)}
              className="w-full px-4 py-3 bg-ios-gray6 dark:bg-gray-800 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-ios-blue focus:border-transparent text-base"
            >
              <option value="">Select a tag...</option>
              {tagsWithBalances.map(({ tag, balance, currency }) => (
                <option key={tag} value={tag}>
                  #{tag}: {currency} {balance.toFixed(2)}
                </option>
              ))}
            </select>
          )}
        </motion.div>
      )}

      {/* Tag balance display */}
      {settlementType === 'tag_specific' && tagBalance && selectedTag && fromPerson && toPerson && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
        >
          {calculatingTag ? (
            <p className="text-sm text-blue-800 dark:text-blue-200">Calculating tag balance...</p>
          ) : tagBalance.direction === 'settled' ? (
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
              All balances for #{selectedTag} are settled between {fromPerson.name} and {toPerson.name}
            </p>
          ) : (
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                Balance for #{selectedTag}: {tagBalance.direction === 'A_owes_B' ? fromPerson.name : toPerson.name} owes{' '}
                {tagBalance.direction === 'A_owes_B' ? toPerson.name : fromPerson.name}{' '}
                <span className="font-bold">{tagBalance.currency} {tagBalance.amount.toFixed(2)}</span>
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                This will settle balances for #{selectedTag}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Net balance display for global settlement */}
      {settlementType === 'global' && netBalance && fromPerson && toPerson && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
        >
          {calculatingNet ? (
            <p className="text-sm text-blue-800 dark:text-blue-200">Calculating net balance...</p>
          ) : netBalance.direction === 'settled' ? (
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
              All balances are settled between {fromPerson.name} and {toPerson.name}
            </p>
          ) : (
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                Net balance: {netBalance.direction === 'A_owes_B' ? fromPerson.name : toPerson.name} owes{' '}
                {netBalance.direction === 'A_owes_B' ? toPerson.name : fromPerson.name}{' '}
                <span className="font-bold">{netBalance.currency} {netBalance.amount.toFixed(2)}</span>
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                This will settle all balances between these people
              </p>
            </div>
          )}
        </motion.div>
      )}

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
                readOnly={settlementType === 'global' || (settlementType === 'tag_specific' && !!selectedTag)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                  settlementType === 'global' || (settlementType === 'tag_specific' && !!selectedTag)
                    ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                    : 'bg-ios-gray6 dark:bg-gray-800'
                } ${
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
            disabled={settlementType === 'global' || (settlementType === 'tag_specific' && !!selectedTag)}
            className={`px-4 py-3 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-ios-blue focus:border-transparent text-base font-medium ${
              settlementType === 'global' || (settlementType === 'tag_specific' && !!selectedTag)
                ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                : 'bg-ios-gray6 dark:bg-gray-800'
            }`}
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
