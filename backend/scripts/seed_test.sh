#!/bin/bash
set -euo pipefail

echo "Seeding deterministic QA fixtures into psynova-db..."

# Prefer `docker compose exec` when running from app/ with a compose file in CWD,
# fall back to `docker exec` against the named container so the script also works
# when invoked from app/backend/ or any other directory.
if docker compose -f "$(dirname "$0")/../../docker-compose.yml" ps db 2>/dev/null | grep -q ' Up'; then
  DB_CMD=(docker compose -f "$(dirname "$0")/../../docker-compose.yml" exec -T db psql -v ON_ERROR_STOP=1 -U psynova -d psynova)
else
  DB_CMD=(docker exec -i psynova-db psql -v ON_ERROR_STOP=1 -U psynova -d psynova)
fi

# Optional cleanup for repeatable QA runs. Disable with RESET_TEST_DATA=false.
# Order matters: child rows first so FK deletes cascade cleanly.
if [[ "${RESET_TEST_DATA:-true}" == "true" ]]; then
  echo "Resetting test-safe tables (workspace, clinical, billing, appointments)"
  "${DB_CMD[@]}" <<'SQL'
TRUNCATE TABLE
  cds_alerts, messages, message_threads,
  treatment_plan_goals, treatment_plans, clinician_availability,
  attachments, note_revisions, clinical_notes, consents,
  receipts, claim_events, claims, payments, invoice_items, invoices,
  appointments
RESTART IDENTITY CASCADE;
-- audit_events is append-only and intentionally NOT truncated;
-- the chain survives across reseeds. Set RESET_AUDIT=true to wipe it (manual override).
SQL
  if [[ "${RESET_AUDIT:-false}" == "true" ]]; then
    echo "RESET_AUDIT=true — wiping audit_events too"
    "${DB_CMD[@]}" <<'SQL'
ALTER TABLE audit_events DISABLE TRIGGER audit_events_no_update;
TRUNCATE audit_events RESTART IDENTITY;
ALTER TABLE audit_events ENABLE TRIGGER audit_events_no_update;
SQL
  fi
fi

"${DB_CMD[@]}" <<'SQL'
INSERT INTO clinics (id, name, province_code, created_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'PsyNova Virtual Clinic',
  'QC',
  '2026-01-01T00:00:00Z'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  province_code = EXCLUDED.province_code,
  created_at = EXCLUDED.created_at;

-- Legacy QA admin (kept for backwards-compat with older e2e suites).
INSERT INTO users (id, role, preferred_language, email, password_hash, created_at)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'admin',
  'en',
  'qa.user@psynova.local',
  'qa-fixed-salt:c3f5d50974240676c39c1a212ef5b6697b80f65e6560ef780251324b075e4946566beace2f59507b66a3d7c8d67618c633fd5d80863e59fb7599968d863a9ee1',
  '2026-01-01T00:00:00Z'
)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  preferred_language = EXCLUDED.preferred_language,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  created_at = EXCLUDED.created_at;

