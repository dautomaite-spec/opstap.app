-- AVG Rule 6: track last activity to enforce 90-day inactivity purge
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- AVG Rule 1: record timestamp of consent given before CV upload
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avg_consent_given_at timestamptz;

-- Backfill last_active_at for existing rows from updated_at
UPDATE profiles
SET last_active_at = COALESCE(updated_at, created_at)
WHERE last_active_at IS NULL;
