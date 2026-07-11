-- Track whether the user has acknowledged the current AI-generated search summary.
-- Regenerating the summary (profile edit, CV change, manual regen) always clears
-- this, since a changed summary needs a fresh acknowledgment.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS job_search_summary_approved_at TIMESTAMPTZ;
