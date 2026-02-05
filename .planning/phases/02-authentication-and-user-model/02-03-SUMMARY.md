---
phase: 02-authentication-and-user-model
plan: 03
completed: 2026-02-06
subsystem: database
requires: [02-02]
provides: [participant-schema, participant-types, participant-crud]
affects: [02-04, 02-05]
tags: [database, schema, hybrid-model]
key-decisions:
  - "Participants are non-users with name and optional contact info"
  - "claimed_by_user_id links participant to user account when claimed"
  - "RLS allows viewing participants you created (simplified for v1)"
  - "Indexes on email and claimed_by_user_id for invite/claim lookups"
key-files:
  - lib/db/schema.sql
  - lib/db/types.ts
  - lib/actions/participant.ts
tech-stack:
  added: []
  patterns: [hybrid-account-model, participant-claiming]
---

# Phase 2 Plan 3: Participant Model Summary

**Complete participant database schema with RLS policies, TypeScript types, and CRUD server actions enabling hybrid account model for non-registered users.**

## Accomplishments

- Created SQL schema for participants table with name, email, phone fields and account claiming infrastructure
- Implemented Row Level Security (RLS) policies allowing users to view/insert/update participants they created
- Added performance indexes on email (for invite link lookups) and claimed_by_user_id (for claim operations)
- Added automatic updated_at timestamp trigger using PostgreSQL function
- Generated TypeScript types (Participant, ParticipantInsert, ParticipantUpdate) matching database schema
- Built 6 server actions for participant operations: createParticipant, getParticipant, getParticipantByEmail, getUserParticipants, updateParticipant, claimParticipant
- All server actions include proper error handling and use Supabase server client pattern

## Files Created/Modified

- `lib/db/schema.sql` - Added participants table schema with RLS policies, indexes, and updated_at trigger. Table supports non-registered users with optional email/phone contact info and claimed_by_user_id for account linking.
- `lib/db/types.ts` - Added TypeScript types for participant operations with comprehensive JSDoc explaining hybrid account model. Exports Participant (full record), ParticipantInsert (omits auto-generated fields), and ParticipantUpdate (partial updates for name/email/phone only).
- `lib/actions/participant.ts` - New file with Next.js Server Actions marked 'use server'. Six CRUD functions with try-catch error handling, console logging, proper Supabase query patterns (.single() for single results, .maybeSingle() for optional results).

## Decisions Made

**Participant fields**: Included name (required), email (nullable), phone (nullable), claimed_by_user_id (nullable, for account claiming), and created_by_user_id (required, tracks who added the participant). Supports PROJECT.md requirement for tracking expenses with non-users.

**claimed_by_user_id for account claiming**: When a participant signs up and creates an account, this field links their participant record(s) to their user account. Enables merging participant data into user profile during claim flow (Plan 02-05).

**RLS policy: Users see participants they created**: Simplified policy for v1 since expense participants table doesn't exist yet. Will be refined in Phase 3 when expenses table is added to also show participants involved in user's expenses.

**Indexes for performance**: Email index enables fast lookups when generating invite links or matching participants during account claiming. claimed_by_user_id index supports efficient queries for already-claimed participants.

**getParticipantByEmail finds unclaimed only**: Server action specifically filters for claimed_by_user_id IS NULL, preventing duplicate claims and supporting the invite/claim flow where we want to find existing participant records that haven't been linked to accounts yet.

**claimParticipant enforces unclaimed constraint**: Uses .is('claimed_by_user_id', null) in WHERE clause to prevent re-claiming already claimed participants. Provides safety for account claiming flow.

## Issues Encountered

**None** - Standard Supabase patterns established in Plan 02-02 worked perfectly for participants table. Schema follows established conventions, RLS policies are straightforward, and server actions follow the same pattern as user.ts.

## Next Phase Readiness

**Ready for Plan 02-04 (Email/SMS invite link system):**
- Participant schema with email/phone fields ready for invite generation
- getParticipantByEmail action ready to find participants for invite matching
- claimed_by_user_id infrastructure ready for linking invites to participants

**Ready for Plan 02-05 (Account claiming flow):**
- claimParticipant action ready to link participants to user accounts
- Participant types and CRUD ready for claim verification and merging

**Hybrid account model foundation complete:**
- Can now track expenses with non-registered users (Phase 4)
- Infrastructure ready for invite links (02-04) and account claiming (02-05)
- Pattern established: participants → invite links → account claiming → user profiles

## Next Step

Ready for Plans 02-04 and 02-05 which can run in parallel:
- 02-04: Email/SMS invite link system (uses participant email/phone fields)
- 02-05: Account claiming flow (uses claimParticipant action)
