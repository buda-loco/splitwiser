-- =====================================================
-- RLS Policies Migration for Splitwiser Expense Splitting
-- =====================================================
-- This migration enables Row Level Security on all tables and creates
-- comprehensive security policies to control data access and modification.
-- Policies enforce collaborative access model where users can see and manage
-- expenses they're involved with, while protecting data privacy.
--
-- Created: 2026-02-06
-- Phase: 03-data-model-and-offline-foundation
-- =====================================================

-- =====================================================
-- Helper Functions for Access Control
-- =====================================================

-- Check if the current user can access a specific expense
-- Returns true if user created it, paid for it, or is a participant
CREATE OR REPLACE FUNCTION can_access_expense(expense_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM expenses e
    WHERE e.id = expense_uuid
    AND (
      e.created_by_user_id = auth.uid()
      OR e.paid_by_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM expense_participants ep
        WHERE ep.expense_id = expense_uuid
        AND ep.user_id = auth.uid()
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Enable RLS on All Tables
-- =====================================================

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_versions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Policies: expenses table
-- =====================================================

-- SELECT: User can see expenses they created, paid for, or are a participant in
CREATE POLICY "Users can view expenses they're involved with"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (
    created_by_user_id = auth.uid()
    OR paid_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM expense_participants ep
      WHERE ep.expense_id = id
      AND ep.user_id = auth.uid()
    )
  );

-- INSERT: Any authenticated user can create expenses
CREATE POLICY "Authenticated users can create expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
  );

-- UPDATE: Only creator can update their own expenses
CREATE POLICY "Users can update their own expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (created_by_user_id = auth.uid())
  WITH CHECK (created_by_user_id = auth.uid());

-- DELETE: Only creator can soft-delete (handled by UPDATE since we use is_deleted flag)
-- Note: Actual DELETE operations are not exposed; soft delete via UPDATE only

-- =====================================================
-- Policies: expense_participants table
-- =====================================================

-- SELECT: User can see participants for expenses they have access to
CREATE POLICY "Users can view participants for their expenses"
  ON expense_participants
  FOR SELECT
  TO authenticated
  USING (
    can_access_expense(expense_id)
  );

-- INSERT: User can add participants when creating/editing their own expenses
CREATE POLICY "Users can add participants to their own expenses"
  ON expense_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_id
      AND e.created_by_user_id = auth.uid()
    )
  );

-- DELETE: User can remove participants from their own expenses
CREATE POLICY "Users can remove participants from their own expenses"
  ON expense_participants
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_id
      AND e.created_by_user_id = auth.uid()
    )
  );

-- =====================================================
-- Policies: expense_splits table
-- =====================================================

-- SELECT: User can see splits for expenses they have access to
CREATE POLICY "Users can view splits for their expenses"
  ON expense_splits
  FOR SELECT
  TO authenticated
  USING (
    can_access_expense(expense_id)
  );

-- INSERT: User can create splits when creating/editing their own expenses
CREATE POLICY "Users can create splits for their own expenses"
  ON expense_splits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_id
      AND e.created_by_user_id = auth.uid()
    )
  );

-- UPDATE: User can update splits for their own expenses
CREATE POLICY "Users can update splits for their own expenses"
  ON expense_splits
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_id
      AND e.created_by_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_id
      AND e.created_by_user_id = auth.uid()
    )
  );

-- DELETE: User can delete splits from their own expenses
CREATE POLICY "Users can delete splits from their own expenses"
  ON expense_splits
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_id
      AND e.created_by_user_id = auth.uid()
    )
  );

-- =====================================================
-- Policies: expense_tags table
-- =====================================================

-- SELECT: User can see tags for expenses they have access to
CREATE POLICY "Users can view tags for their expenses"
  ON expense_tags
  FOR SELECT
  TO authenticated
  USING (
    can_access_expense(expense_id)
  );

-- INSERT: User can tag their own expenses
CREATE POLICY "Users can add tags to their own expenses"
  ON expense_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_id
      AND e.created_by_user_id = auth.uid()
    )
  );

-- DELETE: User can remove tags from their own expenses
CREATE POLICY "Users can remove tags from their own expenses"
  ON expense_tags
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_id
      AND e.created_by_user_id = auth.uid()
    )
  );

-- =====================================================
-- Policies: settlements table
-- =====================================================

-- SELECT: User can see settlements where they are from_user_id or to_user_id
CREATE POLICY "Users can view their own settlements"
  ON settlements
  FOR SELECT
  TO authenticated
  USING (
    from_user_id = auth.uid()
    OR to_user_id = auth.uid()
  );

-- INSERT: Any authenticated user can record settlements
CREATE POLICY "Authenticated users can create settlements"
  ON settlements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
  );

-- UPDATE: Only creator can update
CREATE POLICY "Users can update their own settlements"
  ON settlements
  FOR UPDATE
  TO authenticated
  USING (created_by_user_id = auth.uid())
  WITH CHECK (created_by_user_id = auth.uid());

-- DELETE: Only creator can delete
CREATE POLICY "Users can delete their own settlements"
  ON settlements
  FOR DELETE
  TO authenticated
  USING (created_by_user_id = auth.uid());

-- =====================================================
-- Policies: expense_versions table
-- =====================================================

-- SELECT: User can see versions for expenses they have access to
CREATE POLICY "Users can view versions for their expenses"
  ON expense_versions
  FOR SELECT
  TO authenticated
  USING (
    can_access_expense(expense_id)
  );

-- INSERT: System only (no explicit policy needed, will be handled by triggers)
-- Note: In production, version inserts should be triggered automatically
-- For now, allow authenticated users to insert versions for their own expenses
CREATE POLICY "Users can create versions for their own expenses"
  ON expense_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_id
      AND e.created_by_user_id = auth.uid()
    )
  );

-- UPDATE: Never allowed (audit log is immutable)
-- No UPDATE policy = no updates allowed

-- DELETE: Never allowed (audit log is immutable)
-- No DELETE policy = no deletes allowed

-- =====================================================
-- End of RLS Policies Migration
-- =====================================================
