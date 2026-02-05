---
phase: 02-authentication-and-user-model
plan: 04
completed: 2026-02-06
subsystem: invites
requires: [02-03]
provides: [invite-tokens, invite-links, invite-landing-page]
affects: [02-05]
tags: [invites, security, tokens]
key-decisions:
  - "Secure token generation with crypto.randomBytes (32 bytes)"
  - "Token hashing with SHA-256 before storage (prevents token theft)"
  - "30-day expiry default for invite links"
  - "Public RLS SELECT on invite_tokens (needed for unauthenticated invite page)"
  - "Invite landing page shows participant info and account claim CTA"
key-files:
  - lib/utils/token.ts
  - lib/db/schema.sql
  - lib/actions/invite.ts
  - app/invite/[token]/page.tsx
  - lib/db/types.ts
tech-stack:
  added: [crypto (node:crypto)]
  patterns: [secure-token-generation, token-hashing, invite-links]
---

# Phase 2 Plan 4: Invite Link System Summary

**Built secure email/SMS invite link system for participant onboarding with cryptographic token generation and validation.**

## Accomplishments

Successfully implemented a complete invite link system for adding participants to expenses:

1. **Secure Token Generation** - Created utilities using Node.js crypto module for cryptographically secure random tokens (32 bytes, hex encoded) and SHA-256 hashing for database storage

2. **Database Schema** - Added invite_tokens table with proper constraints, indexes, and RLS policies supporting public token validation before authentication

3. **Server Actions** - Implemented createInvite(), getInviteByToken(), and markInviteUsed() functions with token hashing and expiry validation

4. **Landing Page** - Built iOS-native styled invite page at /invite/[token] that validates tokens, displays participant info, and provides CTAs for account creation

## Files Created/Modified

Created:
- `lib/utils/token.ts` - Secure token generation and hashing utilities
- `lib/actions/invite.ts` - Invite creation and validation server actions
- `app/invite/[token]/page.tsx` - Dynamic invite landing page

Modified:
- `lib/db/schema.sql` - Added invite_tokens table with RLS policies
- `lib/db/types.ts` - Added InviteToken type definition

## Decisions Made

**Security Architecture:**
- Raw tokens (64-char hex) sent in URLs, hashed tokens (SHA-256) stored in DB
- This prevents token theft if database is compromised
- 30-day default expiry with used_at tracking to prevent reuse

**RLS Policy Design:**
- Public SELECT on invite_tokens (expires_at > NOW() AND used_at IS NULL) - required for unauthenticated invite page
- Authenticated INSERT for creating invites
- Public UPDATE for marking tokens as used (supports unauthenticated flow)

**User Experience:**
- Invite landing page shows participant name and contact info
- Primary CTA: "Create Account to Claim" links to /auth/claim with participant ID and token
- Placeholder for "View as Guest" (Phase 6) and balance calculation (Phase 6)
- iOS-native styling with safe-area-inset support for mobile devices

## Issues Encountered

None. All tasks completed successfully with no blockers.

## Next Phase Readiness

All verification checks passed:
- npm run build succeeds without TypeScript errors
- schema.sql has invite_tokens table with proper RLS and indexes
- token.ts generates secure tokens and hashes correctly
- invite.ts creates invites and validates tokens
- /invite/[token] page renders with proper error handling
- No lint errors

System is ready for Plan 02-05 (Account claiming flow). The invite link system provides the foundation for participants to claim their identity by creating accounts, linking their participant record to a user account via claimed_by_user_id.

## Next Step

Proceed to Plan 02-05: Implement account claiming flow that allows participants to link invite tokens to new or existing user accounts. The /auth/claim page will use the participant ID and token from the invite URL to complete the claiming process.
