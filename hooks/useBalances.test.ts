import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BalanceResult } from '@/lib/balances/types';

// Mock the balance calculator module
vi.mock('@/lib/balances/calculator', () => ({
  calculateBalances: vi.fn(),
}));

import { useBalances } from './useBalances';
import { calculateBalances } from '@/lib/balances/calculator';

const mockCalculateBalances = vi.mocked(calculateBalances);

const makeBalanceResult = (overrides: Partial<BalanceResult> = {}): BalanceResult => ({
  balances: [],
  total_expenses: 100,
  currency: 'AUD',
  ...overrides,
});

describe('useBalances', () => {
  beforeEach(() => {
    mockCalculateBalances.mockReset();
  });

  it('starts in loading state with null balances', () => {
    mockCalculateBalances.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useBalances());

    expect(result.current.loading).toBe(true);
    expect(result.current.balances).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('loads balances on mount and sets loading to false', async () => {
    const balanceResult = makeBalanceResult({ total_expenses: 250 });
    mockCalculateBalances.mockResolvedValue(balanceResult);

    const { result } = renderHook(() => useBalances());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.balances).toEqual(balanceResult);
    expect(result.current.error).toBeNull();
    expect(mockCalculateBalances).toHaveBeenCalledWith({
      simplified: false,
      targetCurrency: 'AUD',
    });
  });

  it('sets error state on failure and clears balances', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCalculateBalances.mockRejectedValue(new Error('Calculation failed'));

    const { result } = renderHook(() => useBalances());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.balances).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('Calculation failed');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('wraps non-Error rejections in an Error object', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCalculateBalances.mockRejectedValue('string error');

    const { result } = renderHook(() => useBalances());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('string error');
    consoleSpy.mockRestore();
  });

  it('defaults to simplified=false and targetCurrency=AUD', async () => {
    mockCalculateBalances.mockResolvedValue(makeBalanceResult());

    const { result } = renderHook(() => useBalances());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.simplified).toBe(false);
    expect(result.current.targetCurrency).toBe('AUD');
  });

  it('recalculates when simplified is toggled', async () => {
    mockCalculateBalances.mockResolvedValue(makeBalanceResult());

    const { result } = renderHook(() => useBalances());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockCalculateBalances).toHaveBeenCalledTimes(1);

    // Toggle simplified on
    mockCalculateBalances.mockResolvedValue(makeBalanceResult({ total_expenses: 999 }));

    act(() => {
      result.current.setSimplified(true);
    });

    await waitFor(() => {
      expect(result.current.balances?.total_expenses).toBe(999);
    });

    expect(mockCalculateBalances).toHaveBeenCalledWith({
      simplified: true,
      targetCurrency: 'AUD',
    });
  });

  it('recalculates when targetCurrency changes', async () => {
    mockCalculateBalances.mockResolvedValue(makeBalanceResult());

    const { result } = renderHook(() => useBalances());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockCalculateBalances.mockResolvedValue(makeBalanceResult({ currency: 'USD' }));

    act(() => {
      result.current.setTargetCurrency('USD');
    });

    await waitFor(() => {
      expect(result.current.balances?.currency).toBe('USD');
    });

    expect(mockCalculateBalances).toHaveBeenCalledWith({
      simplified: false,
      targetCurrency: 'USD',
    });
  });

  it('refresh function triggers recalculation', async () => {
    mockCalculateBalances.mockResolvedValue(makeBalanceResult());

    const { result } = renderHook(() => useBalances());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callCountBefore = mockCalculateBalances.mock.calls.length;

    mockCalculateBalances.mockResolvedValue(makeBalanceResult({ total_expenses: 500 }));

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.balances?.total_expenses).toBe(500);
    });

    expect(mockCalculateBalances).toHaveBeenCalledTimes(callCountBefore + 1);
  });

  it('recalculates when settlement-created event is dispatched', async () => {
    mockCalculateBalances.mockResolvedValue(makeBalanceResult());

    const { result } = renderHook(() => useBalances());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callCountBefore = mockCalculateBalances.mock.calls.length;

    mockCalculateBalances.mockResolvedValue(makeBalanceResult({ total_expenses: 777 }));

    act(() => {
      window.dispatchEvent(new Event('settlement-created'));
    });

    await waitFor(() => {
      expect(result.current.balances?.total_expenses).toBe(777);
    });

    expect(mockCalculateBalances).toHaveBeenCalledTimes(callCountBefore + 1);
  });

  it('recalculates when settlement-deleted event is dispatched', async () => {
    mockCalculateBalances.mockResolvedValue(makeBalanceResult());

    const { result } = renderHook(() => useBalances());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callCountBefore = mockCalculateBalances.mock.calls.length;

    mockCalculateBalances.mockResolvedValue(makeBalanceResult({ total_expenses: 333 }));

    act(() => {
      window.dispatchEvent(new Event('settlement-deleted'));
    });

    await waitFor(() => {
      expect(result.current.balances?.total_expenses).toBe(333);
    });

    expect(mockCalculateBalances).toHaveBeenCalledTimes(callCountBefore + 1);
  });

  it('cleans up event listeners on unmount', async () => {
    mockCalculateBalances.mockResolvedValue(makeBalanceResult());

    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useBalances());

    await waitFor(() => {});

    // Verify listeners were added
    const settlementCreatedAdds = addSpy.mock.calls.filter(c => c[0] === 'settlement-created');
    const settlementDeletedAdds = addSpy.mock.calls.filter(c => c[0] === 'settlement-deleted');
    expect(settlementCreatedAdds.length).toBeGreaterThan(0);
    expect(settlementDeletedAdds.length).toBeGreaterThan(0);

    unmount();

    // Verify listeners were removed
    const settlementCreatedRemoves = removeSpy.mock.calls.filter(c => c[0] === 'settlement-created');
    const settlementDeletedRemoves = removeSpy.mock.calls.filter(c => c[0] === 'settlement-deleted');
    expect(settlementCreatedRemoves.length).toBeGreaterThan(0);
    expect(settlementDeletedRemoves.length).toBeGreaterThan(0);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('clears error state when a subsequent load succeeds', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // First: fail
    mockCalculateBalances.mockRejectedValueOnce(new Error('Temporary failure'));

    const { result } = renderHook(() => useBalances());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    // Now succeed on refresh
    mockCalculateBalances.mockResolvedValue(makeBalanceResult());

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.balances).not.toBeNull();
    });

    consoleSpy.mockRestore();
  });
});
