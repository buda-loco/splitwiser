# Phase 3 Plan 1: Database Schema Design Summary

**Complete expense splitting schema with 6 core tables and relationships**

## Accomplishments

- Created Supabase migrations directory structure at `/supabase/migrations/`
- Designed comprehensive schema for expense management with all required tables
- Implemented proper constraints, indexes, and foreign keys for data integrity
- Schema supports hybrid user/participant model (registered users + non-registered participants)
- Schema prepared for offline-first architecture with uuid-based IDs
- Uses timestamptz for timezone-aware timestamps (not timestamp)
- Uses decimal(12,2) for precise money calculations (not float)
- Includes soft delete capability on expenses (is_deleted flag)
- Version tracking enabled on expenses table (version field)
- Complete edit history via expense_versions table

## Files Created/Modified

- `supabase/migrations/20260206000001_create_core_schema.sql` - Core schema migration with 6 tables

## Tables Created

### 1. expenses
Core expense records tracking amount, currency, description, category, and who paid.
- Columns: id, amount, currency, description, category, expense_date, paid_by_user_id, created_by_user_id, is_deleted, version, created_at, updated_at, deleted_at
- Indexes: paid_by_user_id, created_by_user_id, expense_date, is_deleted
- Supports soft deletion and version tracking

### 2. expense_participants
Junction table linking expenses to participants (users or non-registered participants).
- Columns: id, expense_id, user_id, participant_id, created_at
- Constraint: Must have either user_id OR participant_id (not both, not neither)
- Unique indexes prevent duplicate participants per expense
- ON DELETE CASCADE with expenses

### 3. expense_splits
How each expense is split among participants with multiple split types.
- Columns: id, expense_id, user_id, participant_id, amount, split_type, split_value, created_at
- Split types: equal, percentage, shares, exact
- Constraint: Must have either user_id OR participant_id
- Indexes: expense_id, user_id, participant_id
- ON DELETE CASCADE with expenses

### 4. expense_tags
Tag-based organization for filtering and grouping expenses.
- Columns: id, expense_id, tag, created_at
- Tags are lowercase strings without # prefix
- Unique constraint: same tag can't be added twice to same expense
- Indexes: tag (for filtering), expense_id (for lookups)
- ON DELETE CASCADE with expenses

### 5. settlements
Records when someone settles up (pays back) money they owe.
- Columns: id, from_user_id, from_participant_id, to_user_id, to_participant_id, amount, currency, settlement_type, tag, settlement_date, created_by_user_id, created_at
- Settlement types: global, tag_specific, partial
- Constraint: Must have from identity (user or participant)
- Constraint: Must have to identity (user or participant)
- Constraint: tag_specific settlements must have tag field populated
- Indexes: from_user_id, from_participant_id, to_user_id, to_participant_id, settlement_date, tag

### 6. expense_versions
Complete edit history for expenses enabling audit trail and undo capability.
- Columns: id, expense_id, version_number, changed_by_user_id, change_type, changes, created_at
- Change types: created, updated, deleted, restored
- Changes stored as jsonb with before/after diff
- Indexes: expense_id, (expense_id, version_number)
- ON DELETE CASCADE with expenses

## Decisions Made

1. **No groups table**: Following PROJECT.md decision to use tags instead of groups for organization. Tags are organizational, balances are global per person.

2. **Hybrid user/participant model**: All junction tables (expense_participants, expense_splits, settlements) support both registered users (user_id) and non-registered participants (participant_id) with CHECK constraints ensuring exactly one is set.

3. **UUID primary keys**: Using uuid with gen_random_uuid() for all primary keys instead of SERIAL for offline-first compatibility and distributed system support.

4. **Timestamptz not timestamp**: All timestamp columns use timestamptz for timezone awareness.

5. **Decimal not float**: All money amounts use decimal(12,2) for precise calculations (max 9,999,999,999.99).

6. **Soft deletes**: expenses table has is_deleted flag, deleted_at timestamp for audit trail and potential restore capability.

7. **Version tracking**: expenses table tracks version number, expense_versions table maintains complete history of all changes.

8. **Cascading deletes**: All junction tables use ON DELETE CASCADE with expenses to maintain referential integrity.

9. **Tag normalization**: expense_tags enforces lowercase tags via CHECK constraint to ensure consistent filtering.

10. **Settlement flexibility**: settlements table supports three types (global, tag_specific, partial) with conditional constraint requiring tag field for tag_specific type.

11. **Trigger for updated_at**: Created reusable trigger function to automatically update updated_at timestamp on expenses table modifications.

## Issues Encountered

None. Schema creation completed without issues.

## Verification

All success criteria met:
- ✅ Migration file exists at supabase/migrations/20260206000001_create_core_schema.sql
- ✅ All 6 tables defined with complete column specifications
- ✅ Foreign key relationships properly defined with ON DELETE CASCADE where appropriate
- ✅ Proper constraints (CHECK, UNIQUE, NOT NULL) in place
- ✅ Indexes created for frequently queried columns
- ✅ Uses uuid, timestamptz, decimal types (not serial, timestamp, float)
- ✅ No groups table (tags-based architecture)
- ✅ Supports hybrid user/participant model
- ✅ Schema prepared for offline-first patterns

## Next Step

Ready for 03-02-PLAN.md (Create RLS policies and deploy migration to Supabase)
