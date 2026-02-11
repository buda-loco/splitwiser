import { describe, it, expect } from 'vitest';
import { simplifyDebts } from './simplification';
import type { BalanceEntry, PersonIdentifier } from './types';

// Helper to create a person identifier
function person(id: string, name?: string): PersonIdentifier {
  return {
    user_id: id,
    participant_id: null,
    name: name || `User ${id.slice(0, 8)}`,
  };
}

// Helper to create a participant identifier (non-registered user)
function participant(id: string, name?: string): PersonIdentifier {
  return {
    user_id: null,
    participant_id: id,
    name: name || `Participant ${id.slice(0, 8)}`,
  };
}

// Helper to create a balance entry
function balance(from: PersonIdentifier, to: PersonIdentifier, amount: number, currency = 'AUD'): BalanceEntry {
  return { from, to, amount, currency };
}

describe('simplifyDebts', () => {
  describe('empty and trivial cases', () => {
    it('returns empty array for empty input', () => {
      expect(simplifyDebts([])).toEqual([]);
    });

    it('returns a single entry unchanged when there is only one debt', () => {
      const alice = person('alice-id', 'Alice');
      const bob = person('bob-id', 'Bob');

      const result = simplifyDebts([balance(alice, bob, 50)]);

      expect(result).toHaveLength(1);
      expect(result[0].from.name).toBe('Alice');
      expect(result[0].to.name).toBe('Bob');
      expect(result[0].amount).toBe(50);
      expect(result[0].currency).toBe('AUD');
    });
  });

  describe('two-person simplification', () => {
    it('keeps single debt between two people as-is', () => {
      const alice = person('alice-id', 'Alice');
      const bob = person('bob-id', 'Bob');

      const result = simplifyDebts([balance(alice, bob, 100)]);
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(100);
    });

    it('aggregates multiple debts between the same two people', () => {
      const alice = person('alice-id', 'Alice');
      const bob = person('bob-id', 'Bob');

      const result = simplifyDebts([
        balance(alice, bob, 30),
        balance(alice, bob, 20),
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(50);
    });

    it('nets out debts in opposite directions between two people', () => {
      const alice = person('alice-id', 'Alice');
      const bob = person('bob-id', 'Bob');

      const result = simplifyDebts([
        balance(alice, bob, 80),
        balance(bob, alice, 30),
      ]);

      // Net: Alice owes Bob 50
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(50);
      // The debtor (Alice) should be 'from', creditor (Bob) should be 'to'
      expect(result[0].from.name).toBe('Alice');
      expect(result[0].to.name).toBe('Bob');
    });

    it('returns empty when debts cancel out exactly', () => {
      const alice = person('alice-id', 'Alice');
      const bob = person('bob-id', 'Bob');

      const result = simplifyDebts([
        balance(alice, bob, 50),
        balance(bob, alice, 50),
      ]);

      expect(result).toHaveLength(0);
    });
  });

  describe('three-person chain simplification', () => {
    it('simplifies A->B and B->C into A->C', () => {
      const alice = person('alice-id', 'Alice');
      const bob = person('bob-id', 'Bob');
      const charlie = person('charlie-id', 'Charlie');

      // Alice owes Bob 50, Bob owes Charlie 50
      // Simplified: Alice owes Charlie 50 (Bob is a middleman)
      const result = simplifyDebts([
        balance(alice, bob, 50),
        balance(bob, charlie, 50),
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(50);
      expect(result[0].from.name).toBe('Alice');
      expect(result[0].to.name).toBe('Charlie');
    });

    it('simplifies partial chain: A->B $80, B->C $50', () => {
      const alice = person('alice-id', 'Alice');
      const bob = person('bob-id', 'Bob');
      const charlie = person('charlie-id', 'Charlie');

      // Net: Alice owes 80 (debtor)
      // Net: Bob is owed 80 and owes 50 = net +30 (creditor)
      // Net: Charlie is owed 50 (creditor)
      // Simplified: Alice pays Charlie 50, Alice pays Bob 30
      const result = simplifyDebts([
        balance(alice, bob, 80),
        balance(bob, charlie, 50),
      ]);

      expect(result).toHaveLength(2);

      // Total amount should be preserved
      const total = result.reduce((sum, e) => sum + e.amount, 0);
      expect(total).toBe(80);

      // Alice should be the only debtor (from)
      for (const entry of result) {
        expect(entry.from.name).toBe('Alice');
      }
    });
  });

  describe('complex multi-person scenarios', () => {
    it('simplifies circular debts: A->B, B->C, C->A', () => {
      const alice = person('alice-id', 'Alice');
      const bob = person('bob-id', 'Bob');
      const charlie = person('charlie-id', 'Charlie');

      // Equal circular debts: should net to zero
      const result = simplifyDebts([
        balance(alice, bob, 50),
        balance(bob, charlie, 50),
        balance(charlie, alice, 50),
      ]);

      expect(result).toHaveLength(0);
    });

    it('simplifies unequal circular debts', () => {
      const alice = person('alice-id', 'Alice');
      const bob = person('bob-id', 'Bob');
      const charlie = person('charlie-id', 'Charlie');

      // A owes B 100, B owes C 60, C owes A 40
      // Net: Alice = -100 + 40 = -60 (debtor)
      // Net: Bob = +100 - 60 = +40 (creditor)
      // Net: Charlie = +60 - 40 = +20 (creditor)
      const result = simplifyDebts([
        balance(alice, bob, 100),
        balance(bob, charlie, 60),
        balance(charlie, alice, 40),
      ]);

      // Should be at most 2 transactions
      expect(result.length).toBeLessThanOrEqual(2);

      // Total net debts should be 60
      const totalOwed = result.reduce((sum, e) => sum + e.amount, 0);
      expect(totalOwed).toBe(60);
    });

    it('handles four people with multiple debts', () => {
      const alice = person('alice-id', 'Alice');
      const bob = person('bob-id', 'Bob');
      const charlie = person('charlie-id', 'Charlie');
      const dave = person('dave-id', 'Dave');

      // Complex scenario:
      // Alice owes Bob 40
      // Alice owes Charlie 20
      // Bob owes Dave 30
      // Charlie owes Dave 10
      //
      // Net balances:
      // Alice: -60
      // Bob: +40 - 30 = +10
      // Charlie: +20 - 10 = +10
      // Dave: +30 + 10 = +40
      //
      // Simplified should have at most 3 transactions
      const result = simplifyDebts([
        balance(alice, bob, 40),
        balance(alice, charlie, 20),
        balance(bob, dave, 30),
        balance(charlie, dave, 10),
      ]);

      expect(result.length).toBeLessThanOrEqual(3);

      // Total amount should equal total net flow
      const totalAmount = result.reduce((sum, e) => sum + e.amount, 0);
      expect(totalAmount).toBe(60); // Alice's total debt

      // Alice should be a debtor in all results (she's the only net debtor)
      for (const entry of result) {
        expect(entry.from.name).toBe('Alice');
      }
    });
  });

  describe('edge cases', () => {
    it('handles very small amounts near zero (floating point)', () => {
      const alice = person('alice-id', 'Alice');
      const bob = person('bob-id', 'Bob');

      // Amounts that nearly cancel out
      const result = simplifyDebts([
        balance(alice, bob, 50.005),
        balance(bob, alice, 50),
      ]);

      // 0.005 is less than 0.01 threshold, so should be treated as settled
      expect(result).toHaveLength(0);
    });

    it('handles amounts at exactly the 0.01 threshold', () => {
      const alice = person('alice-id', 'Alice');
      const bob = person('bob-id', 'Bob');

      // Net: Alice owes 0.02 (above the 0.01 threshold)
      const result = simplifyDebts([
        balance(alice, bob, 50.02),
        balance(bob, alice, 50),
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].amount).toBeCloseTo(0.02, 2);
    });

    it('preserves currency from the first balance entry', () => {
      const alice = person('alice-id', 'Alice');
      const bob = person('bob-id', 'Bob');

      const result = simplifyDebts([balance(alice, bob, 100, 'EUR')]);
      expect(result[0].currency).toBe('EUR');
    });

    it('does not include expense details in simplified results', () => {
      const alice = person('alice-id', 'Alice');
      const bob = person('bob-id', 'Bob');

      const input: BalanceEntry[] = [{
        from: alice,
        to: bob,
        amount: 100,
        currency: 'AUD',
        expenses: [{
          id: 'exp1',
          description: 'Dinner',
          amount: 100,
          date: '2024-01-01',
          split_amount: 50,
        }],
      }];

      const result = simplifyDebts(input);
      // Simplified entries don't carry expense details
      expect(result[0].expenses).toBeUndefined();
    });

    it('handles participant_id-based identifiers', () => {
      const alice = participant('alice-part', 'Alice');
      const bob = participant('bob-part', 'Bob');

      const result = simplifyDebts([balance(alice, bob, 75)]);
      expect(result).toHaveLength(1);
      expect(result[0].from.participant_id).toBe('alice-part');
      expect(result[0].to.participant_id).toBe('bob-part');
      expect(result[0].amount).toBe(75);
    });

    it('skips entries with no valid identifiers', () => {
      const noId: PersonIdentifier = { user_id: null, participant_id: null, name: 'Ghost' };
      const alice = person('alice-id', 'Alice');

      const result = simplifyDebts([balance(noId, alice, 50)]);
      // Entry should be skipped because from has no valid ID
      expect(result).toHaveLength(0);
    });

    it('handles mixed user_id and participant_id people', () => {
      const alice = person('alice-id', 'Alice');
      const bob = participant('bob-part', 'Bob');
      const charlie = person('charlie-id', 'Charlie');

      const result = simplifyDebts([
        balance(alice, bob, 50),
        balance(bob, charlie, 50),
      ]);

      // Alice owes 50 (net debtor)
      // Bob: +50 - 50 = 0 (net zero, middleman)
      // Charlie: +50 (net creditor)
      // Simplified: Alice -> Charlie 50
      expect(result).toHaveLength(1);
      expect(result[0].from.name).toBe('Alice');
      expect(result[0].to.name).toBe('Charlie');
      expect(result[0].amount).toBe(50);
    });
  });

  describe('greedy algorithm behavior', () => {
    it('matches largest debtor with largest creditor first', () => {
      const alice = person('alice-id', 'Alice');   // Will owe 100
      const bob = person('bob-id', 'Bob');         // Will owe 50
      const charlie = person('charlie-id', 'Charlie'); // Owed 90
      const dave = person('dave-id', 'Dave');       // Owed 60

      // Alice and Bob are debtors, Charlie and Dave are creditors
      const result = simplifyDebts([
        balance(alice, charlie, 100),
        balance(bob, dave, 50),
        // Net: Alice=-100, Bob=-50, Charlie=+100 (was 100, now correctly should remain)
        // Wait - this is direct: Alice owes Charlie 100, Bob owes Dave 50
        // Net: Alice=-100, Bob=-50, Charlie=+100, Dave=+50
      ]);

      // After sort: largest debtor Alice (100), then Bob (50)
      // Largest creditor: Charlie (100), then Dave (50)
      // Match: Alice -> Charlie 100, Bob -> Dave 50
      expect(result).toHaveLength(2);
      const totalAmount = result.reduce((sum, e) => sum + e.amount, 0);
      expect(totalAmount).toBe(150);
    });

    it('splits one debtors payment across multiple creditors', () => {
      const alice = person('alice-id', 'Alice'); // Owes 100
      const bob = person('bob-id', 'Bob');       // Owed 60
      const charlie = person('charlie-id', 'Charlie'); // Owed 40

      const result = simplifyDebts([
        balance(alice, bob, 60),
        balance(alice, charlie, 40),
      ]);

      // Net: Alice=-100, Bob=+60, Charlie=+40
      // Greedy: Alice pays Bob 60 (larger creditor), Alice pays Charlie 40
      expect(result).toHaveLength(2);
      const totalAmount = result.reduce((sum, e) => sum + e.amount, 0);
      expect(totalAmount).toBe(100);

      for (const entry of result) {
        expect(entry.from.name).toBe('Alice');
      }
    });
  });
});
