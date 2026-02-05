-- User Profiles Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  currency_preference TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all profiles (needed for expense participant selection)
CREATE POLICY "Users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert only their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on profile changes
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Participants Schema
-- Participants are non-registered users who can be added to expenses
-- They can later claim their identity by signing up

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  claimed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on email for invite link lookups
CREATE INDEX IF NOT EXISTS idx_participants_email
  ON participants(email)
  WHERE email IS NOT NULL;

-- Index on claimed_by_user_id for account claiming lookups
CREATE INDEX IF NOT EXISTS idx_participants_claimed
  ON participants(claimed_by_user_id)
  WHERE claimed_by_user_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view participants they created
-- Note: Simplified for v1. Will refine when expenses table exists in Phase 3.
CREATE POLICY "Users can view participants they created"
  ON participants
  FOR SELECT
  TO authenticated
  USING (created_by_user_id = auth.uid());

-- Policy: Users can insert participants
CREATE POLICY "Users can insert participants"
  ON participants
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by_user_id = auth.uid());

-- Policy: Users can update own participants
CREATE POLICY "Users can update own participants"
  ON participants
  FOR UPDATE
  TO authenticated
  USING (created_by_user_id = auth.uid())
  WITH CHECK (created_by_user_id = auth.uid());

-- Trigger to automatically update updated_at on participant changes
CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
