/**
 * Zod Validation Schemas
 *
 * Central location for all data validation schemas.
 * Ensures data integrity and prevents invalid inputs.
 */

import { z } from 'zod';

// ============================================================================
// EXPENSE SCHEMAS
// ============================================================================

export const expenseSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .finite('Amount must be a valid number')
    .refine(
      (val) => Number.isFinite(val) && val <= 999999999.99,
      'Amount too large'
    ),
  currency: z.string()
    .length(3, 'Currency must be 3-letter ISO code')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase ISO code (e.g., USD, EUR)'),
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description too long (max 500 characters)')
    .trim(),
  category: z.enum([
    'food',
    'transport',
    'accommodation',
    'entertainment',
    'shopping',
    'utilities',
    'other',
  ]),
  expense_date: z.string()
    .datetime('Invalid date format')
    .or(z.date()),
  paid_by_user_id: z.string()
    .uuid('Invalid user ID'),
  created_by_user_id: z.string()
    .uuid('Invalid user ID'),
});

export const expenseUpdateSchema = expenseSchema.partial();

// ============================================================================
// PARTICIPANT SCHEMAS
// ============================================================================

export const participantSchema = z.object({
  id: z.string().uuid('Invalid participant ID'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .trim(),
  email: z.string()
    .email('Invalid email address')
    .optional()
    .nullable(),
  phone: z.string()
    .max(20, 'Phone too long')
    .optional()
    .nullable(),
  created_by_user_id: z.string().uuid('Invalid user ID'),
});

export const expenseParticipantSchema = z.object({
  expense_id: z.string().uuid('Invalid expense ID'),
  user_id: z.string().uuid('Invalid user ID').optional().nullable(),
  participant_id: z.string().uuid('Invalid participant ID').optional().nullable(),
}).refine(
  (data) => data.user_id || data.participant_id,
  'Either user_id or participant_id must be provided'
);

// ============================================================================
// SPLIT SCHEMAS
// ============================================================================

export const splitSchema = z.object({
  expense_id: z.string().uuid('Invalid expense ID'),
  user_id: z.string().uuid('Invalid user ID').optional().nullable(),
  participant_id: z.string().uuid('Invalid participant ID').optional().nullable(),
  amount: z.number()
    .nonnegative('Split amount cannot be negative')
    .finite('Split amount must be valid')
    .refine(
      (val) => Number.isFinite(val) && val <= 999999999.99,
      'Split amount too large'
    ),
  percentage: z.number()
    .min(0, 'Percentage cannot be negative')
    .max(100, 'Percentage cannot exceed 100')
    .optional()
    .nullable(),
  shares: z.number()
    .int('Shares must be an integer')
    .positive('Shares must be positive')
    .optional()
    .nullable(),
}).refine(
  (data) => data.user_id || data.participant_id,
  'Either user_id or participant_id must be provided'
);

// Validate that splits sum to expense total
export const validateSplitsSum = (splits: { amount: number }[], expenseTotal: number) => {
  const sum = splits.reduce((acc, split) => acc + split.amount, 0);
  const difference = Math.abs(sum - expenseTotal);

  // Allow 0.01 difference for rounding errors
  if (difference > 0.01) {
    throw new Error(
      `Splits sum (${sum.toFixed(2)}) does not match expense total (${expenseTotal.toFixed(2)})`
    );
  }

  return true;
};

// ============================================================================
// SETTLEMENT SCHEMAS
// ============================================================================

export const settlementSchema = z.object({
  from_user_id: z.string().uuid('Invalid user ID'),
  to_user_id: z.string().uuid('Invalid user ID'),
  amount: z.number()
    .positive('Settlement amount must be positive')
    .finite('Settlement amount must be valid'),
  currency: z.string()
    .length(3, 'Currency must be 3-letter ISO code')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase'),
  settlement_date: z.string()
    .datetime('Invalid date format')
    .or(z.date()),
  notes: z.string()
    .max(500, 'Notes too long')
    .optional()
    .nullable(),
}).refine(
  (data) => data.from_user_id !== data.to_user_id,
  'Cannot settle with yourself'
);

// ============================================================================
// TAG SCHEMAS
// ============================================================================

export const tagSchema = z.object({
  tag: z.string()
    .min(1, 'Tag cannot be empty')
    .max(50, 'Tag too long (max 50 characters)')
    .regex(/^[a-zA-Z0-9-_\s]+$/, 'Tag contains invalid characters')
    .trim()
    .transform((val) => val.toLowerCase()),
  expense_id: z.string().uuid('Invalid expense ID'),
});

// ============================================================================
// INVITE SCHEMAS
// ============================================================================

export const inviteSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email too long'),
  participant_id: z.string().uuid('Invalid participant ID'),
  invited_by_user_id: z.string().uuid('Invalid user ID'),
});

// ============================================================================
// TEMPLATE SCHEMAS
// ============================================================================

export const templateSchema = z.object({
  name: z.string()
    .min(1, 'Template name is required')
    .max(100, 'Template name too long')
    .trim(),
  description: z.string()
    .max(500, 'Description too long')
    .optional()
    .nullable(),
  split_method: z.enum(['equal', 'percentage', 'shares', 'exact']),
  created_by_user_id: z.string().uuid('Invalid user ID'),
});

// ============================================================================
// PROFILE SCHEMAS
// ============================================================================

export const profileSchema = z.object({
  display_name: z.string()
    .min(1, 'Name is required')
    .max(50, 'Name too long (max 50 characters)')
    .trim(),
  avatar_url: z.string()
    .url('Invalid avatar URL')
    .optional()
    .nullable(),
  currency_preference: z.string()
    .length(3, 'Currency must be 3-letter ISO code')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase ISO code'),
});

export const profileUpdateSchema = profileSchema.partial();

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ExpenseInput = z.infer<typeof expenseSchema>;
export type ParticipantInput = z.infer<typeof participantSchema>;
export type SplitInput = z.infer<typeof splitSchema>;
export type SettlementInput = z.infer<typeof settlementSchema>;
export type TagInput = z.infer<typeof tagSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
export type TemplateInput = z.infer<typeof templateSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
