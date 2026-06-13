-- [MOCKUP PURPOSE ONLY - NOT REAL DATA]
-- Optional session notes + translation metadata; contact form demo storage.

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS session_notes_original TEXT,
  ADD COLUMN IF NOT EXISTS session_notes_client_language VARCHAR(12),
  ADD COLUMN IF NOT EXISTS session_notes_internal_fr TEXT,
  ADD COLUMN IF NOT EXISTS session_notes_translation_provider VARCHAR(32);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message_original TEXT NOT NULL,
  client_language VARCHAR(12),
  message_internal_fr TEXT,
  translation_provider VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
