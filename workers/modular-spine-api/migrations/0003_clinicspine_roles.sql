-- Phase 3.3 — ClinicSpine role matrix (users extension)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  clinic_id TEXT,
  role TEXT CHECK(
    role IN ('backend_admin', 'vpo_administrator', 'office_supervisor', 'accountant', 'hr', 'therapist', 'patient')
  ),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
