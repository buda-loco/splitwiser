import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getExchangeRate, convertAmount, convertBalances } from './exchangeRates';
import type { BalanceEntry } from '@/lib/balances/types';

// Mock the IndexedDB store functions
vi.mock('@/lib/db/indexeddb', () => ({
  getDatabase: vi.fn(),
  STORES: { EXCHANGE_RATES: 'exchange_rates' },
  promisifyRequest: vi.fn(),
}));

// Get references to mocked modules
const { getDatabase, promisifyRequest } = await import('@/lib/db/indexeddb');

// Helper to set up IndexedDB mock for getCachedRate
function mockCachedRate(cachedData: any) {
  const mockStore = { get: vi.fn(() => ({})), put: vi.fn(() => ({})) };
  const mockTx = { objectStore: vi.fn(() => mockStore) };
  const mockDb = { transaction: vi.fn(() => mockTx) };

  vi.mocked(getDatabase).mockResolvedValue(mockDb as any);
  vi.mocked(promisifyRequest).mockResolvedValue(cachedData);
}

// Helper to set up IndexedDB mock that returns null (no cache), then saves
function mockNoCacheWithFetch(fetchRates: Record<string, number>) {
  let callCount = 0;
  const mockStore = {
    get: vi.fn(() => ({})),
    put: vi.fn(() => ({})),
  };
  const mockTx = { objectStore: vi.fn(() => mockStore) };
  const mockDb = { transaction: vi.fn(() => mockTx) };

  vi.mocked(getDatabase).mockResolvedValue(mockDb as any);
  vi.mocked(promisifyRequest).mockImplementation(() => {
    callCount++;
    if (callCount === 1) return Promise.resolve(null); // getCachedRate returns null
    return Promise.resolve(undefined); // saveCachedRate
  });

  // Mock fetch
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ rates: fetchRates }),
  }) as any;
}

describe('getExchangeRate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 1.0 when from and to currencies are the same', async () => {
    const rate = await getExchangeRate('USD', 'USD');
    expect(rate).toBe(1.0);
  });

  it('returns 1.0 for same currency regardless of manual rate', async () => {
    const rate = await getExchangeRate('EUR', 'EUR', {
      from_currency: 'EUR',
      to_currency: 'USD',
      rate: 1.1,
    });
    expect(rate).toBe(1.0);
  });

  it('uses manual rate when direction matches from->to', async () => {
    // Mock empty cache to ensure it would fail without manual rate
    mockCachedRate(null);

    const rate = await getExchangeRate('USD', 'EUR', {
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.85,
    });
    expect(rate).toBe(0.85);
  });

  it('uses inverse of manual rate when direction is reversed', async () => {
    mockCachedRate(null);

    const rate = await getExchangeRate('EUR', 'USD', {
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.85,
    });
    expect(rate).toBeCloseTo(1 / 0.85, 10);
  });

  it('does not use manual rate when currencies do not match', async () => {
    // Manual rate is for USD->EUR, but we're converting GBP->AUD
    // Should fall through to cache/fetch logic
    const futureExpiry = new Date(Date.now() + 86400000).toISOString();
    mockCachedRate({
      base_currency: 'GBP',
      rates: { AUD: 1.85 },
      fetched_at: new Date().toISOString(),
      expires_at: futureExpiry,
    });

    const rate = await getExchangeRate('GBP', 'AUD', {
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.85,
    });
    expect(rate).toBe(1.85);
  });

  it('uses cached rate when cache is valid and not expired', async () => {
    const futureExpiry = new Date(Date.now() + 86400000).toISOString();
    mockCachedRate({
      base_currency: 'USD',
      rates: { EUR: 0.92, GBP: 0.79 },
      fetched_at: new Date().toISOString(),
      expires_at: futureExpiry,
    });

    const rate = await getExchangeRate('USD', 'EUR');
    expect(rate).toBe(0.92);
  });

  it('returns 1.0 when cached rate does not have the target currency', async () => {
    const futureExpiry = new Date(Date.now() + 86400000).toISOString();
    mockCachedRate({
      base_currency: 'USD',
      rates: { EUR: 0.92 },
      fetched_at: new Date().toISOString(),
      expires_at: futureExpiry,
    });

    const rate = await getExchangeRate('USD', 'AUD');
    // AUD not in rates, falls back to 1.0
    expect(rate).toBe(1.0);
  });

  it('fetches from API when cache is expired', async () => {
    const pastExpiry = new Date(Date.now() - 1000).toISOString();
    let callCount = 0;
    const mockStore = {
      get: vi.fn(() => ({})),
      put: vi.fn(() => ({})),
    };
    const mockTx = { objectStore: vi.fn(() => mockStore) };
    const mockDb = { transaction: vi.fn(() => mockTx) };

    vi.mocked(getDatabase).mockResolvedValue(mockDb as any);
    vi.mocked(promisifyRequest).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // getCachedRate returns expired cache
        return Promise.resolve({
          base_currency: 'USD',
          rates: { EUR: 0.90 },
          fetched_at: new Date(Date.now() - 86400000).toISOString(),
          expires_at: pastExpiry,
        });
      }
      return Promise.resolve(undefined); // saveCachedRate
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rates: { EUR: 0.93 } }),
    }) as any;

    const rate = await getExchangeRate('USD', 'EUR');
    expect(rate).toBe(0.93);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.exchangerate-api.com/v4/latest/USD'
    );
  });

  it('fetches from API when there is no cache', async () => {
    mockNoCacheWithFetch({ EUR: 0.91, GBP: 0.78 });

    const rate = await getExchangeRate('USD', 'GBP');
    expect(rate).toBe(0.78);
  });

  it('falls back to expired cache when API fetch fails', async () => {
    const pastExpiry = new Date(Date.now() - 1000).toISOString();
    let callCount = 0;
    const mockStore = {
      get: vi.fn(() => ({})),
      put: vi.fn(() => ({})),
    };
    const mockTx = { objectStore: vi.fn(() => mockStore) };
    const mockDb = { transaction: vi.fn(() => mockTx) };

    vi.mocked(getDatabase).mockResolvedValue(mockDb as any);
    vi.mocked(promisifyRequest).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          base_currency: 'USD',
          rates: { EUR: 0.88 },
          fetched_at: new Date(Date.now() - 172800000).toISOString(),
          expires_at: pastExpiry,
        });
      }
      return Promise.resolve(undefined);
    });

    global.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as any;

    const rate = await getExchangeRate('USD', 'EUR');
    expect(rate).toBe(0.88);
  });

  it('returns 1.0 as ultimate fallback when API fails and no cache exists', async () => {
    mockCachedRate(null); // no cache

    global.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as any;

    // Need to re-mock because getCachedRate is called twice (once before fetch, once for fallback)
    let callCount = 0;
    const mockStore = { get: vi.fn(() => ({})), put: vi.fn(() => ({})) };
    const mockTx = { objectStore: vi.fn(() => mockStore) };
    const mockDb = { transaction: vi.fn(() => mockTx) };
    vi.mocked(getDatabase).mockResolvedValue(mockDb as any);
    vi.mocked(promisifyRequest).mockImplementation(() => {
      callCount++;
      return Promise.resolve(null);
    });

    const rate = await getExchangeRate('USD', 'EUR');
    expect(rate).toBe(1.0);
  });

  it('handles null manual rate the same as no manual rate', async () => {
    const futureExpiry = new Date(Date.now() + 86400000).toISOString();
    mockCachedRate({
      base_currency: 'USD',
      rates: { EUR: 0.92 },
      fetched_at: new Date().toISOString(),
      expires_at: futureExpiry,
    });

    const rate = await getExchangeRate('USD', 'EUR', null);
    expect(rate).toBe(0.92);
  });
});

