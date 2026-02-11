import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ExpenseCreateInput, OfflineExpense } from '@/lib/db/types';

// Mock the optimistic update manager module
vi.mock('@/lib/offline/optimistic', () => ({
  optimisticUpdateManager: {
    createExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
  },
}));

import { useOptimisticMutation } from './useOptimisticMutation';
import { optimisticUpdateManager } from '@/lib/offline/optimistic';

const mockManager = vi.mocked(optimisticUpdateManager);

const makeExpenseInput = (overrides: Partial<ExpenseCreateInput> = {}): ExpenseCreateInput => ({
  amount: 42.5,
  currency: 'AUD',
  description: 'Test expense',
  category: 'food',
  expense_date: '2025-01-15',
  created_by_user_id: 'user-1',
  ...overrides,
});

describe('useOptimisticMutation', () => {
  beforeEach(() => {
    vi.mocked(mockManager.createExpense).mockReset();
    vi.mocked(mockManager.updateExpense).mockReset();
    vi.mocked(mockManager.deleteExpense).mockReset();
  });

  // --- Initial state ---

  it('starts with idle state', () => {
    const { result } = renderHook(() => useOptimisticMutation());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });

  // --- createExpense ---

  describe('createExpense', () => {
    it('sets isLoading to true while creating', async () => {
      let resolveCreate: (value: string) => void;
      vi.mocked(mockManager.createExpense).mockImplementation(
        () => new Promise((resolve) => { resolveCreate = resolve; })
      );

      const { result } = renderHook(() => useOptimisticMutation());

      let createPromise: Promise<string>;
      act(() => {
        createPromise = result.current.createExpense(makeExpenseInput());
      });

      // Should be loading while promise is pending
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();

      // Resolve
      await act(async () => {
        resolveCreate!('new-expense-id');
        await createPromise!;
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual({ id: 'new-expense-id' });
      expect(result.current.error).toBeNull();
    });

    it('returns the created expense id', async () => {
      vi.mocked(mockManager.createExpense).mockResolvedValue('expense-123');

      const { result } = renderHook(() => useOptimisticMutation());

      let returnedId: string | undefined;
      await act(async () => {
        returnedId = await result.current.createExpense(makeExpenseInput());
      });

      expect(returnedId).toBe('expense-123');
      expect(result.current.data).toEqual({ id: 'expense-123' });
    });

    it('passes the expense input to the manager', async () => {
      vi.mocked(mockManager.createExpense).mockResolvedValue('expense-123');

      const { result } = renderHook(() => useOptimisticMutation());
      const input = makeExpenseInput({ description: 'Fancy dinner' });

      await act(async () => {
        await result.current.createExpense(input);
      });

      expect(mockManager.createExpense).toHaveBeenCalledWith(input);
    });

    it('sets error state on failure and throws', async () => {
      vi.mocked(mockManager.createExpense).mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useOptimisticMutation());

      await act(async () => {
        await expect(result.current.createExpense(makeExpenseInput())).rejects.toThrow('Create failed');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error!.message).toBe('Create failed');
      expect(result.current.data).toBeNull();
    });

    it('wraps non-Error rejections in an Error', async () => {
      vi.mocked(mockManager.createExpense).mockRejectedValue('string failure');

      const { result } = renderHook(() => useOptimisticMutation());

      await act(async () => {
        try {
          await result.current.createExpense(makeExpenseInput());
        } catch {
          // expected
        }
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error!.message).toBe('string failure');
    });
  });

  // --- updateExpense ---

  describe('updateExpense', () => {
    it('updates expense and sets data with the id', async () => {
      vi.mocked(mockManager.updateExpense).mockResolvedValue(undefined);

      const { result } = renderHook(() => useOptimisticMutation());

      await act(async () => {
        await result.current.updateExpense('expense-123', { amount: 99 } as Partial<OfflineExpense>);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual({ id: 'expense-123' });
      expect(result.current.error).toBeNull();
      expect(mockManager.updateExpense).toHaveBeenCalledWith('expense-123', { amount: 99 });
    });

    it('sets isLoading during update', async () => {
      let resolveUpdate: () => void;
      vi.mocked(mockManager.updateExpense).mockImplementation(
        () => new Promise((resolve) => { resolveUpdate = resolve; })
      );

      const { result } = renderHook(() => useOptimisticMutation());

      let updatePromise: Promise<void>;
      act(() => {
        updatePromise = result.current.updateExpense('exp-1', { amount: 50 } as Partial<OfflineExpense>);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveUpdate!();
        await updatePromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('sets error state on failure and throws', async () => {
      vi.mocked(mockManager.updateExpense).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useOptimisticMutation());

      await act(async () => {
        await expect(
          result.current.updateExpense('exp-1', { amount: 50 } as Partial<OfflineExpense>)
        ).rejects.toThrow('Update failed');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error!.message).toBe('Update failed');
      expect(result.current.data).toBeNull();
    });
  });

  // --- deleteExpense ---

  describe('deleteExpense', () => {
    it('deletes expense and sets data with the id', async () => {
      vi.mocked(mockManager.deleteExpense).mockResolvedValue(undefined);

      const { result } = renderHook(() => useOptimisticMutation());

      await act(async () => {
        await result.current.deleteExpense('expense-456');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual({ id: 'expense-456' });
      expect(result.current.error).toBeNull();
      expect(mockManager.deleteExpense).toHaveBeenCalledWith('expense-456');
    });

    it('sets isLoading during delete', async () => {
      let resolveDelete: () => void;
      vi.mocked(mockManager.deleteExpense).mockImplementation(
        () => new Promise((resolve) => { resolveDelete = resolve; })
      );

      const { result } = renderHook(() => useOptimisticMutation());

      let deletePromise: Promise<void>;
      act(() => {
        deletePromise = result.current.deleteExpense('exp-1');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveDelete!();
        await deletePromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('sets error state on failure and throws', async () => {
      vi.mocked(mockManager.deleteExpense).mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useOptimisticMutation());

      await act(async () => {
        await expect(result.current.deleteExpense('exp-1')).rejects.toThrow('Delete failed');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error!.message).toBe('Delete failed');
      expect(result.current.data).toBeNull();
    });
  });

  // --- reset ---

  describe('reset', () => {
    it('clears error and data state back to initial', async () => {
      vi.mocked(mockManager.createExpense).mockResolvedValue('exp-1');

      const { result } = renderHook(() => useOptimisticMutation());

      // Perform a successful create to populate data
      await act(async () => {
        await result.current.createExpense(makeExpenseInput());
      });

      expect(result.current.data).toEqual({ id: 'exp-1' });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();
    });

    it('clears error state after a failed operation', async () => {
      vi.mocked(mockManager.deleteExpense).mockRejectedValue(new Error('Oops'));

      const { result } = renderHook(() => useOptimisticMutation());

      await act(async () => {
        try {
          await result.current.deleteExpense('exp-1');
        } catch {
          // expected
        }
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  // --- Sequential operations ---

  describe('sequential operations', () => {
    it('state from a new operation replaces state from a previous one', async () => {
      vi.mocked(mockManager.createExpense).mockResolvedValue('exp-1');
      vi.mocked(mockManager.deleteExpense).mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useOptimisticMutation());

      // Successful create
      await act(async () => {
        await result.current.createExpense(makeExpenseInput());
      });

      expect(result.current.data).toEqual({ id: 'exp-1' });
      expect(result.current.error).toBeNull();

      // Failed delete replaces previous state
      await act(async () => {
        try {
          await result.current.deleteExpense('exp-1');
        } catch {
          // expected
        }
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error!.message).toBe('Delete failed');
    });
  });
});
