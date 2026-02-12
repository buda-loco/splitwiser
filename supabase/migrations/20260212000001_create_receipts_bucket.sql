-- =====================================================
-- Receipt Storage Bucket Migration for Splitwiser
-- =====================================================
-- This migration creates the Supabase Storage bucket for receipt photos
-- and sets up security policies for authenticated uploads and public read access.
--
-- Created: 2026-02-12
-- Phase: 11-analytics-export-and-categories
-- Plan: 11-09 (Receipt Upload Infrastructure)
-- =====================================================

-- =====================================================
-- Create Storage Bucket
-- =====================================================

-- Insert the receipts bucket into storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  true, -- Public read access
  5242880, -- 5MB in bytes (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Storage Policies: receipts bucket
-- =====================================================

-- SELECT: Anyone can view receipts (public read access)
CREATE POLICY "Public read access for receipts"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'receipts');

-- INSERT: Only authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload their own receipts"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: Users can update their own receipts
CREATE POLICY "Users can update their own receipts"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: Users can delete their own receipts
CREATE POLICY "Users can delete their own receipts"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- Helper Function: Check receipt quota
-- =====================================================

-- Create a function to check if user has exceeded receipt quota (50 receipts)
CREATE OR REPLACE FUNCTION check_receipt_quota()
RETURNS trigger AS $$
DECLARE
  receipt_count integer;
BEGIN
  -- Count existing receipts for this user
  SELECT COUNT(*)
  INTO receipt_count
  FROM storage.objects
  WHERE bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text;

  -- Check if quota exceeded
  IF receipt_count >= 50 THEN
    RAISE EXCEPTION 'Receipt quota exceeded. Maximum 50 receipts per user.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce quota on insert
CREATE TRIGGER enforce_receipt_quota
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'receipts')
  EXECUTE FUNCTION check_receipt_quota();

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON POLICY "Public read access for receipts" ON storage.objects IS
  'Allow anyone to view receipt images via public URLs';

COMMENT ON POLICY "Authenticated users can upload their own receipts" ON storage.objects IS
  'Only authenticated users can upload receipts to their own folder (receipts/{user_id}/...)';

COMMENT ON POLICY "Users can delete their own receipts" ON storage.objects IS
  'Users can only delete receipts they own (in their user_id folder)';

COMMENT ON FUNCTION check_receipt_quota() IS
  'Enforces maximum 50 receipts per user quota';
