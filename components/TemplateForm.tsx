'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ParticipantPicker } from './ParticipantPicker';
import { CategoryPicker } from './CategoryPicker';
import { SplitEqual } from './SplitEqual';
import { SplitByPercentage } from './SplitByPercentage';
import { SplitByShares } from './SplitByShares';
import type { ExpenseSplit } from '@/lib/db/types';
import type { ParticipantWithDetails } from '@/hooks/useParticipants';
import { CategoryType } from '@/lib/types/category';

type SplitMethod = 'equal' | 'percentage' | 'shares' | 'exact';

/**
 * Form data type for template creation
 */
export type TemplateFormData = {
  name: string;
  split_type: 'equal' | 'percentage' | 'shares' | 'exact';
  category_id?: string | null;
  participants: ParticipantWithDetails[];
  splits: Array<{
    user_id?: string | null;
    participant_id?: string | null;
    split_value?: number | null;
  }>;
};

/**
 * TemplateForm component with iOS-native styling and validation
 *
 * Features:
 * - 2-step flow: Basic info (name + split type) → Participants & Splits
 * - Template name input with validation
 * - Split type selector (equal/percentage/shares/exact)
 * - Participant picker with smart suggestions
 * - Multiple split methods (reuses expense split components)
 * - Inline validation with error messages
 * - iOS-native design (San Francisco font, native controls)
 * - Disabled submit when form is invalid
 * - Optional initialData for editing existing templates
 */
