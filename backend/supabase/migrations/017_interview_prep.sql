-- Post-apply interview preparation pack, generated after an application is
-- sent (company summary, likely questions, questions to ask back, tips).
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS interview_prep JSONB,
  ADD COLUMN IF NOT EXISTS interview_prep_generated_at TIMESTAMPTZ;
