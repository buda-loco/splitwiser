'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Zap, X, Bookmark } from 'lucide-react';
import { ParticipantPicker } from './ParticipantPicker';
import { SplitEqual } from './SplitEqual';
import { SplitByPercentage } from './SplitByPercentage';
import { SplitByShares } from './SplitByShares';
import { TagInput } from './TagInput';
import { CategoryPicker } from './CategoryPicker';
import { ReceiptUpload } from './ReceiptUpload';
import { detectCurrencyFromLocation } from '@/lib/currency/geolocation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTemplates, useCategoryTemplates } from '@/hooks/useTemplates';
import { getTemplateById, createTemplate } from '@/lib/db/stores';
import type { ExpenseSplit, TemplateParticipant } from '@/lib/db/types';
import type { ParticipantWithDetails } from '@/hooks/useParticipants';
import { CategoryType, getCategoryById } from '@/lib/types/category';

type SplitMethod = 'equal' | 'percentage' | 'shares' | 'exact';

/**
 * Form data type for expense creation
 */
export type ExpenseFormData = {
  amount: number;
  currency: string;
  description: string;
  category: string; // category_id as string (CategoryType enum value)
  expense_date: string;
  participants: ParticipantWithDetails[];
  splits: ExpenseSplit[];
  tags: string[];
  receipt_urls?: string[]; // Supabase Storage URLs for receipt photos
  manual_exchange_rate?: {
    from_currency: string;
    to_currency: string;
    rate: number;
  } | null;
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
  // Auth context
  const { user } = useAuth();

  // Form state
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [currency, setCurrency] = useState(initialData?.currency || 'AUD');
  const [currencyAutoDetected, setCurrencyAutoDetected] = useState(false);
  const [description, setDescription] = useState(initialData?.description || '');
  // Backward compatibility: Map old free-text category to CategoryType or default to null
  const [category, setCategory] = useState<string | null>(() => {
    if (!initialData?.category) return null;
    // Check if it's already a valid CategoryType
    if (Object.values(CategoryType).includes(initialData.category as CategoryType)) {
      return initialData.category;
    }
    // Old free-text category, map to "Other"
    return CategoryType.OTHER;
  });
  const [expenseDate, setExpenseDate] = useState(
    initialData?.expense_date || new Date().toISOString().split('T')[0]
  );

  // Template management
  const { templates } = useTemplates(user?.id || null);
  const { templates: categoryTemplates } = useCategoryTemplates(category, user?.id || null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Participant and split state
  const [participants, setParticipants] = useState<ParticipantWithDetails[]>(initialData?.participants || []);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [splits, setSplits] = useState<ExpenseSplit[]>(initialData?.splits || []);

  // Tags state
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);

  // Receipt URLs state
  const [receiptUrls, setReceiptUrls] = useState<string[]>(initialData?.receipt_urls || []);
  const [tempExpenseId] = useState(() => crypto.randomUUID()); // Temporary ID for receipt uploads

  // Manual exchange rate state
  const [showManualRate, setShowManualRate] = useState(false);
  const [manualRate, setManualRate] = useState('');

  // Multi-step navigation
  const [step, setStep] = useState<'basic' | 'participants' | 'splits'>('basic');

  // Track which fields have been touched for validation display
  const [touched, setTouched] = useState({
    amount: false,
    description: false,
    category: false,
    expense_date: false
  });

  // Submission state for loading animation
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shake animation state for validation errors
  const [shakeField, setShakeField] = useState<string | null>(null);

  // Auto-detect currency from location on mount
  useEffect(() => {
    async function autoDetectCurrency() {
      // Skip auto-detection if currency was provided in initialData
      if (initialData?.currency) {
        return;
      }

      const detected = await detectCurrencyFromLocation();

      if (detected) {
        setCurrency(detected);
        setCurrencyAutoDetected(true);
      } else {
        // Fall back to default currency (AUD)
        // TODO: Load from user profile currency_preference in future
        setCurrency('AUD');
      }
    }

    autoDetectCurrency();
  }, [initialData?.currency]);  // Run once on mount (unless initialData changes)

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

  // Trigger shake animation for a field
  const triggerShake = (field: string) => {
    setShakeField(field);
    setTimeout(() => setShakeField(null), 500);
  };

  // Handle receipt upload
  const handleReceiptUpload = (fileUrl: string) => {
    // Check max 5 receipts limit
    if (receiptUrls.length >= 5) {
      alert('Maximum 5 receipts per expense. Please remove one before adding another.');
      return;
    }
    setReceiptUrls(prev => [...prev, fileUrl]);
  };

  // Handle receipt removal
  const handleReceiptRemove = (index: number) => {
    setReceiptUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'basic') {
      // Mark all fields as touched to show validation errors
      setTouched({
        amount: true,
        description: true,
        category: true,
        expense_date: true
      });

      // Trigger shake animation on invalid fields
      if (!basicValid) {
        if (errors.amount) triggerShake('amount');
        if (errors.description) triggerShake('description');
        if (errors.category) triggerShake('category');
        if (errors.expense_date) triggerShake('expense_date');
        return;
      }

      setStep('participants');
    } else if (step === 'participants') {
      // Advance to split method selection if participants selected
      if (participantsValid) {
        setStep('splits');
      }
    } else if (step === 'splits') {
      // Final submission
      if (splitsValid) {
        setIsSubmitting(true);

        const manual_exchange_rate = manualRate && parseFloat(manualRate) > 0
          ? {
              from_currency: currency,
              to_currency: 'AUD',
              rate: parseFloat(manualRate)
            }
          : null;

        // CRITICAL: Validate that splits sum to total amount (data integrity)
        const totalAmount = parseFloat(amount);
        const splitsSum = splits.reduce((sum, split) => sum + split.amount, 0);
        const difference = Math.abs(splitsSum - totalAmount);

        // Allow 0.01 difference for rounding errors
        if (difference > 0.01) {
          alert(
            `Error: Splits sum (${splitsSum.toFixed(2)}) does not match expense total (${totalAmount.toFixed(2)}). ` +
            `Please adjust your splits.`
          );
          setIsSubmitting(false);
          return;
        }

        try {
          await onSubmit({
            amount: parseFloat(amount),
            currency,
            description,
            category: category || '', // category_id as string
            expense_date: expenseDate,
            participants,
            splits,
            tags,
            receipt_urls: receiptUrls,
            manual_exchange_rate
          });

          // Clear form after successful submission
          setAmount('');
          setDescription('');
          setCategory(null);
          setExpenseDate(new Date().toISOString().split('T')[0]);
          setParticipants([]);
          setSplits([]);
          setTags([]);
          setReceiptUrls([]);
          setManualRate('');
          setShowManualRate(false);
          setCurrencyAutoDetected(false);
          setStep('basic');
          setTouched({
            amount: false,
            description: false,
            category: false,
            expense_date: false
          });
        } finally {
          setIsSubmitting(false);
        }
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

  // Handle currency change (clear auto-detected flag on manual change)
  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    setCurrencyAutoDetected(false);  // User manually changed, so no longer auto-detected
  };

  // Apply template to populate participants and splits
  const applyTemplate = async (templateId: string) => {
    const result = await getTemplateById(templateId);
    if (!result) return;

    const { template, participants: templateParticipants } = result;

    // Load full participant details for each template participant
    const participantDetails: Array<ParticipantWithDetails & { split_value: number | null }> = [];

    for (const tp of templateParticipants) {
      if (tp.user_id) {
        // TODO: Load user details with getUserById when available
        // For now, use placeholder - Phase 2 has user profiles but no query by ID in stores.ts
        participantDetails.push({
          user_id: tp.user_id,
          participant_id: null,
          name: 'User', // TODO: Load from database
          email: null,
          split_value: tp.split_value
        });
      } else if (tp.participant_id) {
        // TODO: Load participant with getParticipantById when available
        // For now, use placeholder
        participantDetails.push({
          user_id: null,
          participant_id: tp.participant_id,
          name: 'Participant', // TODO: Load from database
          email: null,
          split_value: tp.split_value
        });
      }
    }

    // Set participants (strip split_value for form state)
    setParticipants(participantDetails.map(({ split_value, ...p }) => p));

    // Set split method
    setSplitMethod(template.split_type);

    // Set splits based on template configuration
    const newSplits: ExpenseSplit[] = participantDetails.map(p => ({
      id: crypto.randomUUID(),
      expense_id: '', // Will be set on save
      user_id: p.user_id,
      participant_id: p.participant_id,
      amount: 0, // Will be calculated based on expense amount
      split_type: template.split_type,
      split_value: p.split_value,
      created_at: new Date().toISOString()
    }));

    setSplits(newSplits);

    // Collapse template selector
    setShowTemplates(false);

    // Auto-advance to splits step
    setStep('splits');
  };

  // Save current configuration as template
  const saveAsTemplate = async () => {
    if (!user || !templateName.trim() || participants.length < 2 || splits.length === 0) {
      return;
    }

    setSavingTemplate(true);
    try {
      await createTemplate({
        name: templateName.trim(),
        split_type: splitMethod,
        category_id: category,
        created_by_user_id: user.id,
        participants: splits.map(split => ({
          user_id: split.user_id,
          participant_id: split.participant_id,
          split_value: split.split_value
        }))
      });

      // Show success feedback
      alert('Template saved! You can reuse it from the templates page.');

      // Reset modal state
      setShowSaveTemplate(false);
      setTemplateName('');
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 h-1 rounded transition-colors bg-ios-blue" />
        <div className={`flex-1 h-1 rounded transition-colors ${step === 'participants' || step === 'splits' ? 'bg-ios-blue' : 'bg-ios-gray5 dark:bg-gray-700'}`} />
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
            <motion.div
              className="relative"
              animate={shakeField === 'amount' ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
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
                className={`w-full pl-10 pr-4 py-3 bg-ios-gray6 dark:bg-gray-800 rounded-xl border transition-colors ${
                  touched.amount && errors.amount
                    ? 'border-ios-red'
                    : 'border-transparent'
                } focus:outline-none focus:ring-2 focus:ring-ios-blue focus:border-transparent text-base`}
              />
            </motion.div>
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
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="px-4 py-3 bg-ios-gray6 dark:bg-gray-800 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-ios-blue focus:border-transparent text-base font-medium"
          >
            <option value="AUD">AUD</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>

        {/* Auto-detection indicator */}
        {currencyAutoDetected && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs text-ios-blue dark:text-blue-400"
          >
            Auto-detected: {currency}
          </motion.p>
        )}
      </div>

      {/* Manual Exchange Rate (optional) */}
      {currency !== 'AUD' && (
        <div>
          <button
            type="button"
            onClick={() => setShowManualRate(!showManualRate)}
            className="text-sm text-ios-blue dark:text-blue-400 font-medium active:opacity-70 transition-opacity"
          >
            {showManualRate ? '− Hide' : '+ Set custom exchange rate'}
          </button>

          {showManualRate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2"
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Exchange Rate (optional)
              </label>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                1 {currency} = ? AUD
              </div>
              <input
                type="number"
                step="0.0001"
                value={manualRate}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || parseFloat(value) > 0) {
                    setManualRate(value);
                  }
                }}
                placeholder="e.g., 1.6500"
                className="w-full px-4 py-3 bg-ios-gray6 dark:bg-gray-800 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-ios-blue focus:border-transparent text-base"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Leave empty to use current market rate
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <motion.div
          animate={shakeField === 'description' ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleBlur('description')}
            placeholder="What was this expense for?"
            maxLength={255}
            className={`w-full px-4 py-3 bg-ios-gray6 dark:bg-gray-800 rounded-xl border transition-colors ${
              touched.description && errors.description
                ? 'border-ios-red'
                : 'border-transparent'
            } focus:outline-none focus:ring-2 focus:ring-ios-blue focus:border-transparent text-base`}
          />
        </motion.div>
        {touched.description && errors.description && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mt-1.5 text-xs text-ios-red"
          >
            {errors.description}
          </motion.p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category (optional)
        </label>
        <CategoryPicker
          value={category}
          onChange={(categoryId) => setCategory(categoryId)}
        />
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Helps organize expenses for analytics
        </p>

        {/* Template suggestions when category is selected */}
        {category && categoryTemplates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-ios-blue" />
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Quick apply template:
              </p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {categoryTemplates.slice(0, 3).map((template, index) => (
                <motion.button
                  key={template.id}
                  type="button"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => applyTemplate(template.id)}
                  className="flex-shrink-0 px-3 py-2 bg-white dark:bg-gray-800 border border-ios-gray4 dark:border-gray-700 rounded-lg hover:border-ios-blue hover:bg-ios-blue/5 transition-all active:scale-95 flex items-center gap-2"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {template.name}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Users className="w-3 h-3" />
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
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
            role="alert"
            className="mt-1.5 text-xs text-ios-red"
          >
            {errors.expense_date}
          </motion.p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tags (optional)
        </label>
        <TagInput tags={tags} onChange={setTags} />
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
            selectedTags={tags}
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

          {/* Save as template button (Step 3 only) */}
          {step === 'splits' && participants.length >= 2 && splits.length > 0 && !showSaveTemplate && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                setTemplateName(description || '');
                setShowSaveTemplate(true);
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-ios-gray4 dark:border-gray-700 rounded-lg text-ios-blue dark:text-blue-400 font-medium hover:bg-ios-blue/5 active:scale-95 transition-all"
            >
              <Bookmark className="w-4 h-4" />
              <span>Save as template</span>
            </motion.button>
          )}

          {/* Save as template modal */}
          <AnimatePresence>
            {showSaveTemplate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-ios-gray6 dark:bg-gray-800 rounded-xl border border-ios-gray4 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Save as Template</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveTemplate(false);
                      setTemplateName('');
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., Weekend Trip Split"
                      className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-ios-gray4 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ios-blue text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Category (optional)
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {category ? getCategoryById(category as CategoryType)?.label || 'Selected' : 'None selected'}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSaveTemplate(false);
                        setTemplateName('');
                      }}
                      className="flex-1 px-4 py-2.5 bg-ios-gray5 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium active:scale-95 transition-transform"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveAsTemplate}
                      disabled={savingTemplate || !templateName.trim()}
                      className="flex-1 px-4 py-2.5 bg-ios-blue text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
                    >
                      {savingTemplate ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
            isSubmitting ||
            (step === 'basic' && !basicValid) ||
            (step === 'participants' && !participantsValid) ||
            (step === 'splits' && !splitsValid)
          }
          whileTap={{ scale:
            !isSubmitting &&
            ((step === 'basic' && basicValid) ||
            (step === 'participants' && participantsValid) ||
            (step === 'splits' && splitsValid))
              ? 0.97
              : 1
          }}
          className={`flex-1 px-6 py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 ${
            !isSubmitting &&
            ((step === 'basic' && basicValid) ||
            (step === 'participants' && participantsValid) ||
            (step === 'splits' && splitsValid))
              ? 'bg-ios-blue text-white'
              : 'bg-ios-gray5 dark:bg-gray-700 text-ios-gray2 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
              <span>Saving...</span>
            </>
          ) : (
            <span>{step === 'splits' ? 'Create Expense' : 'Next'}</span>
          )}
        </motion.button>
      </div>
    </form>
  );
}