export function TemplateForm({
  initialData,
  onSubmit,
  onCancel
}: {
  initialData?: TemplateFormData;
  onSubmit: (template: TemplateFormData) => void;
  onCancel?: () => void;
}) {
  // Form state - initialize from initialData if provided
  const [name, setName] = useState(initialData?.name || '');
  const [splitType, setSplitType] = useState<SplitMethod>(initialData?.split_type || 'equal');
  const [categoryId, setCategoryId] = useState<string | null>(initialData?.category_id || null);

  // Participant and split state
  const [participants, setParticipants] = useState<ParticipantWithDetails[]>(initialData?.participants || []);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);

  // Multi-step navigation
  const [step, setStep] = useState<'basic' | 'participants'>('basic');

  // Track which fields have been touched for validation display
  const [touched, setTouched] = useState({
    name: false
  });

  // Placeholder amount for template previews (templates store ratios, not amounts)
  const PLACEHOLDER_AMOUNT = 100;

  // Initialize splits from initialData
  useEffect(() => {
    if (initialData?.splits && initialData.splits.length > 0 && initialData.participants.length > 0) {
      // Convert splits to ExpenseSplit format for compatibility
      const convertedSplits: ExpenseSplit[] = initialData.participants.map((participant, index) => {
        const split = initialData.splits.find(s =>
          (s.user_id && s.user_id === participant.user_id) ||
          (s.participant_id && s.participant_id === participant.participant_id)
        );
        
        return {
          id: `temp-${index}`,
          expense_id: 'template',
          user_id: participant.user_id,
          participant_id: participant.participant_id,
          amount: 0, // Not used in templates
          split_type: initialData.split_type,
          split_value: split?.split_value || null,
          created_at: new Date().toISOString()
        };
      });
      setSplits(convertedSplits);
    }
  }, [initialData]);

  // Validation errors
  const errors = {
    name: (() => {
      if (!name) return 'Template name is required';
      if (name.length > 100) return 'Name must be less than 100 characters';
      return null;
    })()
  };

  // Step validation
  const basicValid = errors.name === null;
  const participantsValid = participants.length >= 2; // Templates need at least 2 participants
  const splitsValid = (() => {
    if (splitType === 'equal') {
      // Equal split is always valid if participants exist
      return participants.length >= 2;
    }
    
    // For other split types, validate using the split data
    if (splits.length !== participants.length) return false;

    // Check that each participant has a valid split
    return participants.every((p) => {
      const split = splits.find(
        (s) => 
          (s.user_id && s.user_id === p.user_id) ||
          (s.participant_id && s.participant_id === p.participant_id)
      );
      return split && split.split_value !== null && split.split_value > 0;
    });
  })();

  // Handlers
  function handleNextStep() {
    setTouched({ ...touched, name: true });
    if (basicValid) {
      setStep('participants');
    }
  }

  function handleSubmit() {
    if (!basicValid || !participantsValid || !splitsValid) return;

    // Build splits array from current state
    const formSplits = participants.map((p) => {
      if (splitType === 'equal') {
        return {
          user_id: p.user_id,
          participant_id: p.participant_id,
          split_value: null
        };
      }

      // Find corresponding split value
      const split = splits.find(
        (s) =>
          (s.user_id && s.user_id === p.user_id) ||
          (s.participant_id && s.participant_id === p.participant_id)
      );

      return {
        user_id: p.user_id,
        participant_id: p.participant_id,
        split_value: split?.split_value || null
      };
    });

    onSubmit({
      name,
      split_type: splitType,
      category_id: categoryId,
      participants,
      splits: formSplits
    });
  }

  return (
    <div className="space-y-4">
      {/* Step 1: Basic Info */}
      {step === 'basic' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-ios-black dark:text-white mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched({ ...touched, name: true })}
              placeholder="e.g., Weekend Trip Split"
              className="w-full px-4 py-3 bg-white dark:bg-ios-gray1 text-ios-black dark:text-white rounded-xl border border-ios-gray4 dark:border-ios-gray2 focus:border-ios-blue focus:ring-2 focus:ring-ios-blue/20 transition-all"
            />
            {touched.name && errors.name && (
              <p className="text-ios-red text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Split Type */}
          <div>
            <label className="block text-sm font-medium text-ios-black dark:text-white mb-2">
              Split Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['equal', 'percentage', 'shares', 'exact'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSplitType(type)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    splitType === type
                      ? 'bg-ios-blue text-white'
                      : 'bg-white dark:bg-ios-gray1 text-ios-black dark:text-white border border-ios-gray4 dark:border-ios-gray2'
                  }`}
                >
                  {type === 'equal' ? 'Equal' : type === 'percentage' ? 'Percentage' : type === 'shares' ? 'Shares' : 'Exact Amount'}
                </button>
              ))}
            </div>
          </div>

          {/* Category (optional) */}
          <div>
            <label className="block text-sm font-medium text-ios-black dark:text-white mb-2">
              Category (optional)
            </label>
            <p className="text-xs text-ios-gray dark:text-ios-gray3 mb-2">
              Template will auto-suggest when creating expenses in this category
            </p>
            <CategoryPicker
              selectedCategory={categoryId}
              onSelect={(category) => setCategoryId(category)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-3 bg-ios-gray5 dark:bg-ios-gray2 text-ios-black dark:text-white rounded-xl font-medium active:scale-95 transition-transform"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleNextStep}
              disabled={!basicValid}
              className="flex-1 px-4 py-3 bg-ios-blue text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
            >
              Next
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Participants & Splits */}
      {step === 'participants' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          {/* Back button */}
          <button
            type="button"
            onClick={() => setStep('basic')}
            className="text-ios-blue text-sm font-medium"
          >
            ← Back to Basic Info
          </button>

          {/* Participant Picker */}
          <div>
            <label className="block text-sm font-medium text-ios-black dark:text-white mb-2">
              Participants * (minimum 2)
            </label>
            <ParticipantPicker
              selected={participants}
              onChange={setParticipants}
            />
            {participants.length < 2 && (
              <p className="text-ios-gray dark:text-ios-gray3 text-sm mt-1">
                Add at least 2 participants
              </p>
            )}
          </div>

          {/* Split Configuration */}
          {participants.length >= 2 && (
            <div>
              <label className="block text-sm font-medium text-ios-black dark:text-white mb-2">
                Split Configuration
              </label>
              {splitType === 'equal' && (
                <SplitEqual
                  amount={PLACEHOLDER_AMOUNT}
                  participants={participants}
                  onChange={setSplits}
                />
              )}
              {splitType === 'percentage' && (
                <SplitByPercentage
                  amount={PLACEHOLDER_AMOUNT}
                  participants={participants}
                  onChange={setSplits}
                />
              )}
              {splitType === 'shares' && (
                <SplitByShares
                  amount={PLACEHOLDER_AMOUNT}
                  participants={participants}
                  onChange={setSplits}
                />
              )}
              {splitType === 'exact' && (
                <div className="p-4 bg-ios-gray5 dark:bg-ios-gray2 rounded-xl">
                  <p className="text-sm text-ios-gray dark:text-ios-gray3">
                    Exact amounts will be entered when creating expenses from this template.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-3 bg-ios-gray5 dark:bg-ios-gray2 text-ios-black dark:text-white rounded-xl font-medium active:scale-95 transition-transform"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!participantsValid || !splitsValid}
              className="flex-1 px-4 py-3 bg-ios-blue text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
            >
              {initialData ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
