-- 006_jobs_restructure.sql
-- Make jobs table shared (global, not per-user)
-- Add full-text search index + stale job cleanup

-- Drop the per-user RLS policy before removing the column it references
DROP POLICY IF EXISTS "Users can read jobs scraped for them" ON jobs;

-- Jobs are now shared — any authenticated user may read any job
CREATE POLICY "Authenticated users can read jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (true);

-- Drop per-user column — jobs are now shared across all users
ALTER TABLE jobs DROP COLUMN IF EXISTS scraped_for_user;

-- Add FTS generated column (computed from title + company + description_snippet)
-- Uses 'simple' config (always available, handles Dutch without language-specific stemming)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(title, '') || ' ' || coalesce(company, '') || ' ' || coalesce(description_snippet, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS jobs_fts_idx ON jobs USING gin(fts);
CREATE INDEX IF NOT EXISTS jobs_scraped_at_idx ON jobs (scraped_at DESC);

-- Schedule daily cleanup at 03:00 UTC via pg_cron
-- Deletes jobs older than 7 days that are not saved by any user
DO $outer$
BEGIN
  PERFORM cron.schedule(
    'cleanup-stale-jobs',
    '0 3 * * *',
    $inner$
      DELETE FROM jobs
      WHERE scraped_at < NOW() - INTERVAL '7 days'
        AND id::text NOT IN (SELECT job_id FROM saved_jobs);
    $inner$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END;
$outer$;
