-- Jane App + Zoom wrapper (escaleta v1) — optional when USE_PERSISTENCE=true

CREATE TABLE IF NOT EXISTS jane_appointments (
  id TEXT PRIMARY KEY,
  external_uid TEXT,
  patient_label TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  zoom_meeting_id TEXT,
  join_url TEXT,
  provider_mode TEXT NOT NULL DEFAULT 'mock',
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jane_appt_day ON jane_appointments ((starts_at::date));
