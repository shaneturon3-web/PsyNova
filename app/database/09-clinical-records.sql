-- [MOCKUP PURPOSE ONLY - NOT REAL DATA]
-- Clinical Records schema: notes (intake/SOAP/progress/assessment), revisions,
-- consents, attachments (file metadata; bytes live under ATTACHMENTS_DIR), and an
-- append-only audit log with a sha256 hash chain for tamper evidence.
-- Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id),
  clinician_id UUID NOT NULL REFERENCES users(id),
  appointment_id UUID REFERENCES appointments(id),
  note_type TEXT NOT NULL
    CHECK (note_type IN ('intake', 'soap', 'progress', 'assessment')),
  -- For SOAP: subjective/objective/assessment/plan. For others: free body + optional title.
  title TEXT,
  body TEXT,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  -- HMAC-SHA256 over canonical JSON of the note at sign time. Locks future edits.
  signed_at TIMESTAMPTZ,
  signed_by UUID REFERENCES users(id),
  signature_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS clinical_notes_patient_idx ON clinical_notes(patient_id);
CREATE INDEX IF NOT EXISTS clinical_notes_clinician_idx ON clinical_notes(clinician_id);
CREATE INDEX IF NOT EXISTS clinical_notes_type_idx ON clinical_notes(note_type);

CREATE TABLE IF NOT EXISTS note_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES clinical_notes(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL REFERENCES users(id),
  revision_number INTEGER NOT NULL,
  body_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (note_id, revision_number)
);

CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id),
  consent_type TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  -- TRUE if accepted; FALSE rows record explicit refusal.
  accepted BOOLEAN NOT NULL DEFAULT TRUE,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_ip TEXT,
  accepted_user_agent TEXT,
  notes TEXT,
  UNIQUE (patient_id, consent_type, consent_version)
);
CREATE INDEX IF NOT EXISTS consents_patient_idx ON consents(patient_id);

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id),
  uploader_id UUID NOT NULL REFERENCES users(id),
  note_id UUID REFERENCES clinical_notes(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size BIGINT NOT NULL,
  -- Path relative to ATTACHMENTS_DIR; the API never returns this verbatim, only the id.
  storage_path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS attachments_patient_idx ON attachments(patient_id);
CREATE INDEX IF NOT EXISTS attachments_note_idx ON attachments(note_id);

-- Append-only audit log with sha256 hash chain.
-- current_hash = sha256(prev_hash || canonical_payload). The trigger below blocks
-- UPDATE/DELETE so any tampering attempt fails loudly (sim/audit-tamper-attempt).
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  payload_json JSONB,
  prev_hash TEXT,
  current_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_events_entity_idx ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_events_actor_idx ON audit_events(actor_id);
CREATE INDEX IF NOT EXISTS audit_events_created_idx ON audit_events(created_at);

CREATE OR REPLACE FUNCTION audit_events_block_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only (tamper attempt blocked: %)', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_events_no_update ON audit_events;
CREATE TRIGGER audit_events_no_update
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW EXECUTE FUNCTION audit_events_block_mutation();
