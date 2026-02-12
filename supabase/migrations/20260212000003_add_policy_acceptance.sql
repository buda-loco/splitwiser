-- Add policy acceptance tracking to profiles table
-- Required for GDPR compliance

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS policy_version TEXT;

-- Add index for querying users who haven't accepted policies
CREATE INDEX IF NOT EXISTS idx_profiles_policy_acceptance
  ON profiles(privacy_policy_accepted_at, terms_accepted_at)
  WHERE privacy_policy_accepted_at IS NULL OR terms_accepted_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.privacy_policy_accepted_at IS 'Timestamp when user accepted privacy policy';
COMMENT ON COLUMN profiles.terms_accepted_at IS 'Timestamp when user accepted terms of service';
COMMENT ON COLUMN profiles.policy_version IS 'Version of policies accepted (e.g., "1.0")';
