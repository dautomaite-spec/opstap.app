-- Richer search profile fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS job_background       TEXT           CHECK (char_length(job_background) <= 400),
  ADD COLUMN IF NOT EXISTS job_company_size     VARCHAR(50),
  ADD COLUMN IF NOT EXISTS job_culture          VARCHAR(50),
  ADD COLUMN IF NOT EXISTS job_role_type        VARCHAR(50),
  ADD COLUMN IF NOT EXISTS job_avoids           TEXT           CHECK (char_length(job_avoids) <= 300),
  ADD COLUMN IF NOT EXISTS job_search_summary   TEXT           CHECK (char_length(job_search_summary) <= 600);
