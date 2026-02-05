---
phase: 02-authentication-and-user-model
plan: 02
completed: 2026-02-06
subsystem: database
requires: [02-01]
provides: [user-profile-schema, profile-types, profile-crud]
affects: [02-03, 02-05, 02-06]
tags: [database, schema, crud, rls]
key-decisions:
  - "profiles table extends auth.users with app-specific fields"
  - "RLS allows viewing all profiles (for expense participant selection)"
  - "Users can only update own profile"
  - "currency_preference defaults to USD"
key-files:
  - lib/db/schema.sql
  - lib/db/types.ts
  - lib/actions/user.ts
tech-stack:
  added: []
  patterns: [rls-policies, server-actions, type-safe-crud]
---

# Phase 2 Plan 2: User Profile Schema Summary

**Complete user profile database schema with RLS policies, TypeScript types, and type-safe CRUD server actions.**

## Accomplishments

- Created SQL schema for profiles table extending Supabase auth.users with app-specific fields (display_name, avatar_url, currency_preference)
- Implemented Row Level Security (RLS) policies allowing all authenticated users to view profiles but only update their own
- Added automatic updated_at timestamp trigger using PostgreSQL function
- Generated TypeScript types (Profile, ProfileInsert, ProfileUpdate) matching database schema
- Built 4 server actions for profile operations: getProfile, getCurrentUserProfile, upsertProfile, updateProfile
- All server actions include proper error handling and use Supabase server client pattern

## Files Created/Modified

- `lib/db/schema.sql` - PostgreSQL schema with profiles table, RLS policies, and updated_at trigger. Includes comment with direct link to Supabase SQL editor for deployment.
- `lib/db/types.ts` - TypeScript types for profile operations with JSDoc comments. Exports Profile (full record), ProfileInsert (omits timestamps), and ProfileUpdate (partial updates).
- `lib/actions/user.ts` - Next.js Server Actions marked with 'use server'. Four functions for CRUD operations with try-catch error handling, console logging, and .single() to unwrap results.

## Decisions Made

**Profile fields selection**: Included display_name (required), avatar_url (optional), and currency_preference (defaults to USD) as app-specific fields. These support the PROJECT.md requirements for multi-currency support and user identity in expense splitting context.

**RLS policy: All authenticated users can view all profiles**: Unlike typical apps where profiles are private, Splitwiser needs users to see other profiles when selecting expense participants. This enables the "add participant" flow where users can search and select friends to split with.

**RLS policy: Users can only modify own profile**: Security constraint preventing users from editing others' profiles. Standard pattern for user data protection.

**Updated_at trigger pattern**: Used PostgreSQL trigger with function to automatically update updated_at timestamp on any profile change. Standard database pattern that ensures timestamp accuracy without relying on application code.

**Server Actions for CRUD**: Chose Next.js Server Actions over API routes for simpler RPC-style calls from client components. All functions create Supabase server client (SSR-safe) and include error handling.

**Error handling split**: Getter functions (getProfile, getCurrentUserProfile) return null on error for graceful degradation. Mutator functions (upsertProfile, updateProfile) throw errors to surface issues to calling code.

## Issues Encountered

**None** - Standard Supabase patterns worked as expected. Schema follows established PostgreSQL conventions, RLS policies are straightforward, and server actions follow Phase 1 established patterns.

## Next Phase Readiness

**Ready for Plan 02-03 (Participant model for non-registered users):**
- User profile schema established and ready to reference
- Pattern for creating database tables with RLS policies established
- TypeScript types pattern established for new tables
- Server actions pattern ready to replicate for participant CRUD

**Pattern established for future tables:**
1. Create SQL schema in lib/db/schema.sql with RLS policies
2. Generate TypeScript types in lib/db/types.ts with Insert/Update variants
3. Build server actions in lib/actions/ for CRUD operations
4. Use Supabase server client pattern for SSR-safe operations

## Next Step

Ready for Plan 02-03 (Participant model for non-registered users). Profile foundation complete, now need parallel participant system for tracking people who haven't created accounts yet.