describe('convertAmount', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the same amount when currencies are the same', async () => {
    const result = await convertAmount(100, 'USD', 'USD');
    expect(result).toBe(100);
  });

  it('converts amount using manual rate', async () => {
    mockCachedRate(null);

    const result = await convertAmount(100, 'USD', 'EUR', {
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.85,
    });
    expect(result).toBe(85);
  });

  it('rounds to 2 decimal places', async () => {
    mockCachedRate(null);

    const result = await convertAmount(100, 'USD', 'EUR', {
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.8567,
    });
    expect(result).toBe(85.67);
  });

  it('handles zero amount', async () => {
    const result = await convertAmount(0, 'USD', 'EUR', {
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.85,
    });
    expect(result).toBe(0);
  });

  it('handles very small amounts with proper rounding', async () => {
    mockCachedRate(null);

    const result = await convertAmount(0.01, 'USD', 'EUR', {
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.85,
    });
    expect(result).toBe(0.01);
  });

  it('handles large amounts', async () => {
    mockCachedRate(null);

    const result = await convertAmount(999999.99, 'USD', 'EUR', {
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.85,
    });
    expect(result).toBe(849999.99);
  });
});

describe('convertBalances', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('converts all balance entries to target currency', async () => {
    // Mock for two conversion calls (one per balance entry)
    const futureExpiry = new Date(Date.now() + 86400000).toISOString();
    let callCount = 0;
    const mockStore = { get: vi.fn(() => ({})), put: vi.fn(() => ({})) };
    const mockTx = { objectStore: vi.fn(() => mockStore) };
    const mockDb = { transaction: vi.fn(() => mockTx) };
    vi.mocked(getDatabase).mockResolvedValue(mockDb as any);
    vi.mocked(promisifyRequest).mockResolvedValue({
      base_currency: 'USD',
      rates: { EUR: 0.85 },
      fetched_at: new Date().toISOString(),
      expires_at: futureExpiry,
    });

    const balances: BalanceEntry[] = [
      {
        from: { user_id: 'user1', participant_id: null, name: 'Alice' },
        to: { user_id: 'user2', participant_id: null, name: 'Bob' },
        amount: 100,
        currency: 'USD',
      },
      {
        from: { user_id: 'user3', participant_id: null, name: 'Charlie' },
        to: { user_id: 'user1', participant_id: null, name: 'Alice' },
        amount: 50,
        currency: 'USD',
      },
    ];

    const result = await convertBalances(balances, 'EUR');

    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(85);
    expect(result[0].currency).toBe('EUR');
    expect(result[0].from.name).toBe('Alice');
    expect(result[0].to.name).toBe('Bob');

    expect(result[1].amount).toBe(42.5);
    expect(result[1].currency).toBe('EUR');
  });

  it('returns empty array for empty balances', async () => {
    const result = await convertBalances([], 'EUR');
    expect(result).toEqual([]);
  });

  it('preserves balance structure when converting same currency', async () => {
    const balances: BalanceEntry[] = [
      {
        from: { user_id: 'user1', participant_id: null, name: 'Alice' },
        to: { user_id: 'user2', participant_id: null, name: 'Bob' },
        amount: 100,
        currency: 'USD',
      },
    ];

    // Same currency, no conversion needed
    const result = await convertBalances(balances, 'USD');
    expect(result[0].amount).toBe(100);
    expect(result[0].currency).toBe('USD');
    expect(result[0].from).toEqual(balances[0].from);
    expect(result[0].to).toEqual(balances[0].to);
  });
});
