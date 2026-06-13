-- Phase 1.3 + 1.4 + 3.3 (core) — modular spine edge D1

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  pseudonym TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  therapist_id TEXT NOT NULL,
  patient_id TEXT,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  appointment_status TEXT NOT NULL DEFAULT 'pending',
  telehealth_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  clinician_id TEXT,
  note_type TEXT NOT NULL DEFAULT 'session',
  body_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS billing_recovery (
  id TEXT PRIMARY KEY,
  stripe_session_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  payment_status TEXT CHECK(payment_status IN ('pending', 'succeeded', 'failed')),
  retry_count INTEGER DEFAULT 0,
  last_attempt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clinics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  admin_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_milestones (
  user_id TEXT PRIMARY KEY,
  billable_hours_total REAL DEFAULT 0,
  client_volume_total INTEGER DEFAULT 0,
  current_strata TEXT DEFAULT 'solo',
  upgrade_eligible INTEGER DEFAULT 0
);

INSERT OR IGNORE INTO patients (id, display_name) VALUES
  ('pat-demo-1', 'Patient A.M.'),
  ('pat-demo-2', 'Patient B.K.');

INSERT OR IGNORE INTO schedules (id, therapist_id, patient_id, starts_at, appointment_status) VALUES
  ('sch-demo-1', 'thr-1', 'pat-demo-1', datetime('now', '+1 day'), 'Confirmed'),
  ('sch-demo-2', 'thr-1', 'pat-demo-2', datetime('now', '+2 day'), 'pending');
