-- [MOCKUP PURPOSE ONLY - NOT REAL DATA]
-- Older volumes may have `users` without password_hash. Idempotent patch.

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
