/**
 * Debt simplification algorithm
 *
 * Minimizes the number of transactions needed to settle all debts.
 *
 * Example: If A owes B $50 and B owes C $50, simplified to A owes C $50.
 * Result: 2 transactions reduced to 1 transaction.
 *
 * Algorithm (greedy approach):
 * 1. Calculate net balance per person (sum what they owe minus sum what they're owed)
 * 2. Split into creditors (positive balance - owed money) and debtors (negative balance - owes money)
 * 3. Match debtors to creditors greedily (largest debtor to largest creditor)
 * 4. Each match becomes one transaction
 * 5. Continue until all balances zero
 *
 * Why greedy is acceptable: For typical friend groups (3-10 people), greedy produces
 * near-optimal results. The difference between greedy and optimal is usually 0-1 transactions.
 *
 * Key property: Total money owed stays the same. Only the transaction paths change.
 */

import type { BalanceEntry, PersonIdentifier } from './types';

/**
 * Simplify debts to minimize number of transactions
 *
 * Takes direct balances (showing actual expense relationships) and returns
 * simplified balances (showing minimum transactions needed to settle).
 *
 * @param balances - Array of direct balance entries
 * @returns Array of simplified balance entries with minimum transaction count
 */
export function simplifyDebts(balances: BalanceEntry[]): BalanceEntry[] {
  // Handle empty input
  if (balances.length === 0) {
    return [];
  }

  // Step 1: Calculate net balance per person
  // Net = (total owed TO them) - (total they OWE)
  const netBalances = new Map<string, { person: PersonIdentifier; amount: number }>();

  for (const entry of balances) {
    // entry.from owes entry.to entry.amount
    const fromKey = entry.from.user_id || entry.from.participant_id;
    const toKey = entry.to.user_id || entry.to.participant_id;

    // Skip if invalid identifiers
    if (!fromKey || !toKey) continue;

    // Update from's balance (they owe more)
    const fromBalance = netBalances.get(fromKey) || { person: entry.from, amount: 0 };
    fromBalance.amount -= entry.amount;
    netBalances.set(fromKey, fromBalance);

    // Update to's balance (they're owed more)
    const toBalance = netBalances.get(toKey) || { person: entry.to, amount: 0 };
    toBalance.amount += entry.amount;
    netBalances.set(toKey, toBalance);
  }

  // Step 2: Split into creditors and debtors
  const creditors: { person: PersonIdentifier; amount: number }[] = [];
  const debtors: { person: PersonIdentifier; amount: number }[] = [];

  for (const [_, balance] of netBalances) {
    if (balance.amount > 0.01) {
      // Creditor (owed money), use 0.01 to handle floating point
      creditors.push(balance);
    } else if (balance.amount < -0.01) {
      // Debtor (owes money)
      debtors.push({ ...balance, amount: -balance.amount }); // Make amount positive for easier math
    }
    // Ignore balances within 0.01 of zero (rounding errors)
  }

  // Step 3: Sort by amount (largest first) for greedy matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Step 4: Match debtors to creditors
  const simplified: BalanceEntry[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    const settleAmount = Math.min(creditor.amount, debtor.amount);

    simplified.push({
      from: debtor.person,
      to: creditor.person,
      amount: parseFloat(settleAmount.toFixed(2)), // Round to 2 decimals
      currency: balances[0].currency, // Assume all same currency for now
    });

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount < 0.01) creditorIndex++;
    if (debtor.amount < 0.01) debtorIndex++;
  }

  return simplified;
}
