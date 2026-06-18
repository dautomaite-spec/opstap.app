-- Add source tracking to invite_codes (admin, referral, etc.)
ALTER TABLE invite_codes
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin';

-- Add confirmed_at to profiles (email confirmation timestamp)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- Backfill confirmed_at for existing users who have completed onboarding
-- (treat avg_consent_given_at as the confirmation moment if present)
UPDATE profiles
SET confirmed_at = avg_consent_given_at
WHERE confirmed_at IS NULL AND avg_consent_given_at IS NOT NULL;