-- Deterministic test logins for the dev "Test accounts" page (#/app/test-accounts).
-- Hashes are scrypt(password, 'qa-fixed-salt', 64) to match AuthService.verifyPassword.
-- Plaintext credentials are intentionally NOT secret — these accounts are dev/test only.
--   patient.demo@psynova.local   / Patient!2026
--   clinician.demo@psynova.local / Clinician!2026   (id matches MOCK_CLINICIAN_ID seed)
--   admin.demo@psynova.local     / Admin!2026
INSERT INTO users (id, role, preferred_language, email, password_hash, created_at)
VALUES
  (
    'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
    'patient',
    'en',
    'patient.demo@psynova.local',
    'qa-fixed-salt:b26214d3efa49742937b9dc1f2346c4d866585749ae452979f3385b9e11e675ede0b74f53623b726f2fc42167385a99364b783c95769eaa19e0f8cee9d0cbc02',
    '2026-01-01T00:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000001',
    'clinician',
    'en',
    'clinician.demo@psynova.local',
    'qa-fixed-salt:603f2f0725d6c7c466fe0e58b4d86caf98890793207ecab180c264a54b600916fc968e0f85f26e5d0d9563e0f5b538502b42e139193f65ee465f6f50d5ded045',
    '2026-01-01T00:00:00Z'
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
    'admin',
    'en',
    'admin.demo@psynova.local',
    'qa-fixed-salt:621c802d3d956b0a348656aad5adf5f81ec8ece27e72255dd2a0bbc44b691a29d45e01d8f48f7100633f91f051173f0da4d23117d1d238ca2db834322e18cae1',
    '2026-01-01T00:00:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  preferred_language = EXCLUDED.preferred_language,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash;

INSERT INTO appointments (
  id,
  patient_id,
  clinician_id,
  starts_at,
  ends_at,
  status,
  service_category,
  created_at,
  session_notes_original,
  session_notes_client_language,
  session_notes_internal_fr,
  session_notes_translation_provider
)
VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '2026-05-01T14:00:00Z',
    '2026-05-01T15:00:00Z',
    'pending',
    'anxiety-support',
    '2026-05-01T13:55:00Z',
    'QA fixture note one',
    'en',
    'Note interne QA un',
    'fixture'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '2026-05-02T16:00:00Z',
    '2026-05-02T17:00:00Z',
    'confirmed',
    'depression-support',
    '2026-05-02T15:55:00Z',
    'QA fixture note two',
    'en',
    'Note interne QA deux',
    'fixture'
  ),
  -- Demo appointment between the seeded patient.demo and clinician.demo so both dashboards
  -- have something to render after seeding (closes deferred action item #2).
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
    '00000000-0000-4000-8000-000000000001',
    '2026-05-08T15:00:00Z',
    '2026-05-08T16:00:00Z',
    'confirmed',
    'anxiety-support',
    '2026-05-07T20:00:00Z',
    'Demo session: anxiety check-in.',
    'en',
    'Démonstration : suivi de l''anxiété.',
    'fixture'
  )
ON CONFLICT (id) DO UPDATE SET
  patient_id = EXCLUDED.patient_id,
  clinician_id = EXCLUDED.clinician_id,
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  status = EXCLUDED.status,
  service_category = EXCLUDED.service_category,
  created_at = EXCLUDED.created_at,
  session_notes_original = EXCLUDED.session_notes_original,
  session_notes_client_language = EXCLUDED.session_notes_client_language,
  session_notes_internal_fr = EXCLUDED.session_notes_internal_fr,
  session_notes_translation_provider = EXCLUDED.session_notes_translation_provider;
SQL

"${DB_CMD[@]}" <<'SQL'
-- ==========================================================================
-- Billing / EHR / Workspace demo fixtures (tied to patient.demo + clinician.demo).
-- All IDs are deterministic so the seed is idempotent + the SPA can deep-link.
-- ==========================================================================

-- 3 invoices for patient.demo (paid / open / overdue).
INSERT INTO invoices (id, patient_id, clinician_id, currency, subtotal_cents, tax_cents, total_cents, amount_paid_cents, status, notes, due_date, issued_at)
VALUES
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', '00000000-0000-4000-8000-000000000001', 'CAD', 15000, 0, 15000, 15000, 'paid',     'Demo: paid session',     CURRENT_DATE - 14, NOW() - INTERVAL '14 days'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', '00000000-0000-4000-8000-000000000001', 'CAD', 15000, 0, 15000,     0, 'open',     'Demo: open session',     CURRENT_DATE + 14, NOW() - INTERVAL '2 days'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', '00000000-0000-4000-8000-000000000001', 'CAD', 15000, 0, 15000,     0, 'open',     'Demo: overdue session',  CURRENT_DATE - 5,  NOW() - INTERVAL '21 days')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, amount_paid_cents = EXCLUDED.amount_paid_cents, updated_at = NOW();

INSERT INTO invoice_items (id, invoice_id, description, service_code, quantity, unit_price_cents, total_cents, position)
VALUES
  ('00000000-0000-4000-8000-000000001001', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'Individual psychotherapy session (50 min)', 'individual_session', 1, 15000, 15000, 0),
  ('00000000-0000-4000-8000-000000001002', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', 'Individual psychotherapy session (50 min)', 'individual_session', 1, 15000, 15000, 0),
  ('00000000-0000-4000-8000-000000001003', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3', 'Individual psychotherapy session (50 min)', 'individual_session', 1, 15000, 15000, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO payments (id, invoice_id, method, amount_cents, currency, external_id, status, notes, received_at)
VALUES ('00000000-0000-4000-8000-000000002001', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'manual', 15000, 'CAD', 'demo-pay-001', 'succeeded', 'Demo seed: marked paid', NOW() - INTERVAL '13 days')
ON CONFLICT (id) DO NOTHING;

-- 1 RAMQ claim mid-adjudication on the open invoice.
INSERT INTO claims (id, invoice_id, payer, payer_member_id, service_code, diagnosis_code, amount_cents, status, external_claim_id, submitted_at)
VALUES ('00000000-0000-4000-8000-000000003001', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', 'ramq', 'DEMO12345678', '99213', 'F41.1', 15000, 'submitted', 'sim_demo01', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW();

INSERT INTO claim_events (id, claim_id, event_type, payload_json)
VALUES ('00000000-0000-4000-8000-000000003101', '00000000-0000-4000-8000-000000003001', 'submitted', '{"payer":"ramq","amount":15000}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 2 clinical notes (one signed, one draft).
INSERT INTO clinical_notes (id, patient_id, clinician_id, note_type, subjective, objective, assessment, plan, signed_at, signed_by, signature_hash, created_at)
VALUES
  ('00000000-0000-4000-8000-000000004001', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', '00000000-0000-4000-8000-000000000001', 'soap',
    'Reports persistent worry, sleep onset 30-60 min.', 'Alert, oriented, cooperative.', 'GAD, moderate.',
    'Continue weekly CBT; PHQ-9 in 4 weeks.', NOW() - INTERVAL '7 days', '00000000-0000-4000-8000-000000000001',
    -- Deterministic fake SHA-256 (sha256 of "demo-signed-note-1") — pgcrypto isn't enabled.
    '76d2bce0ba6c2b6f5e92c8a6c5f53fcb7d7d5d5b7f4f1c2c6e7d9a8b8e7f5c4a', NOW() - INTERVAL '7 days'),
  ('00000000-0000-4000-8000-000000004002', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', '00000000-0000-4000-8000-000000000001', 'soap',
    'Improvement noted; still avoidant in groups.', 'Mood euthymic, affect congruent.', 'GAD improving.',
    'Practice grounding daily; revisit hierarchy.', NULL, NULL, NULL, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

INSERT INTO consents (id, patient_id, consent_type, consent_version, accepted, accepted_at, accepted_ip)
VALUES ('00000000-0000-4000-8000-000000005001', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'telehealth', '1', TRUE, NOW() - INTERVAL '7 days', '127.0.0.1')
ON CONFLICT (patient_id, consent_type, consent_version) DO NOTHING;

-- 2 availability blocks for clinician.demo.
INSERT INTO clinician_availability (id, clinician_id, block_type, weekday_mask, start_time, end_time, kind, notes)
VALUES ('00000000-0000-4000-8000-000000006001', '00000000-0000-4000-8000-000000000001', 'recurring', 31, '09:00', '17:00', 'available', 'Mon-Fri standard hours')
ON CONFLICT (id) DO NOTHING;
INSERT INTO clinician_availability (id, clinician_id, block_type, starts_at, ends_at, kind, notes)
VALUES ('00000000-0000-4000-8000-000000006002', '00000000-0000-4000-8000-000000000001', 'one_off', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '8 hours', 'blocked', 'Vacation day')
ON CONFLICT (id) DO NOTHING;

-- 1 treatment plan + 2 goals.
INSERT INTO treatment_plans (id, patient_id, clinician_id, title, diagnosis, start_date, status, notes)
VALUES ('00000000-0000-4000-8000-000000007001', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', '00000000-0000-4000-8000-000000000001',
        'Anxiety management — Q2', 'GAD', CURRENT_DATE - 14, 'active', 'Weekly CBT + homework')
ON CONFLICT (id) DO NOTHING;
INSERT INTO treatment_plan_goals (id, plan_id, description, status, position)
VALUES
  ('00000000-0000-4000-8000-000000007101', '00000000-0000-4000-8000-000000007001', 'Reduce PHQ-9 by 5 points by 30 days', 'in_progress', 0),
  ('00000000-0000-4000-8000-000000007102', '00000000-0000-4000-8000-000000007001', 'Practice grounding 5 min daily', 'in_progress', 1)
ON CONFLICT (id) DO NOTHING;

-- 1 message thread with 4 posts.
INSERT INTO message_threads (id, patient_id, clinician_id, subject, last_post_at)
VALUES ('00000000-0000-4000-8000-000000008001', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', '00000000-0000-4000-8000-000000000001', 'Demo: pre-session check-in', NOW() - INTERVAL '6 hours')
ON CONFLICT (id) DO NOTHING;
INSERT INTO messages (id, thread_id, sender_id, body, created_at, read_at)
VALUES
  ('00000000-0000-4000-8000-000000008101', '00000000-0000-4000-8000-000000008001', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'Hi — I had a tough week. Sleep again.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
  ('00000000-0000-4000-8000-000000008102', '00000000-0000-4000-8000-000000008001', '00000000-0000-4000-8000-000000000001', 'Thanks for letting me know — try the wind-down at 22:30 we discussed?', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('00000000-0000-4000-8000-000000008103', '00000000-0000-4000-8000-000000008001', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'Will try. See you Thursday.', NOW() - INTERVAL '12 hours', NULL),
  ('00000000-0000-4000-8000-000000008104', '00000000-0000-4000-8000-000000008001', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'Quick question about billing — got the receipt yet?', NOW() - INTERVAL '6 hours', NULL)
ON CONFLICT (id) DO NOTHING;

-- 1 unresolved CDS alert (matches the rule engine output for the unsigned recent note).
INSERT INTO cds_alerts (id, patient_id, clinician_id, rule_id, severity, message)
VALUES ('00000000-0000-4000-8000-000000009001', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', '00000000-0000-4000-8000-000000000001', 'manual_demo', 'info', 'Demo CDS alert — review treatment plan progress')
ON CONFLICT (id) DO NOTHING;
SQL

echo "Fixture row counts:"
"${DB_CMD[@]}" <<'SQL'
SELECT 'clinics_fixture' AS label, COUNT(*) AS count
FROM clinics
WHERE id = '11111111-1111-1111-1111-111111111111'
UNION ALL
SELECT 'users_fixture' AS label, COUNT(*) AS count
FROM users
WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  '00000000-0000-4000-8000-000000000001',
  'dddddddd-dddd-4ddd-8ddd-ddddddddddd1'
)
UNION ALL
SELECT 'appointments_fixture' AS label, COUNT(*) AS count
FROM appointments
WHERE id IN (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3'
)
UNION ALL SELECT 'invoices_fixture',        COUNT(*) FROM invoices         WHERE patient_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'
UNION ALL SELECT 'claims_fixture',          COUNT(*) FROM claims           WHERE id = '00000000-0000-4000-8000-000000003001'
UNION ALL SELECT 'notes_fixture',           COUNT(*) FROM clinical_notes   WHERE patient_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'
UNION ALL SELECT 'consents_fixture',        COUNT(*) FROM consents         WHERE patient_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'
UNION ALL SELECT 'availability_fixture',    COUNT(*) FROM clinician_availability WHERE clinician_id = '00000000-0000-4000-8000-000000000001'
UNION ALL SELECT 'plans_fixture',           COUNT(*) FROM treatment_plans  WHERE patient_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'
UNION ALL SELECT 'goals_fixture',           COUNT(*) FROM treatment_plan_goals WHERE plan_id = '00000000-0000-4000-8000-000000007001'
UNION ALL SELECT 'threads_fixture',         COUNT(*) FROM message_threads  WHERE patient_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'
UNION ALL SELECT 'messages_fixture',        COUNT(*) FROM messages         WHERE thread_id = '00000000-0000-4000-8000-000000008001'
UNION ALL SELECT 'cds_alerts_fixture',      COUNT(*) FROM cds_alerts       WHERE id = '00000000-0000-4000-8000-000000009001';
SQL

echo "Seed complete."
