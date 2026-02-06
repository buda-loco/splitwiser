-- =====================================================
-- Templates Schema Migration for Splitwiser Expense Splitting
-- =====================================================
-- This migration creates the split template system for storing reusable
-- split configurations. Templates allow users to save named split patterns
-- (e.g., "Family Dinner", "Flatmates") with predefined participants and
-- split values that can be quickly applied to new expenses.
--
-- Created: 2026-02-06
-- Phase: 08-templates-and-efficiency-features
-- =====================================================

-- =====================================================
-- Table: split_templates
-- =====================================================
-- Stores named split configurations that can be reused across expenses.
-- Each template has a split type (equal, percentage, shares, exact) and
-- is owned by the user who created it.

CREATE TABLE IF NOT EXISTS split_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  split_type varchar(20) NOT NULL CHECK (split_type IN ('equal', 'percentage', 'shares', 'exact')),
  created_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_user_template_name UNIQUE (created_by_user_id, name)
);

-- Index for efficient querying of user's templates
CREATE INDEX IF NOT EXISTS idx_split_templates_created_by_user_id ON split_templates(created_by_user_id);

-- =====================================================
-- Table: template_participants
-- =====================================================
-- Links templates to users/participants with their split values.
-- Supports the hybrid account model - participants can be either
-- registered users (user_id) or non-registered participants (participant_id).
-- split_value is null for equal splits, numeric for percentage/shares/exact.

CREATE TABLE IF NOT EXISTS template_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES split_templates(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  split_value decimal(12,2),
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT chk_template_participants_identity CHECK (
    (user_id IS NOT NULL AND participant_id IS NULL) OR
    (user_id IS NULL AND participant_id IS NOT NULL)
  )
);

-- Index for efficient lookups of template participants
CREATE INDEX IF NOT EXISTS idx_template_participants_template_id ON template_participants(template_id);

-- =====================================================
-- Enable RLS on Template Tables
-- =====================================================

ALTER TABLE split_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_participants ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Policies: split_templates table
-- =====================================================

-- SELECT: Users can view their own templates
CREATE POLICY "Users can view their own templates"
  ON split_templates
  FOR SELECT
  TO authenticated
  USING (created_by_user_id = auth.uid());

-- INSERT: Users can create templates (must set created_by_user_id to auth.uid())
CREATE POLICY "Users can create their own templates"
  ON split_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by_user_id = auth.uid());

-- UPDATE: Users can update their own templates
CREATE POLICY "Users can update their own templates"
  ON split_templates
  FOR UPDATE
  TO authenticated
  USING (created_by_user_id = auth.uid())
  WITH CHECK (created_by_user_id = auth.uid());

-- DELETE: Users can delete their own templates
CREATE POLICY "Users can delete their own templates"
  ON split_templates
  FOR DELETE
  TO authenticated
  USING (created_by_user_id = auth.uid());

-- =====================================================
-- Policies: template_participants table
-- =====================================================

-- SELECT: Users can view participants for their own templates
CREATE POLICY "Users can view participants for their own templates"
  ON template_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM split_templates st
      WHERE st.id = template_id
      AND st.created_by_user_id = auth.uid()
    )
  );

-- INSERT: Users can add participants to their own templates
CREATE POLICY "Users can add participants to their own templates"
  ON template_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM split_templates st
      WHERE st.id = template_id
      AND st.created_by_user_id = auth.uid()
    )
  );

-- UPDATE: Users can update participants for their own templates
CREATE POLICY "Users can update participants for their own templates"
  ON template_participants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM split_templates st
      WHERE st.id = template_id
      AND st.created_by_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM split_templates st
      WHERE st.id = template_id
      AND st.created_by_user_id = auth.uid()
    )
  );

-- DELETE: Users can delete participants from their own templates
CREATE POLICY "Users can delete participants from their own templates"
  ON template_participants
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM split_templates st
      WHERE st.id = template_id
      AND st.created_by_user_id = auth.uid()
    )
  );

-- =====================================================
-- Trigger for updated_at timestamp
-- =====================================================

CREATE TRIGGER update_split_templates_updated_at
  BEFORE UPDATE ON split_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- End of Templates Migration
-- =====================================================
