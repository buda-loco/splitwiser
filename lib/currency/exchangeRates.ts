/**
 * Exchange rate fetching and caching
 *
 * Integrates with free-tier exchangerate-api.com for real-time currency conversion.
 * Uses IndexedDB caching with 24h TTL to minimize API calls and support offline usage.
 */

import { getDatabase, STORES, promisifyRequest } from '@/lib/db/indexeddb';
import { ExchangeRateCache, CurrencyCode } from './types';

/**
 * Get exchange rate between two currencies
 *
 * @param from - Source currency code
 * @param to - Target currency code
 * @returns Exchange rate multiplier (e.g., 0.85 means 1 USD = 0.85 EUR)
 *
 * Flow:
 * 1. Check cache first (if valid and not expired)
 * 2. Fetch from API if cache miss or expired
 * 3. Cache fresh data with 24h TTL
 * 4. Fallback to expired cache if API fails
 * 5. Ultimate fallback: 1.0 (no conversion)
 */
export async function getExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode
): Promise<number> {
  if (from === to) return 1.0;

  // Try cache first
  const cached = await getCachedRate(from);
  if (cached && !isExpired(cached)) {
    return cached.rates[to] || 1.0;
  }

  // Fetch fresh rates
  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from}`
    );
    const data = await response.json();

    // Cache for 24 hours
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const cache: ExchangeRateCache = {
      base_currency: from,
      rates: data.rates,
      fetched_at: now.toISOString(),
      expires_at: expires.toISOString(),
    };

    await saveCachedRate(cache);

    return data.rates[to] || 1.0;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);

    // Fallback to expired cache if available
    if (cached) {
      console.warn('Using expired exchange rate cache');
      return cached.rates[to] || 1.0;
    }

    // Ultimate fallback: return 1.0 (no conversion)
    console.warn('No exchange rate available, using 1:1');
    return 1.0;
  }
}

/**
 * Get cached exchange rate for a base currency
 *
 * @param base - Base currency code
 * @returns Cached rate data or null if not found
 */
async function getCachedRate(base: string): Promise<ExchangeRateCache | null> {
  const db = await getDatabase();
  const tx = db.transaction([STORES.EXCHANGE_RATES], 'readonly');
  const store = tx.objectStore(STORES.EXCHANGE_RATES);
  const request = store.get(base);
  return promisifyRequest(request);
}

/**
 * Save exchange rate cache to IndexedDB
 *
 * @param cache - Exchange rate cache entry to save
 */
async function saveCachedRate(cache: ExchangeRateCache): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction([STORES.EXCHANGE_RATES], 'readwrite');
  const store = tx.objectStore(STORES.EXCHANGE_RATES);
  await promisifyRequest(store.put(cache));
}

/**
 * Check if cached exchange rate has expired
 *
 * @param cache - Exchange rate cache entry
 * @returns true if expired, false otherwise
 */
function isExpired(cache: ExchangeRateCache): boolean {
  return new Date(cache.expires_at) < new Date();
}
