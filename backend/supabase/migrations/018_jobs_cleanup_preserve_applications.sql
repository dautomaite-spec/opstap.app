-- 018_jobs_cleanup_preserve_applications.sql
-- Fix data-loss bug: the daily cleanup-stale-jobs cron deleted jobs older than
-- 7 days, and applications.job_id was ON DELETE CASCADE — silently deleting
-- sent applications. Exclude jobs referenced by applications from the cleanup
-- and retarget the FK to ON DELETE RESTRICT as belt-and-braces.

DO $outer$
BEGIN
  PERFORM cron.unschedule('cleanup-stale-jobs');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron unschedule skipped: %', SQLERRM;
END;
$outer$;

DO $outer$
BEGIN
  PERFORM cron.schedule(
    'cleanup-stale-jobs',
    '0 3 * * *',
    $inner$
      DELETE FROM jobs
      WHERE scraped_at < NOW() - INTERVAL '7 days'
        AND id::text NOT IN (SELECT job_id FROM saved_jobs)
        AND id NOT IN (SELECT job_id FROM applications);
    $inner$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END;
$outer$;

ALTER TABLE applications DROP CONSTRAINT applications_job_id_fkey;
ALTER TABLE applications ADD CONSTRAINT applications_job_id_fkey
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE RESTRICT;
