'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ParticipantPicker } from './ParticipantPicker';
import { SplitEqual } from './SplitEqual';
import { SplitByPercentage } from './SplitByPercentage';
import { SplitByShares } from './SplitByShares';
import type { ExpenseSplit } from '@/lib/db/types';
import type { ParticipantWithDetails } from '@/hooks/useParticipants';

type SplitMethod = 'equal' | 'percentage' | 'shares' | 'exact';

/**
 * Form data type for template creation
 */
export type TemplateFormData = {
  name: string;
  split_type: 'equal' | 'percentage' | 'shares' | 'exact';
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
 */
export function TemplateForm({
  onSubmit,
  onCancel
}: {
  onSubmit: (template: TemplateFormData) => void;
  onCancel?: () => void;
}) {
  // Form state
  const [name, setName] = useState('');
  const [splitType, setSplitType] = useState<SplitMethod>('equal');

  // Participant and split state
  const [participants, setParticipants] = useState<ParticipantWithDetails[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);

  // Multi-step navigation
  const [step, setStep] = useState<'basic' | 'participants'>('basic');

  // Track which fields have been touched for validation display
  const [touched, setTouched] = useState({
    name: false
  });

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

    // For percentage, shares, and exact, check if splits are valid
    if (splits.length === 0) return false;

    if (splitType === 'percentage') {
      // Percentages should total 100%
      const totalPercentage = splits.reduce((sum, s) => sum + (s.split_value || 0), 0);
      return Math.abs(totalPercentage - 100) < 0.01;
    }

    if (splitType === 'shares') {
      // At least one participant should have a share > 0
      return splits.some(s => (s.split_value || 0) > 0);
    }

    if (splitType === 'exact') {
      // For exact amounts, all participants should have a value
      return splits.every(s => (s.split_value || 0) > 0);
    }

    return false;
  })();

  // Handle field blur to mark as touched
  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'basic') {
      // Mark all fields as touched to show validation errors
      setTouched({ name: true });

      // Only advance if basic form is valid
      if (basicValid) {
        setStep('participants');
      }
    } else if (step === 'participants') {
      // Final submission
      if (participantsValid && splitsValid) {
        // Extract split values from the splits
        const templateSplits = participants.map(participant => {
          const split = splits.find(s =>
            (s.user_id && s.user_id === participant.user_id) ||
            (s.participant_id && s.participant_id === participant.participant_id)
          );

          return {
            user_id: participant.user_id || null,
            participant_id: participant.participant_id || null,
            split_value: splitType === 'equal' ? null : (split?.split_value || null)
          };
        });

        onSubmit({
          name,
          split_type: splitType,
          participants,
          splits: templateSplits
        });

        // Clear form after successful submission
        setName('');
        setSplitType('equal');
        setParticipants([]);
        setSplits([]);
        setStep('basic');
        setTouched({ name: false });
      }
    }
  };

  // Reset splits when split type or participants change
  useEffect(() => {
    setSplits([]);
  }, [splitType, participants]);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 h-1 rounded transition-colors bg-ios-blue" />
        <div className={`flex-1 h-1 rounded transition-colors ${step === 'participants' ? 'bg-ios-blue' : 'bg-ios-gray5 dark:bg-gray-700'}`} />
      </div>

      {/* Step 1: Basic info (name + split type) */}
      {step === 'basic' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-5"
        >
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="e.g., Trip with Friends"
              maxLength={100}
              className={`w-full px-4 py-3 bg-ios-gray6 dark:bg-gray-800 rounded-xl border ${
                touched.name && errors.name
                  ? 'border-ios-red'
                  : 'border-transparent'
              } focus:outline-none focus:ring-2 focus:ring-ios-blue focus:border-transparent text-base`}
            />
            {touched.name && errors.name && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="mt-1.5 text-xs text-ios-red"
              >
                {errors.name}
              </motion.p>
            )}
          </div>

          {/* Split Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Split Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSplitType('equal')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  splitType === 'equal'
                    ? 'bg-ios-blue text-white'
                    : 'bg-ios-gray6 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                Equally
              </button>
              <button
                type="button"
                onClick={() => setSplitType('percentage')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  splitType === 'percentage'
                    ? 'bg-ios-blue text-white'
                    : 'bg-ios-gray6 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                By Percentage
              </button>
              <button
                type="button"
                onClick={() => setSplitType('shares')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  splitType === 'shares'
                    ? 'bg-ios-blue text-white'
                    : 'bg-ios-gray6 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                By Shares
              </button>
              <button
                type="button"
                onClick={() => setSplitType('exact')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  splitType === 'exact'
                    ? 'bg-ios-blue text-white'
                    : 'bg-ios-gray6 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                Fixed Amounts
              </button>
            </div>
          </div>

          {/* Description of selected split type */}
          <div className="bg-ios-gray6 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {splitType === 'equal' && 'Split equally among all participants'}
              {splitType === 'percentage' && 'Assign a percentage to each participant (must total 100%)'}
              {splitType === 'shares' && 'Assign shares to each participant (e.g., 1, 2, 3)'}
              {splitType === 'exact' && 'Set fixed amounts or percentages for each participant'}
            </p>
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
          <button
            type="button"
            onClick={() => setStep('basic')}
            className="flex items-center gap-2 text-ios-blue dark:text-blue-400 font-medium active:opacity-70 transition-opacity"
          >
            <span>←</span>
            <span>Back</span>
          </button>

          {/* Participant Picker */}
          <ParticipantPicker
            selected={participants}
            onChange={setParticipants}
          />

          {!participantsValid && participants.length > 0 && (
            <p className="text-sm text-ios-red mt-2">
              Templates require at least 2 participants
            </p>
          )}

          {/* Split Configuration (only show when participants selected) */}
          {participants.length >= 2 && (
            <div className="pt-4 border-t border-gray-300 dark:border-gray-600">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Configure Split Values
              </h3>

              {/* Equal split - no configuration needed */}
              {splitType === 'equal' && (
                <SplitEqual
                  amount={100} // Dummy amount for display
                  participants={participants}
                  onChange={setSplits}
                />
              )}

              {/* Percentage split */}
              {splitType === 'percentage' && (
                <SplitByPercentage
                  amount={100} // Dummy amount for display
                  participants={participants}
                  onChange={setSplits}
                />
              )}

              {/* Shares split */}
              {splitType === 'shares' && (
                <SplitByShares
                  amount={100} // Dummy amount for display
                  participants={participants}
                  onChange={setSplits}
                />
              )}

              {/* Exact amounts - use percentage component but label differently */}
              {splitType === 'exact' && (
                <SplitByPercentage
                  amount={100} // Dummy amount for display
                  participants={participants}
                  onChange={setSplits}
                />
              )}

              {!splitsValid && splits.length > 0 && (
                <p className="text-sm text-ios-red mt-2">
                  {splitType === 'percentage' && 'Percentages must total 100%'}
                  {splitType === 'shares' && 'At least one participant must have shares'}
                  {splitType === 'exact' && 'All participants must have values'}
                </p>
              )}
            </div>
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
            (step === 'participants' && (!participantsValid || !splitsValid))
          }
          whileTap={{ scale:
            (step === 'basic' && basicValid) ||
            (step === 'participants' && participantsValid && splitsValid)
              ? 0.97
              : 1
          }}
          className={`flex-1 px-6 py-3.5 rounded-xl font-semibold text-base ${
            (step === 'basic' && basicValid) ||
            (step === 'participants' && participantsValid && splitsValid)
              ? 'bg-ios-blue text-white'
              : 'bg-ios-gray5 dark:bg-gray-700 text-ios-gray2 cursor-not-allowed'
          }`}
        >
          {step === 'participants' ? 'Create Template' : 'Next'}
        </motion.button>
      </div>
    </form>
  );
}
