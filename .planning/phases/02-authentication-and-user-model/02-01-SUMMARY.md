---
phase: 02-authentication-and-user-model
plan: 01
completed: 2026-02-06
subsystem: auth
requires: [01-02]
provides: [magic-link-auth, auth-middleware, login-page]
affects: [02-02, 02-06]
tags: [auth, supabase, magic-link]
key-decisions:
  - "Magic link authentication (passwordless, no bcrypt needed)"
  - "Middleware handles token refresh on every request"
  - "emailRedirectTo points to /auth/callback for code exchange"
  - "Error page added for failed auth attempts (deviation)"
key-files:
  - middleware.ts
  - app/auth/login/page.tsx
  - app/auth/callback/route.ts
  - app/auth/error/page.tsx
  - .env.local
tech-stack:
  added: []
  patterns: [magic-link-auth, auth-middleware, callback-route, ios-native-styling]
---

# Phase 2 Plan 1: Supabase Magic Link Auth Summary

**Complete passwordless authentication flow with magic link email, callback handling, and automatic token refresh.**

## Accomplishments

- Created Next.js middleware that refreshes auth tokens on every request
- Built iOS-native styled login page with email magic link flow
- Implemented auth callback route handler for code exchange
- Created error page for failed authentication attempts
- Updated .env.local with clear instructions for Supabase setup

## Files Created/Modified

- `middleware.ts` - Next.js middleware calling updateSession on every request with proper matcher config (excludes static assets)
- `app/auth/login/page.tsx` - Client-side login page with email input, signInWithOtp call, iOS-native styling with -apple-system font, rounded corners, and safe area padding
- `app/auth/callback/route.ts` - Server-side route handler extracting auth code and exchanging for session
- `app/auth/error/page.tsx` - Error page for failed auth attempts with return-to-login link (deviation: added for better UX)
- `.env.local` - Added TODO comment with direct link to Supabase dashboard API settings

## Decisions Made

**Magic link authentication**: Chose passwordless magic link flow over traditional email/password. Simpler UX, no password management, better security. Aligns with PROJECT.md goal of low-friction onboarding.

**Auth middleware on all routes**: Middleware runs on every request (except static assets) to ensure auth tokens stay fresh. Prevents random logout issues that plague session-based auth.

**emailRedirectTo configuration**: Magic link redirects to /auth/callback where code is exchanged for session. Standard Supabase SSR pattern for Next.js App Router.

**Error page deviation**: Added /auth/error page (not in original plan) for better error handling UX. When callback fails (invalid code, expired link), users see a clear error message with option to retry. Better than raw error or redirect loop.

## Issues Encountered

**None** - Standard Supabase SSR setup worked as expected. All patterns followed established conventions from Phase 1 (01-02).

## Deviations

1. **Added auth error page** (auto-fix critical): Created /app/auth/error/page.tsx to handle failed authentication attempts. Without this, users would see generic errors or redirect loops when magic links expire or are invalid. Type: Auto-add critical (improves UX and prevents confusion).

## Next Phase Readiness

**Ready for Plan 02-02 (User profile schema and CRUD operations):**
- Auth flow complete and functional (pending real Supabase credentials)
- Middleware ensures sessions stay valid across the app
- Login and callback patterns established for user creation flow

**Requires to test end-to-end:**
- Real Supabase project credentials in .env.local
- Email delivery configured in Supabase dashboard

**Pattern established:**
- Client Components use createClient from '@/lib/supabase/client'
- Server Components/Routes use createClient from '@/lib/supabase/server'
- Middleware calls updateSession from '@/lib/supabase/middleware'

## Next Step

Ready for Plan 02-02 (User profile schema and CRUD operations). Auth foundation is complete.
