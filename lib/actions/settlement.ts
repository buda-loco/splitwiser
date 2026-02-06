'use server';

import { createSettlement } from '@/lib/db/stores';
import type { Settlement } from '@/lib/db/types';

/**
 * Input type for settlement submission
 */
export type SubmitSettlementInput = {
  from_user_id?: string | null;
  from_participant_id?: string | null;
  to_user_id?: string | null;
  to_participant_id?: string | null;
  amount: number;
  currency: string;
  settlement_date: string;
  settlement_type: 'global' | 'tag_specific' | 'partial';
  tag?: string | null;
  created_by_user_id: string;
};

/**
 * Result type for settlement submission
 */
export type SubmitSettlementResult =
  | { success: true; id: string }
  | { success: false; error: string };

/**
 * Submit a new settlement record
 *
 * Server action for recording when debts are paid back.
 * Validates inputs and creates Settlement record in IndexedDB.
 *
 * @param input Settlement data (from/to persons, amount, currency, date, type)
 * @returns Result with settlement ID or error message
 */
export async function submitSettlement(
  input: SubmitSettlementInput
): Promise<SubmitSettlementResult> {
  try {
    // Validate from person
    if (!input.from_user_id && !input.from_participant_id) {
      return {
        success: false,
        error: 'From person is required (either user_id or participant_id)'
      };
    }

    if (input.from_user_id && input.from_participant_id) {
      return {
        success: false,
        error: 'Cannot specify both from_user_id and from_participant_id'
      };
    }

    // Validate to person
    if (!input.to_user_id && !input.to_participant_id) {
      return {
        success: false,
        error: 'To person is required (either user_id or participant_id)'
      };
    }

    if (input.to_user_id && input.to_participant_id) {
      return {
        success: false,
        error: 'Cannot specify both to_user_id and to_participant_id'
      };
    }

    // Validate from and to are different
    if (
      (input.from_user_id && input.from_user_id === input.to_user_id) ||
      (input.from_participant_id && input.from_participant_id === input.to_participant_id)
    ) {
      return {
        success: false,
        error: 'From and To must be different people'
      };
    }

    // Validate amount
    if (!input.amount || input.amount <= 0) {
      return {
        success: false,
        error: 'Amount must be greater than 0'
      };
    }

    // Validate currency
    if (!input.currency || input.currency.trim() === '') {
      return {
        success: false,
        error: 'Currency is required'
      };
    }

    // Validate settlement_date
    if (!input.settlement_date) {
      return {
        success: false,
        error: 'Settlement date is required'
      };
    }

    const settlementDate = new Date(input.settlement_date);
    const now = new Date();
    if (settlementDate > now) {
      return {
        success: false,
        error: 'Settlement date cannot be in the future'
      };
    }

    // Validate settlement_type
    if (!['global', 'tag_specific', 'partial'].includes(input.settlement_type)) {
      return {
        success: false,
        error: 'Invalid settlement type'
      };
    }

    // Validate tag for tag_specific settlements
    if (input.settlement_type === 'tag_specific' && !input.tag) {
      return {
        success: false,
        error: 'Tag is required for tag-specific settlements'
      };
    }

    // Validate created_by_user_id
    if (!input.created_by_user_id) {
      return {
        success: false,
        error: 'Created by user ID is required'
      };
    }

    // Create settlement record
    const settlementData: Omit<Settlement, 'id' | 'created_at'> = {
      from_user_id: input.from_user_id || null,
      from_participant_id: input.from_participant_id || null,
      to_user_id: input.to_user_id || null,
      to_participant_id: input.to_participant_id || null,
      amount: input.amount,
      currency: input.currency,
      settlement_type: input.settlement_type,
      tag: input.tag || null,
      settlement_date: input.settlement_date,
      created_by_user_id: input.created_by_user_id,
    };

    const settlementId = await createSettlement(settlementData);

    return {
      success: true,
      id: settlementId
    };
  } catch (error) {
    console.error('Error submitting settlement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit settlement'
    };
  }
}
