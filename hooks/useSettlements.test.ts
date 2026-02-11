import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Settlement } from '@/lib/db/types';

// Mock the stores module before importing the hook
vi.mock('@/lib/db/stores', () => ({
  getSettlements: vi.fn(),
}));

import { useSettlements } from './useSettlements';
import { getSettlements } from '@/lib/db/stores';

const mockGetSettlements = vi.mocked(getSettlements);

const makeSettlement = (overrides: Partial<Settlement> = {}): Settlement => ({
  id: crypto.randomUUID(),
  from_user_id: 'user-1',
  from_participant_id: null,
  to_user_id: 'user-2',
  to_participant_id: null,
  amount: 50,
  currency: 'AUD',
  settlement_type: 'global',
  tag: null,
  settlement_date: '2025-01-15T00:00:00.000Z',
  created_by_user_id: 'user-1',
  created_at: '2025-01-15T00:00:00.000Z',
  ...overrides,
});

describe('useSettlements', () => {
  beforeEach(() => {
    mockGetSettlements.mockReset();
  });

  it('starts in loading state with empty settlements', () => {
    mockGetSettlements.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useSettlements());

    expect(result.current.loading).toBe(true);
    expect(result.current.settlements).toEqual([]);
  });

  it('fetches settlements on mount and sets loading to false', async () => {
    const settlements = [
      makeSettlement({ id: 's1', settlement_date: '2025-01-10T00:00:00.000Z' }),
      makeSettlement({ id: 's2', settlement_date: '2025-01-20T00:00:00.000Z' }),
    ];
    mockGetSettlements.mockResolvedValue(settlements);

    const { result } = renderHook(() => useSettlements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settlements).toHaveLength(2);
    // Should be sorted newest first
    expect(result.current.settlements[0].id).toBe('s2');
    expect(result.current.settlements[1].id).toBe('s1');
    expect(mockGetSettlements).toHaveBeenCalledTimes(1);
  });

  it('sorts settlements by settlement_date descending', async () => {
    const settlements = [
      makeSettlement({ id: 'oldest', settlement_date: '2025-01-01T00:00:00.000Z' }),
      makeSettlement({ id: 'newest', settlement_date: '2025-03-01T00:00:00.000Z' }),
      makeSettlement({ id: 'middle', settlement_date: '2025-02-01T00:00:00.000Z' }),
    ];
    mockGetSettlements.mockResolvedValue(settlements);

    const { result } = renderHook(() => useSettlements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settlements.map(s => s.id)).toEqual(['newest', 'middle', 'oldest']);
  });

  it('handles errors by setting settlements to empty array', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetSettlements.mockRejectedValue(new Error('DB failure'));

    const { result } = renderHook(() => useSettlements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settlements).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load settlements:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('refetch function reloads data', async () => {
    const initialData = [makeSettlement({ id: 's1' })];
    const updatedData = [makeSettlement({ id: 's1' }), makeSettlement({ id: 's2' })];

    mockGetSettlements.mockResolvedValueOnce(initialData);

    const { result } = renderHook(() => useSettlements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settlements).toHaveLength(1);

    mockGetSettlements.mockResolvedValueOnce(updatedData);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.settlements).toHaveLength(2);
  });

  it('sets up a polling interval that re-fetches settlements', async () => {
    vi.useFakeTimers();
    mockGetSettlements.mockResolvedValue([]);

    renderHook(() => useSettlements());

    // Flush initial mount call
    await vi.advanceTimersByTimeAsync(0);

    expect(mockGetSettlements).toHaveBeenCalledTimes(1);

    // Advance 5 seconds to trigger interval
    await vi.advanceTimersByTimeAsync(5000);

    expect(mockGetSettlements).toHaveBeenCalledTimes(2);

    // Advance another 5 seconds
    await vi.advanceTimersByTimeAsync(5000);

    expect(mockGetSettlements).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });

  it('clears interval on unmount', async () => {
    vi.useFakeTimers();
    mockGetSettlements.mockResolvedValue([]);

    const { unmount } = renderHook(() => useSettlements());

    // Flush initial mount call
    await vi.advanceTimersByTimeAsync(0);

    expect(mockGetSettlements).toHaveBeenCalledTimes(1);

    unmount();

    // Advance timers; the interval should have been cleared
    await vi.advanceTimersByTimeAsync(15000);

    // Should still only be 1 call (the initial mount call)
    expect(mockGetSettlements).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
