-- [MOCKUP PURPOSE ONLY - NOT REAL DATA]
-- Billing schema: invoices, line items, payments, claims (RAMQ/insurer simulator),
-- pricing rules (sliding-scale), receipts. Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id),
  clinician_id UUID NOT NULL REFERENCES users(id),
  appointment_id UUID REFERENCES appointments(id),
  -- ISO currency code; CAD for QC mockup default. Stored amounts are in cents (BIGINT) to avoid float drift.
  currency CHAR(3) NOT NULL DEFAULT 'CAD',
  subtotal_cents BIGINT NOT NULL DEFAULT 0,
  tax_cents BIGINT NOT NULL DEFAULT 0,
  total_cents BIGINT NOT NULL DEFAULT 0,
  amount_paid_cents BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'paid', 'partial', 'void', 'uncollectible')),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  notes TEXT,
  due_date DATE,
  issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS invoices_patient_idx ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS invoices_clinician_idx ON invoices(clinician_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  service_code TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents BIGINT NOT NULL DEFAULT 0,
  total_cents BIGINT NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS invoice_items_invoice_idx ON invoice_items(invoice_id);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  -- 'stripe', 'manual', 'simulator'
  method TEXT NOT NULL DEFAULT 'manual',
  amount_cents BIGINT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'CAD',
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'succeeded'
    CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  notes TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS payments_invoice_idx ON payments(invoice_id);

CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payer TEXT NOT NULL DEFAULT 'ramq'
    CHECK (payer IN ('ramq', 'private_insurer', 'self_pay')),
  payer_member_id TEXT,
  service_code TEXT NOT NULL,
  diagnosis_code TEXT,
  amount_cents BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'adjudicating', 'accepted', 'rejected', 'paid', 'cancelled')),
  rejection_reason TEXT,
  external_claim_id TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  adjudicated_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS claims_invoice_idx ON claims(invoice_id);
CREATE INDEX IF NOT EXISTS claims_status_idx ON claims(status);

-- Append-only event log for claim transitions (debug + audit).
CREATE TABLE IF NOT EXISTS claim_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS claim_events_claim_idx ON claim_events(claim_id);

-- Sliding-scale price tiers. Service code maps to a base price; income brackets get discounts.
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code TEXT NOT NULL,
  description TEXT,
  base_price_cents BIGINT NOT NULL,
  -- JSON array of {minIncomeCents, maxIncomeCents | null, discountPct}
  sliding_scale JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (service_code)
);

CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  amount_cents BIGINT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'CAD',
  -- Path under ATTACHMENTS_DIR or absolute URL; deterministic for the mockup.
  pdf_url TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS receipts_invoice_idx ON receipts(invoice_id);

-- Default sliding-scale rule for the demo "individual_session" code.
INSERT INTO pricing_rules (id, service_code, description, base_price_cents, sliding_scale, active)
VALUES (
  '99999999-9999-4999-8999-999999999991',
  'individual_session',
  '50-min individual psychotherapy session',
  15000,
  '[
    {"minIncomeCents": 0, "maxIncomeCents": 3000000, "discountPct": 60},
    {"minIncomeCents": 3000000, "maxIncomeCents": 6000000, "discountPct": 30},
    {"minIncomeCents": 6000000, "maxIncomeCents": null, "discountPct": 0}
  ]'::jsonb,
  TRUE
)
ON CONFLICT (service_code) DO NOTHING;
