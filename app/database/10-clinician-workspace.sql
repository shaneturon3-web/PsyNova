-- [MOCKUP PURPOSE ONLY - NOT REAL DATA]
-- Clinician Workspace schema: availability blocks, treatment plans + goals,
-- secure messaging (threads + posts), CDS alerts. Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS clinician_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinician_id UUID NOT NULL REFERENCES users(id),
  -- 'recurring' uses weekday_mask + start_time + end_time. 'one_off' uses starts_at + ends_at.
  block_type TEXT NOT NULL DEFAULT 'one_off'
    CHECK (block_type IN ('recurring', 'one_off')),
  -- Bitmask: 1=Mon, 2=Tue, 4=Wed, 8=Thu, 16=Fri, 32=Sat, 64=Sun. Sum for multiple days.
  weekday_mask INTEGER,
  start_time TIME,
  end_time TIME,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  -- 'available' or 'blocked' (vacation, admin time, etc.)
  kind TEXT NOT NULL DEFAULT 'available'
    CHECK (kind IN ('available', 'blocked')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS clinician_availability_clinician_idx ON clinician_availability(clinician_id);

CREATE TABLE IF NOT EXISTS treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id),
  clinician_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  diagnosis TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS treatment_plans_patient_idx ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS treatment_plans_clinician_idx ON treatment_plans(clinician_id);

CREATE TABLE IF NOT EXISTS treatment_plan_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('not_started', 'in_progress', 'achieved', 'abandoned')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS treatment_plan_goals_plan_idx ON treatment_plan_goals(plan_id);

CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id),
  clinician_id UUID NOT NULL REFERENCES users(id),
  subject TEXT,
  appointment_id UUID REFERENCES appointments(id),
  last_post_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS message_threads_patient_idx ON message_threads(patient_id);
CREATE INDEX IF NOT EXISTS message_threads_clinician_idx ON message_threads(clinician_id);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS messages_thread_idx ON messages(thread_id);

-- Deterministic CDS alerts; populated by the rule engine in ClinicianWorkspaceService.
CREATE TABLE IF NOT EXISTS cds_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id),
  clinician_id UUID REFERENCES users(id),
  rule_id TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS cds_alerts_patient_idx ON cds_alerts(patient_id);
CREATE INDEX IF NOT EXISTS cds_alerts_clinician_idx ON cds_alerts(clinician_id);
CREATE INDEX IF NOT EXISTS cds_alerts_unresolved_idx ON cds_alerts(resolved_at) WHERE resolved_at IS NULL;
