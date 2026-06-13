-- [MOCKUP PURPOSE ONLY - NOT REAL DATA]

-- Minimal starter schema for PsyNova planning.
-- Replace with production migrations and hardened constraints.

CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  province_code CHAR(2) NOT NULL DEFAULT 'QC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL,
  preferred_language TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES users(id),
  clinician_id UUID NOT NULL REFERENCES users(id),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  service_category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
