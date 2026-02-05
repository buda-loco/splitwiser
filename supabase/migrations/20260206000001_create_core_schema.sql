-- =====================================================
-- Core Schema Migration for Splitwiser Expense Splitting
-- =====================================================
-- This migration creates the foundational database schema for expense management,
-- including support for expenses, participants, splits, tags, settlements, and
-- version history tracking. Designed for offline-first architecture with uuid-based
-- IDs and proper constraints for data integrity.
--
-- Created: 2026-02-06
-- Phase: 03-data-model-and-offline-foundation
-- =====================================================

-- =====================================================
-- Table: expenses
-- =====================================================
-- Core expense records with amount, currency, description, and metadata.
-- Supports soft deletion and version tracking for audit trail.
-- paid_by_user_id tracks who paid the expense.

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount decimal(12,2) NOT NULL CHECK (amount >= 0),
  currency varchar(3) NOT NULL,
  description text NOT NULL,
  category varchar(50),
  expense_date timestamptz NOT NULL,
  paid_by_user_id uuid REFERENCES auth.users(id),
  created_by_user_id uuid NOT NULL REFERENCES auth.users(id),
  is_deleted boolean DEFAULT false NOT NULL,
  version integer DEFAULT 1 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by_user_id ON expenses(paid_by_user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by_user_id ON expenses(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_is_deleted ON expenses(is_deleted);

-- =====================================================
-- Table: expense_participants
-- =====================================================
-- Junction table linking expenses to participants (users or non-registered participants).
-- Each expense can have multiple participants who are involved in the split.
-- Supports hybrid account model: user_id for registered users, participant_id for non-registered.

CREATE TABLE IF NOT EXISTS expense_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  participant_id uuid REFERENCES participants(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT chk_expense_participants_identity CHECK (
    (user_id IS NOT NULL AND participant_id IS NULL) OR
    (user_id IS NULL AND participant_id IS NOT NULL)
  )
);

-- Unique constraints to prevent duplicate participants
CREATE UNIQUE INDEX IF NOT EXISTS idx_expense_participants_expense_user
  ON expense_participants(expense_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_expense_participants_expense_participant
  ON expense_participants(expense_id, participant_id)
  WHERE participant_id IS NOT NULL;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON expense_participants(expense_id);

-- =====================================================
-- Table: expense_splits
-- =====================================================
-- Stores how each expense is split among participants.
-- Supports multiple split types: equal, percentage, shares/weights, exact amounts.
-- amount: the calculated amount this person owes
-- split_type: how the split was calculated
-- split_value: percentage (0-100) or share weight (0.5, 1, 2, etc.)

CREATE TABLE IF NOT EXISTS expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  participant_id uuid REFERENCES participants(id),
  amount decimal(12,2) NOT NULL CHECK (amount >= 0),
  split_type varchar(20) NOT NULL CHECK (split_type IN ('equal', 'percentage', 'shares', 'exact')),
  split_value decimal(10,4),
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT chk_expense_splits_identity CHECK (
    (user_id IS NOT NULL AND participant_id IS NULL) OR
    (user_id IS NULL AND participant_id IS NOT NULL)
  )
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user_id ON expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_participant_id ON expense_splits(participant_id);

-- =====================================================
-- Table: expense_tags
-- =====================================================
-- Junction table for tagging expenses for organization and filtering.
-- Tags are lowercase strings without # prefix (e.g., "bali-trip", "family", "flatmates").
-- Same expense can have multiple tags, but each tag can only be added once per expense.

CREATE TABLE IF NOT EXISTS expense_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  tag varchar(100) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT chk_expense_tags_lowercase CHECK (tag = LOWER(tag))
);

-- Unique constraint to prevent duplicate tags on same expense
CREATE UNIQUE INDEX IF NOT EXISTS idx_expense_tags_expense_tag ON expense_tags(expense_id, tag);

-- Indexes for efficient filtering and lookups
CREATE INDEX IF NOT EXISTS idx_expense_tags_tag ON expense_tags(tag);
CREATE INDEX IF NOT EXISTS idx_expense_tags_expense_id ON expense_tags(expense_id);

-- =====================================================
-- Table: settlements
-- =====================================================
-- Records when someone settles up (pays back) money they owe.
-- Supports multiple settlement types:
-- - global: settle all balances with someone across all contexts
-- - tag_specific: settle just the balance for expenses with a specific tag
-- - partial: record a partial payment toward balance

CREATE TABLE IF NOT EXISTS settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES auth.users(id),
  from_participant_id uuid REFERENCES participants(id),
  to_user_id uuid REFERENCES auth.users(id),
  to_participant_id uuid REFERENCES participants(id),
  amount decimal(12,2) NOT NULL CHECK (amount > 0),
  currency varchar(3) NOT NULL,
  settlement_type varchar(20) NOT NULL CHECK (settlement_type IN ('global', 'tag_specific', 'partial')),
  tag varchar(100),
  settlement_date timestamptz NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT chk_settlements_from_identity CHECK (
    (from_user_id IS NOT NULL AND from_participant_id IS NULL) OR
    (from_user_id IS NULL AND from_participant_id IS NOT NULL)
  ),
  CONSTRAINT chk_settlements_to_identity CHECK (
    (to_user_id IS NOT NULL AND to_participant_id IS NULL) OR
    (to_user_id IS NULL AND to_participant_id IS NOT NULL)
  ),
  CONSTRAINT chk_settlements_tag_required CHECK (
    (settlement_type = 'tag_specific' AND tag IS NOT NULL) OR
    (settlement_type != 'tag_specific')
  )
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_settlements_from_user_id ON settlements(from_user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_from_participant_id ON settlements(from_participant_id);
CREATE INDEX IF NOT EXISTS idx_settlements_to_user_id ON settlements(to_user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_to_participant_id ON settlements(to_participant_id);
CREATE INDEX IF NOT EXISTS idx_settlements_settlement_date ON settlements(settlement_date);
CREATE INDEX IF NOT EXISTS idx_settlements_tag ON settlements(tag);

-- =====================================================
-- Table: expense_versions
-- =====================================================
-- Tracks complete edit history for expenses, enabling full audit trail and undo capability.
-- Each change (create, update, delete, restore) creates a version record with:
-- - who made the change (changed_by_user_id)
-- - what changed (changes jsonb field with before/after diff)
-- - when it happened (created_at)

CREATE TABLE IF NOT EXISTS expense_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  changed_by_user_id uuid NOT NULL REFERENCES auth.users(id),
  change_type varchar(20) NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted', 'restored')),
  changes jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_expense_versions_expense_id ON expense_versions(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_versions_expense_version ON expense_versions(expense_id, version_number);

-- =====================================================
-- Triggers for updated_at timestamp
-- =====================================================
-- Automatically update the updated_at timestamp when records are modified

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- End of migration
-- =====================================================
