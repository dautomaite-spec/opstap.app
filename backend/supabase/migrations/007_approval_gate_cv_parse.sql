-- 007_approval_gate_cv_parse.sql
-- Approval gate: record when user explicitly reviewed+sent each letter
-- CV parsing: store structured extraction result on the profile

-- send_method becomes nullable so we can insert draft rows before the user picks a send method
ALTER TABLE applications ALTER COLUMN send_method DROP NOT NULL;

-- Record the moment the user explicitly approved and sent each application
ALTER TABLE applications ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Parsed CV structure (JSON extracted by Claude from the uploaded PDF/DOCX)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cv_structured jsonb;
