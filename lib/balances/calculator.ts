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

import { getExpenses, getExpenseSplits, getExpenseTags, getAllTags } from '@/lib/db/stores';
import type { PersonIdentifier, BalanceEntry, BalanceResult } from './types';
import { simplifyDebts } from './simplification';
import { convertBalances } from '@/lib/currency/exchangeRates';
import type { CurrencyCode } from '@/lib/currency/types';
import { getParticipantDisplayName } from '@/lib/utils/display-name';

/**
 * Net balance result for global settlements
 */
export type NetBalanceResult = {
  amount: number;
  currency: string;
  direction: 'A_owes_B' | 'B_owes_A' | 'settled';
};

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
 * 4. Apply simplification if requested
 * 5. Convert to target currency if specified
 *
 * Edge cases handled:
 * - Person paid and also owes on same expense (subtract their own split)
 * - Multiple expenses between same two people (aggregate all debts)
 * - Multi-currency expenses (calculate per currency, return primary)
 *
 * @param options.simplified - If true, return simplified balances with minimum transactions
 * @param options.targetCurrency - If specified, convert all balances to this currency
 * @returns BalanceResult with direct or simplified balances showing who owes whom
 */
export async function calculateBalances(options?: {
  simplified?: boolean;
  targetCurrency?: CurrencyCode;
}): Promise<BalanceResult> {
  // Fetch all non-deleted expenses
  const expenses = await getExpenses();

  // Track balances per currency
  // Map structure: currency -> personPairKey -> balance entry with expenses
  // personPairKey format: "from_id|to_id"
  const balancesByCurrency = new Map<
    string,
    Map<string, {
      from: PersonIdentifier;
      to: PersonIdentifier;
      amount: number;
      expenses: Array<{
        id: string;
        description: string;
        amount: number;
        date: string;
        split_amount: number;
      }>;
    }>
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
        name: getParticipantDisplayName(split),
      };

      const to: PersonIdentifier = {
        user_id: payerId,
        participant_id: null, // Current implementation only supports user payers
        name: getParticipantDisplayName({ user_id: payerId }),
      };

      // Create person pair key for aggregation
      const pairKey = `${splitPersonId}|${payerId}`;

      // Get or create balance entry
      const currencyBalances = balancesByCurrency.get(currency)!;
      const existing = currencyBalances.get(pairKey);

      // Create expense detail for tracking
      const expenseDetail = {
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        date: expense.expense_date,
        split_amount: split.amount,
      };

      if (existing) {
        // Add to existing debt
        existing.amount += split.amount;
        existing.expenses.push(expenseDetail);
      } else {
        // Create new debt entry
        currencyBalances.set(pairKey, {
          from,
          to,
          amount: split.amount,
          expenses: [expenseDetail],
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
  const directBalances: BalanceEntry[] = [];
  const primaryBalances = balancesByCurrency.get(primaryCurrency);

  if (primaryBalances) {
    for (const entry of primaryBalances.values()) {
      directBalances.push({
        from: entry.from,
        to: entry.to,
        amount: entry.amount,
        currency: primaryCurrency,
        // Only include expenses in direct view (simplified=false)
        expenses: !options?.simplified ? entry.expenses : undefined,
      });
    }
  }

  // Apply simplification if requested
  // Note: Simplified debts lose expense-level detail since they merge multiple debts
  let balances = options?.simplified
    ? simplifyDebts(directBalances)
    : directBalances;

  // Convert to target currency if specified
  let currency = primaryCurrency;
  if (options?.targetCurrency) {
    balances = await convertBalances(balances, options.targetCurrency);
    currency = options.targetCurrency;
  }

  return {
    balances,
    total_expenses: totalsByCurrency.get(primaryCurrency) || 0,
    currency,
  };
}

/**
 * Calculate net balance between two people for global settlements
 *
 * Sums all debts between two people across all expenses and tags,
 * then returns the net amount owed in a single direction.
 *
 * Algorithm:
 * 1. Calculate all balances (direct view, not simplified)
 * 2. Find all debts where A owes B
 * 3. Find all debts where B owes A
 * 4. Calculate net: (A owes B) - (B owes A)
 * 5. If multiple currencies, convert to primary currency
 *
 * @param personA - First person identifier
 * @param personB - Second person identifier
 * @returns Net balance with amount, currency, and direction
 */
export async function calculateNetBalance(
  personA: PersonIdentifier,
  personB: PersonIdentifier
): Promise<NetBalanceResult> {
  // Get all balances in direct view (not simplified)
  const balanceResult = await calculateBalances({ simplified: false });
  const { balances, currency: primaryCurrency } = balanceResult;

  // Helper to check if two PersonIdentifiers match
  const personsMatch = (p1: PersonIdentifier, p2: PersonIdentifier): boolean => {
    if (p1.user_id && p2.user_id) {
      return p1.user_id === p2.user_id;
    }
    if (p1.participant_id && p2.participant_id) {
      return p1.participant_id === p2.participant_id;
    }
    return false;
  };

  // Track balances by currency
  const balancesByCurrency = new Map<string, { aOwesB: number; bOwesA: number }>();

  // Process each balance entry
  for (const balance of balances) {
    const currency = balance.currency;

    // Initialize currency tracking
    if (!balancesByCurrency.has(currency)) {
      balancesByCurrency.set(currency, { aOwesB: 0, bOwesA: 0 });
    }

    const currencyBalances = balancesByCurrency.get(currency)!;

    // Check if this balance involves our two people
    // Case 1: A owes B
    if (personsMatch(balance.from, personA) && personsMatch(balance.to, personB)) {
      currencyBalances.aOwesB += balance.amount;
    }
    // Case 2: B owes A
    else if (personsMatch(balance.from, personB) && personsMatch(balance.to, personA)) {
      currencyBalances.bOwesA += balance.amount;
    }
  }

  // If multiple currencies, convert all to primary currency
  let totalAOwesB = 0;
  let totalBOwesA = 0;

  for (const [currency, { aOwesB, bOwesA }] of balancesByCurrency.entries()) {
    if (currency === primaryCurrency) {
      totalAOwesB += aOwesB;
      totalBOwesA += bOwesA;
    } else {
      // Convert to primary currency
      // Create temporary balance entries for conversion
      const tempBalances: BalanceEntry[] = [];

      if (aOwesB > 0) {
        tempBalances.push({
          from: personA,
          to: personB,
          amount: aOwesB,
          currency,
        });
      }

      if (bOwesA > 0) {
        tempBalances.push({
          from: personB,
          to: personA,
          amount: bOwesA,
          currency,
        });
      }

      // Convert to primary currency
      const converted = await convertBalances(tempBalances, primaryCurrency as CurrencyCode);

      for (const entry of converted) {
        if (personsMatch(entry.from, personA) && personsMatch(entry.to, personB)) {
          totalAOwesB += entry.amount;
        } else if (personsMatch(entry.from, personB) && personsMatch(entry.to, personA)) {
          totalBOwesA += entry.amount;
        }
      }
    }
  }

  // Calculate net balance
  const netAmount = totalAOwesB - totalBOwesA;

  // Determine direction
  let direction: NetBalanceResult['direction'];
  let amount: number;

  if (Math.abs(netAmount) < 0.01) {
    // Settled (within 1 cent tolerance for floating point precision)
    direction = 'settled';
    amount = 0;
  } else if (netAmount > 0) {
    // A owes B
    direction = 'A_owes_B';
    amount = netAmount;
  } else {
    // B owes A
    direction = 'B_owes_A';
    amount = Math.abs(netAmount);
  }

  return {
    amount,
    currency: primaryCurrency,
    direction,
  };
}

/**
 * Calculate balance between two people for a specific tag
 *
 * Only considers expenses that have the specified tag.
 * Similar to calculateNetBalance but filtered to a single tag context.
 *
 * @param personA - First person identifier
 * @param personB - Second person identifier
 * @param tag - Tag to filter expenses by
 * @returns Net balance with amount, currency, and direction for this tag
 */
export async function calculateTagBalance(
  personA: PersonIdentifier,
  personB: PersonIdentifier,
  tag: string
): Promise<NetBalanceResult> {
  const normalizedTag = tag.toLowerCase();

  // Fetch all non-deleted expenses
  const expenses = await getExpenses();

  // Filter expenses to only those with the specified tag
  const taggedExpenseIds = new Set<string>();
  for (const expense of expenses) {
    if (expense.is_deleted) continue;

    const tags = await getExpenseTags(expense.id);
    if (tags.includes(normalizedTag)) {
      taggedExpenseIds.add(expense.id);
    }
  }

  // Track balances by currency
  const balancesByCurrency = new Map<string, { aOwesB: number; bOwesA: number }>();

  // Helper to check if two PersonIdentifiers match
  const personsMatch = (p1: PersonIdentifier, p2: PersonIdentifier): boolean => {
    if (p1.user_id && p2.user_id) {
      return p1.user_id === p2.user_id;
    }
    if (p1.participant_id && p2.participant_id) {
      return p1.participant_id === p2.participant_id;
    }
    return false;
  };

  // Track primary currency (most used currency in tagged expenses)
  const totalsByCurrency = new Map<string, number>();

  // Process each tagged expense
  for (const expense of expenses) {
    if (!taggedExpenseIds.has(expense.id)) continue;

    const currency = expense.currency;
    const payerId = expense.paid_by_user_id;

    if (!payerId) continue;

    // Track totals for primary currency determination
    totalsByCurrency.set(currency, (totalsByCurrency.get(currency) || 0) + expense.amount);

    // Initialize currency tracking
    if (!balancesByCurrency.has(currency)) {
      balancesByCurrency.set(currency, { aOwesB: 0, bOwesA: 0 });
    }

    const currencyBalances = balancesByCurrency.get(currency)!;

    // Get splits for this expense
    const splits = await getExpenseSplits(expense.id);

    // Process each split
    for (const split of splits) {
      const splitPersonId = split.user_id || split.participant_id;

      if (!splitPersonId) continue;
      if (splitPersonId === payerId) continue;

      const from: PersonIdentifier = {
        user_id: split.user_id,
        participant_id: split.participant_id,
        name: getParticipantDisplayName(split),
      };

      const to: PersonIdentifier = {
        user_id: payerId,
        participant_id: null,
        name: getParticipantDisplayName({ user_id: payerId }),
      };

      // Check if this split involves our two people
      // Case 1: A owes B (personA is the split person, personB is the payer)
      if (personsMatch(from, personA) && personsMatch(to, personB)) {
        currencyBalances.aOwesB += split.amount;
      }
      // Case 2: B owes A (personB is the split person, personA is the payer)
      else if (personsMatch(from, personB) && personsMatch(to, personA)) {
        currencyBalances.bOwesA += split.amount;
      }
    }
  }

  // Determine primary currency
  let primaryCurrency = 'AUD';
  let maxExpenses = 0;
  for (const [currency, total] of totalsByCurrency.entries()) {
    if (total > maxExpenses) {
      maxExpenses = total;
      primaryCurrency = currency;
    }
  }

  // Calculate net balance (converting to primary currency if needed)
  let totalAOwesB = 0;
  let totalBOwesA = 0;

  for (const [currency, { aOwesB, bOwesA }] of balancesByCurrency.entries()) {
    if (currency === primaryCurrency) {
      totalAOwesB += aOwesB;
      totalBOwesA += bOwesA;
    } else {
      // Convert to primary currency
      const tempBalances: BalanceEntry[] = [];

      if (aOwesB > 0) {
        tempBalances.push({
          from: personA,
          to: personB,
          amount: aOwesB,
          currency,
        });
      }

      if (bOwesA > 0) {
        tempBalances.push({
          from: personB,
          to: personA,
          amount: bOwesA,
          currency,
        });
      }

      const converted = await convertBalances(tempBalances, primaryCurrency as CurrencyCode);

      for (const entry of converted) {
        if (personsMatch(entry.from, personA) && personsMatch(entry.to, personB)) {
          totalAOwesB += entry.amount;
        } else if (personsMatch(entry.from, personB) && personsMatch(entry.to, personA)) {
          totalBOwesA += entry.amount;
        }
      }
    }
  }

  // Calculate net balance
  const netAmount = totalAOwesB - totalBOwesA;

  // Determine direction
  let direction: NetBalanceResult['direction'];
  let amount: number;

  if (Math.abs(netAmount) < 0.01) {
    direction = 'settled';
    amount = 0;
  } else if (netAmount > 0) {
    direction = 'A_owes_B';
    amount = netAmount;
  } else {
    direction = 'B_owes_A';
    amount = Math.abs(netAmount);
  }

  return {
    amount,
    currency: primaryCurrency,
    direction,
  };
}

/**
 * Get all tags that have balances between two people
 *
 * Returns a list of tags where there are outstanding balances
 * between the two specified people.
 *
 * @param personA - First person identifier
 * @param personB - Second person identifier
 * @returns Array of tags with balance information
 */
export async function getTagsWithBalances(
  personA: PersonIdentifier,
  personB: PersonIdentifier
): Promise<Array<{ tag: string; balance: number; currency: string }>> {
  // Fetch all non-deleted expenses
  const expenses = await getExpenses();

  // Collect all unique tags from expenses
  const allTagsSet = new Set<string>();
  for (const expense of expenses) {
    if (expense.is_deleted) continue;

    const tags = await getExpenseTags(expense.id);
    tags.forEach(tag => allTagsSet.add(tag));
  }

  // Calculate balance for each tag
  const tagsWithBalances: Array<{ tag: string; balance: number; currency: string }> = [];

  for (const tag of Array.from(allTagsSet)) {
    const tagBalance = await calculateTagBalance(personA, personB, tag);

    // Only include tags with non-zero balances
    if (tagBalance.amount > 0.01) {
      tagsWithBalances.push({
        tag,
        balance: tagBalance.amount,
        currency: tagBalance.currency,
      });
    }
  }

  // Sort by balance amount (descending)
  tagsWithBalances.sort((a, b) => b.balance - a.balance);

  return tagsWithBalances;
}

/**
 * Calculate balances for a specific tag context
 *
 * Similar to calculateBalances but only considers expenses with the specified tag.
 * Returns balances showing who owes whom for expenses tagged with this tag.
 *
 * @param tag - Tag to filter expenses by
 * @param options.simplified - If true, return simplified balances
 * @param options.targetCurrency - If specified, convert all balances to this currency
 * @returns BalanceResult with balances for the specified tag
 */
export async function calculateBalancesForTag(
  tag: string,
  options?: {
    simplified?: boolean;
    targetCurrency?: CurrencyCode;
  }
): Promise<BalanceResult> {
  const normalizedTag = tag.toLowerCase();

  // Fetch all non-deleted expenses
  const expenses = await getExpenses();

  // Filter expenses to only those with the specified tag
  const taggedExpenses = [];
  for (const expense of expenses) {
    if (expense.is_deleted) continue;

    const tags = await getExpenseTags(expense.id);
    if (tags.includes(normalizedTag)) {
      taggedExpenses.push(expense);
    }
  }

  // Track balances per currency (same algorithm as calculateBalances)
  const balancesByCurrency = new Map<
    string,
    Map<string, {
      from: PersonIdentifier;
      to: PersonIdentifier;
      amount: number;
      expenses: Array<{
        id: string;
        description: string;
        amount: number;
        date: string;
        split_amount: number;
      }>;
    }>
  >();

  // Track total expenses per currency
  const totalsByCurrency = new Map<string, number>();

  // Process each tagged expense
  for (const expense of taggedExpenses) {
    const currency = expense.currency;
    const payerId = expense.paid_by_user_id;

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

      if (!splitPersonId) continue;
      if (splitPersonId === payerId) continue;

      // Create person identifiers
      const from: PersonIdentifier = {
        user_id: split.user_id,
        participant_id: split.participant_id,
        name: getParticipantDisplayName(split),
      };

      const to: PersonIdentifier = {
        user_id: payerId,
        participant_id: null,
        name: getParticipantDisplayName({ user_id: payerId }),
      };

      // Create person pair key for aggregation
      const pairKey = `${splitPersonId}|${payerId}`;

      // Get or create balance entry
      const currencyBalances = balancesByCurrency.get(currency)!;
      const existing = currencyBalances.get(pairKey);

      // Create expense detail for tracking
      const expenseDetail = {
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        date: expense.expense_date,
        split_amount: split.amount,
      };

      if (existing) {
        // Add to existing debt
        existing.amount += split.amount;
        existing.expenses.push(expenseDetail);
      } else {
        // Create new debt entry
        currencyBalances.set(pairKey, {
          from,
          to,
          amount: split.amount,
          expenses: [expenseDetail],
        });
      }
    }
  }

  // Determine primary currency (most used currency in tagged expenses)
  let primaryCurrency = 'AUD'; // Default
  let maxExpenses = 0;
  for (const [currency, total] of totalsByCurrency.entries()) {
    if (total > maxExpenses) {
      maxExpenses = total;
      primaryCurrency = currency;
    }
  }

  // Convert to balance entries (for primary currency)
  const directBalances: BalanceEntry[] = [];
  const primaryBalances = balancesByCurrency.get(primaryCurrency);

  if (primaryBalances) {
    for (const entry of primaryBalances.values()) {
      directBalances.push({
        from: entry.from,
        to: entry.to,
        amount: entry.amount,
        currency: primaryCurrency,
        // Only include expenses in direct view (simplified=false)
        expenses: !options?.simplified ? entry.expenses : undefined,
      });
    }
  }

  // Apply simplification if requested
  let balances = options?.simplified
    ? simplifyDebts(directBalances)
    : directBalances;

  // Convert to target currency if specified
  let currency = primaryCurrency;
  if (options?.targetCurrency) {
    balances = await convertBalances(balances, options.targetCurrency);
    currency = options.targetCurrency;
  }

  return {
    balances,
    total_expenses: totalsByCurrency.get(primaryCurrency) || 0,
    currency,
  };
}
