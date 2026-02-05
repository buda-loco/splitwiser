/**
 * Types for balance calculation engine
 *
 * These types support the hybrid account model where persons can be identified
 * by either user_id (registered users) or participant_id (non-registered participants).
 */

/**
 * Person identifier for hybrid account model
 *
 * A person can be:
 * - A registered user (user_id is set, participant_id is null)
 * - A non-registered participant (participant_id is set, user_id is null)
 *
 * Name is included for display purposes in UI.
 */
export type PersonIdentifier = {
  user_id: string | null;
  participant_id: string | null;
  name: string;  // For display
};

/**
 * Balance entry showing a debt between two people
 *
 * Represents a direct debt: "from" owes "to" the specified amount.
 * This is the non-simplified view that shows actual expense relationships.
 */
export type BalanceEntry = {
  from: PersonIdentifier;
  to: PersonIdentifier;
  amount: number;
  currency: string;
};

/**
 * Result of balance calculation
 *
 * Contains all balance entries (direct debts) for a given set of expenses,
 * along with summary information like total expenses and primary currency.
 */
export type BalanceResult = {
  balances: BalanceEntry[];
  total_expenses: number;
  currency: string;  // Primary currency for this result
};
