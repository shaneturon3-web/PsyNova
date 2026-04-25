#!/bin/bash
set -euo pipefail

echo "Seeding deterministic QA fixtures into psynova-db..."

DB_CMD=(docker compose exec -T db psql -v ON_ERROR_STOP=1 -U psynova -d psynova)

# Optional cleanup for repeatable QA runs. Disable with RESET_TEST_DATA=false.
if [[ "${RESET_TEST_DATA:-true}" == "true" ]]; then
  echo "Resetting test-safe table: appointments"
  "${DB_CMD[@]}" <<'SQL'
TRUNCATE TABLE appointments RESTART IDENTITY;
SQL
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

echo "Fixture row counts:"
"${DB_CMD[@]}" <<'SQL'
SELECT 'clinics_fixture' AS label, COUNT(*) AS count
FROM clinics
WHERE id = '11111111-1111-1111-1111-111111111111'
UNION ALL
SELECT 'users_fixture' AS label, COUNT(*) AS count
FROM users
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
UNION ALL
SELECT 'appointments_fixture' AS label, COUNT(*) AS count
FROM appointments
WHERE id IN (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2'
);
SQL

echo "Seed complete."
