/**
 * Balance calculation engine
 *
 * Aggregates all expenses and splits to determine who owes whom across
 * all expenses. This is the foundation for all balance-related features.
 *
 * Key principles:
 * - Tags are organizational, balances are global per person
 * - Calculations work offline-first (local IndexedDB data)
 * - Hybrid account model (user_id OR participant_id)
 * - Multi-currency support (separate balances per currency)
 */

import { getExpenses, getExpenseSplits } from '@/lib/db/stores';
import type { PersonIdentifier, BalanceEntry, BalanceResult } from './types';

/**
 * Calculate balances across all expenses
 *
 * Algorithm:
 * 1. Fetch all non-deleted expenses
 * 2. For each expense:
 *    a. Identify the payer (from expense.paid_by_user_id)
 *    b. Get expense splits (who owes how much)
 *    c. Record debt: each split participant owes the payer their split amount
 * 3. Aggregate all debts per person pair
 * 4. Return direct balances (not simplified)
 *
 * Edge cases handled:
 * - Person paid and also owes on same expense (subtract their own split)
 * - Multiple expenses between same two people (aggregate all debts)
 * - Multi-currency expenses (calculate per currency, return primary)
 *
 * @returns BalanceResult with direct balances showing who owes whom
 */
export async function calculateBalances(): Promise<BalanceResult> {
  // Fetch all non-deleted expenses
  const expenses = await getExpenses();

  // Track balances per currency
  // Map structure: currency -> personPairKey -> amount
  // personPairKey format: "from_id|to_id"
  const balancesByCurrency = new Map<
    string,
    Map<string, { from: PersonIdentifier; to: PersonIdentifier; amount: number }>
  >();

  // Track total expenses per currency
  const totalsByCurrency = new Map<string, number>();

  // Process each expense
  for (const expense of expenses) {
    if (expense.is_deleted) continue;

    const currency = expense.currency;
    const payerId = expense.paid_by_user_id;

    // Skip if no payer identified (shouldn't happen in valid data)
    if (!payerId) continue;

    // Initialize currency tracking
    if (!balancesByCurrency.has(currency)) {
      balancesByCurrency.set(currency, new Map());
    }
    if (!totalsByCurrency.has(currency)) {
      totalsByCurrency.set(currency, 0);
    }

    // Add to total expenses
    totalsByCurrency.set(currency, totalsByCurrency.get(currency)! + expense.amount);

    // Get splits for this expense
    const splits = await getExpenseSplits(expense.id);

    // Process each split
    for (const split of splits) {
      const splitPersonId = split.user_id || split.participant_id;

      // Skip if no person identified
      if (!splitPersonId) continue;

      // Skip if the payer is paying themselves (net zero)
      if (splitPersonId === payerId) continue;

      // Create person identifiers
      const from: PersonIdentifier = {
        user_id: split.user_id,
        participant_id: split.participant_id,
        name: split.user_id ? `User ${split.user_id.slice(0, 8)}` : `Participant ${split.participant_id?.slice(0, 8) || 'Unknown'}`,
      };

      const to: PersonIdentifier = {
        user_id: payerId,
        participant_id: null, // Current implementation only supports user payers
        name: `User ${payerId.slice(0, 8)}`,
      };

      // Create person pair key for aggregation
      const pairKey = `${splitPersonId}|${payerId}`;

      // Get or create balance entry
      const currencyBalances = balancesByCurrency.get(currency)!;
      const existing = currencyBalances.get(pairKey);

      if (existing) {
        // Add to existing debt
        existing.amount += split.amount;
      } else {
        // Create new debt entry
        currencyBalances.set(pairKey, {
          from,
          to,
          amount: split.amount,
        });
      }
    }
  }

  // Determine primary currency (most used currency)
  let primaryCurrency = 'AUD'; // Default
  let maxExpenses = 0;
  for (const [currency, total] of totalsByCurrency.entries()) {
    if (total > maxExpenses) {
      maxExpenses = total;
      primaryCurrency = currency;
    }
  }

  // Convert to balance entries (for primary currency)
  const balances: BalanceEntry[] = [];
  const primaryBalances = balancesByCurrency.get(primaryCurrency);

  if (primaryBalances) {
    for (const entry of primaryBalances.values()) {
      balances.push({
        from: entry.from,
        to: entry.to,
        amount: entry.amount,
        currency: primaryCurrency,
      });
    }
  }

  return {
    balances,
    total_expenses: totalsByCurrency.get(primaryCurrency) || 0,
    currency: primaryCurrency,
  };
}
