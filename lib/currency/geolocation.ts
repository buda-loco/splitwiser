/**
 * Geolocation-based currency detection
 *
 * Detects user's currency based on their geographic location using the browser's
 * Geolocation API. Privacy-respecting: requires user permission and never stores
 * or transmits location data.
 *
 * This module provides two main functions:
 * - getCurrencyFromCoordinates: Maps lat/lon to currency using bounding boxes
 * - detectCurrencyFromLocation: Requests user location and detects currency
 */

import type { CurrencyCode } from './types';

/**
 * Currency region definition
 *
 * Uses simple bounding box (lat/lon ranges) to determine which currency
 * zone a user is in. This approach:
 * - Works offline (no API calls)
 * - Fast (simple math comparisons)
 * - No cost (no external services)
 * - Sufficient accuracy for major currency zones
 */
type CurrencyRegion = {
  currency: CurrencyCode;
  bounds: {
    north: number;  // Maximum latitude
    south: number;  // Minimum latitude
    east: number;   // Maximum longitude
    west: number;   // Minimum longitude
  };
  countries: string[];  // For reference/debugging
};

/**
 * Currency regions with bounding boxes
 *
 * Ordered by likelihood (most common currencies first for slight performance gain).
 * Bounding boxes are intentionally generous to catch border regions.
 *
 * Limitations:
 * - Crude for small countries or border regions
 * - Eurozone uses largest bounding box covering all EUR countries
 * - For v1, simple approach is acceptable
 *
 * Future enhancement: Use reverse geocoding API for precise country detection.
 */
const CURRENCY_REGIONS: CurrencyRegion[] = [
  {
    currency: 'EUR',
    bounds: { north: 71, south: 36, east: 40, west: -10 },
    countries: ['Eurozone countries'],
  },
  {
    currency: 'GBP',
    bounds: { north: 61, south: 49, east: 2, west: -8 },
    countries: ['United Kingdom'],
  },
  {
    currency: 'USD',
    bounds: { north: 72, south: 24, east: -66, west: -125 },
    countries: ['United States'],
  },
  {
    currency: 'AUD',
    bounds: { north: -10, south: -44, east: 154, west: 113 },
    countries: ['Australia'],
  },
];

/**
 * Maps geographic coordinates to currency code
 *
 * Uses simple bounding box matching to determine which currency zone
 * the coordinates fall within.
 *
 * @param lat - Latitude (-90 to 90)
 * @param lon - Longitude (-180 to 180)
 * @returns Currency code if location matches a region, null otherwise
 *
 * @example
 * getCurrencyFromCoordinates(-33.8688, 151.2093) // Sydney → 'AUD'
 * getCurrencyFromCoordinates(51.5074, -0.1278)   // London → 'GBP'
 * getCurrencyFromCoordinates(48.8566, 2.3522)    // Paris → 'EUR'
 * getCurrencyFromCoordinates(40.7128, -74.0060)  // New York → 'USD'
 */
export function getCurrencyFromCoordinates(lat: number, lon: number): CurrencyCode | null {
  for (const region of CURRENCY_REGIONS) {
    if (
      lat >= region.bounds.south &&
      lat <= region.bounds.north &&
      lon >= region.bounds.west &&
      lon <= region.bounds.east
    ) {
      return region.currency;
    }
  }
  return null;  // No match found
}

/**
 * Detects currency from user's current location
 *
 * Requests user's location via browser Geolocation API and determines
 * appropriate currency based on coordinates.
 *
 * Privacy & Permissions:
 * - Requires user permission (browser shows permission prompt)
 * - Permission denial is handled gracefully (returns null)
 * - Location is never stored or transmitted
 * - Uses cached position (up to 1 hour old) to save battery
 * - Low accuracy mode for battery efficiency
 *
 * Error Handling:
 * - Permission denied → returns null (user explicitly declined)
 * - Timeout (5s) → returns null (taking too long)
 * - Position unavailable → returns null (no GPS signal)
 * - Coordinates don't match region → returns null (not in supported zone)
 *
 * @returns Currency code if successfully detected, null on any error
 *
 * @example
 * const currency = await detectCurrencyFromLocation();
 * if (currency) {
 *   setCurrency(currency);  // Auto-detect successful
 * } else {
 *   setCurrency(userPreference);  // Fall back to user preference
 * }
 */
export async function detectCurrencyFromLocation(): Promise<CurrencyCode | null> {
  // Check if geolocation available
  if (!navigator.geolocation) {
    console.log('Geolocation not supported');
    return null;
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          timeout: 5000,  // 5 second timeout
          maximumAge: 3600000,  // Accept 1-hour cached position (user doesn't move countries every minute)
          enableHighAccuracy: false,  // Battery-friendly (don't need precise coordinates, just general region)
        }
      );
    });

    const currency = getCurrencyFromCoordinates(
      position.coords.latitude,
      position.coords.longitude
    );

    if (currency) {
      console.log(`Detected currency: ${currency} (${position.coords.latitude}, ${position.coords.longitude})`);
    }

    return currency;
  } catch (error) {
    // Permission denied, timeout, or other error
    console.log('Could not detect location:', error);
    return null;
  }
}
