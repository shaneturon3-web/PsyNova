-- [MOCKUP PURPOSE ONLY - NOT REAL DATA]

-- Seed placeholders only. Do not use real clinical data.

INSERT INTO clinics (id, name, province_code)
VALUES ('11111111-1111-1111-1111-111111111111', 'PsyNova Virtual Clinic', 'QC')
ON CONFLICT (id) DO NOTHING;
