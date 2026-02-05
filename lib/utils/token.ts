/**
 * Secure token generation utilities for invite links
 *
 * Security model:
 * - Raw tokens are generated using crypto.randomBytes (cryptographically secure)
 * - Raw tokens are sent in invite URLs to users
 * - Token hashes (SHA-256) are stored in the database
 * - This prevents token theft if the database is compromised
 *   (attacker cannot reconstruct the original token from the hash)
 */

import { randomBytes, createHash } from 'node:crypto';

/**
 * Generate a cryptographically secure random token for invite links
 *
 * @returns A 64-character hexadecimal string (32 bytes)
 *
 * @example
 * const token = generateInviteToken();
 * // Returns: "a3f5c8d2e1b4f6c9a7e3d8f1c2b5a4e8d9f6c3a7b2e5f8d1c4a6b9e3f7d2c5a8"
 */
export function generateInviteToken(): string {
  // Generate 32 random bytes, convert to hex (64 characters)
  return randomBytes(32).toString('hex');
}

/**
 * Hash a token using SHA-256 for secure database storage
 *
 * Never store raw tokens in the database. Instead, store the hash and
 * compare hashes when validating tokens. This prevents token theft if
 * the database is compromised.
 *
 * @param token - The raw token string to hash
 * @returns The SHA-256 hash as a hexadecimal string
 *
 * @example
 * const token = generateInviteToken();
 * const hash = hashToken(token);
 * // Store hash in database, send token to user
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
