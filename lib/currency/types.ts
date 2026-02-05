/**
 * Currency types for exchange rate management
 *
 * This module defines types for handling multi-currency expenses with
 * exchange rate caching. Supports free-tier API integration for real-time
 * exchange rates with local caching to minimize API calls.
 */

/**
 * Exchange rate cache entry
 *
 * Stores exchange rates fetched from API with expiration timestamp.
 * Cached in IndexedDB for offline access and to reduce API calls.
 */
export type ExchangeRateCache = {
  base_currency: string;  // e.g., "USD"
  rates: Record<string, number>;  // { "EUR": 0.85, "GBP": 0.73, ... }
  fetched_at: string;  // ISO timestamp
  expires_at: string;  // ISO timestamp (fetched_at + 24h)
};

/**
 * Supported currency codes
 *
 * Initially supporting major currencies used by app users.
 * Can be extended as needed.
 */
export type CurrencyCode = 'AUD' | 'USD' | 'EUR' | 'GBP';

/**
 * List of all supported currencies
 */
export const SUPPORTED_CURRENCIES: CurrencyCode[] = ['AUD', 'USD', 'EUR', 'GBP'];
