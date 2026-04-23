-- DRAFT — Colonne motif de consultation (slug aligné sur frontend/src/service-categories.js)

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_category TEXT;

COMMENT ON COLUMN appointments.service_category IS 'DRAFT: slug from PsyNova service category catalog';
