# Simulator guide

> [MOCKUP PURPOSE ONLY - NOT REAL DATA]
>
> The `SimController` (`app/backend/src/sim/sim.controller.ts`) exposes
> `/api/sim/*` endpoints that let QA force backend state transitions without
> involving any third party. Every endpoint returns **404 in production**
> (`NODE_ENV=production`); the rest of the time they're available unauthenticated
> so you can curl freely.

This file is the cheat-sheet for the simulator. For provider sandbox setup
(Stripe, Twilio, Zoom, etc.) see `PROVIDER_SANDBOX_SETUP.md`.

---

## Status / discovery

```bash
curl -s http://localhost:3000/api/sim/status | jq
```

Returns row counts for the new tables and a hint string listing every simulator
endpoint. Useful as a smoke test after seeding.

---

## Billing

### Pretend Stripe webhook fired (mark invoice paid)

```bash
curl -sX POST http://localhost:3000/api/sim/billing/stripe-webhook \
  -H 'Content-Type: application/json' \
  -d '{"invoiceId":"<INVOICE_ID>"}' | jq
```

Inserts a `simulator` payment for the full outstanding balance, recomputes the
invoice's `amount_paid_cents` + `status`, and appends an `audit_events` row with
`action=invoice.paid source=simulator`.

### Adjudicate a RAMQ / insurer claim

```bash
curl -sX POST http://localhost:3000/api/sim/billing/ramq-adjudicate \
  -H 'Content-Type: application/json' \
  -d '{"claimId":"<CLAIM_ID>","outcome":"accepted"}' | jq

curl -sX POST http://localhost:3000/api/sim/billing/ramq-adjudicate \
  -H 'Content-Type: application/json' \
  -d '{"claimId":"<CLAIM_ID>","outcome":"rejected","reason":"diagnosis code 296.21 not covered"}' | jq

curl -sX POST http://localhost:3000/api/sim/billing/ramq-adjudicate \
  -H 'Content-Type: application/json' \
  -d '{"claimId":"<CLAIM_ID>","outcome":"paid"}' | jq
```

`outcome` ∈ `accepted | rejected | paid`. Logs a `claim_events` row +
`audit_events` row each time. RAMQ has no public sandbox so this is the only way
to exercise the claim lifecycle.

---

## Clinical records

### Drop a sample attachment for a patient (no upload UI needed)

```bash
curl -sX POST http://localhost:3000/api/sim/clinical/upload-mock-attachment \
  -H 'Content-Type: application/json' \
  -d '{"patientId":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1"}' | jq
```

Writes a small text file to `ATTACHMENTS_DIR` and inserts a row in `attachments`
referencing it. Useful for verifying the chart view + attachment download path.

### Demonstrate audit-log tamper detection

```bash
curl -sX POST http://localhost:3000/api/sim/clinical/audit-tamper-attempt | jq
```

Issues an `UPDATE audit_events SET payload_json = ...` against the most recent
row. The `audit_events_no_update` trigger (defined in
`app/database/09-clinical-records.sql`) raises an exception, and the simulator
returns `ok: true, attempted: true, rejectedBy: "audit_events_no_update trigger"`.
Then verify the chain is still intact:

```bash
curl -s http://localhost:3000/api/clinical/audit/verify | jq
# { "ok": true, "total": <N>, "tag": "MOCKUP-PURPOSE-ONLY" }
```

---

## Workspace

### Seed extra caseload for a clinician

```bash
curl -sX POST http://localhost:3000/api/sim/workspace/seed-caseload \
  -H 'Content-Type: application/json' \
  -d '{"clinicianId":"00000000-0000-4000-8000-000000000001","patientId":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1"}' | jq
```

Adds 2 appointments (one in the past, one in 3 days) so the clinician dashboard
isn't empty.

---

## End-to-end demo walkthrough

The shortest happy-path sequence to demo the new modules without any third-party
account:

```bash
# 1. Sign in
TOKEN=$(curl -sX POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"clinician.demo@psynova.local","password":"Clinician!2026"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["accessToken"])')

# 2. Quote a sliding-scale price
curl -s "http://localhost:3000/api/billing/quote?serviceCode=individual_session&annualIncomeCents=2500000" \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Create an invoice
INVOICE=$(curl -sX POST http://localhost:3000/api/billing/invoices \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"patientId":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1","clinicianId":"00000000-0000-4000-8000-000000000001","items":[{"description":"50-min session","quantity":1,"unitPriceCents":15000}]}' )
INVOICE_ID=$(echo "$INVOICE" | python3 -c 'import sys,json;print(json.load(sys.stdin)["invoice"]["id"])')
echo "invoice: $INVOICE_ID"

# 4. Pretend Stripe paid it
curl -sX POST http://localhost:3000/api/sim/billing/stripe-webhook \
  -H 'Content-Type: application/json' -d "{\"invoiceId\":\"$INVOICE_ID\"}" | jq

# 5. Submit a RAMQ claim, then adjudicate
CLAIM=$(curl -sX POST "http://localhost:3000/api/billing/invoices/$INVOICE_ID/claims" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"serviceCode":"99213","payer":"ramq","diagnosisCode":"F41.1"}' )
CLAIM_ID=$(echo "$CLAIM" | python3 -c 'import sys,json;print(json.load(sys.stdin)["claim"]["id"])')
curl -sX POST http://localhost:3000/api/sim/billing/ramq-adjudicate \
  -H 'Content-Type: application/json' -d "{\"claimId\":\"$CLAIM_ID\",\"outcome\":\"accepted\"}" | jq

# 6. Write + sign a SOAP note
NOTE=$(curl -sX POST http://localhost:3000/api/clinical/notes \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"patientId":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1","clinicianId":"00000000-0000-4000-8000-000000000001","noteType":"soap","subjective":"Reports anxiety in social situations.","objective":"Alert, oriented, cooperative.","assessment":"Generalized anxiety, moderate.","plan":"Continue CBT weekly; revisit PHQ-9 in 4 weeks."}' )
NOTE_ID=$(echo "$NOTE" | python3 -c 'import sys,json;print(json.load(sys.stdin)["note"]["id"])')
curl -sX POST "http://localhost:3000/api/clinical/notes/$NOTE_ID/sign" -H "Authorization: Bearer $TOKEN" | jq

# 7. Try to tamper with the audit log (should be rejected)
curl -sX POST http://localhost:3000/api/sim/clinical/audit-tamper-attempt | jq

# 8. Verify chain integrity
curl -s http://localhost:3000/api/clinical/audit/verify | jq

# 9. Pull receipt PDF
curl -s -o /tmp/psynova-receipt.pdf "http://localhost:3000/api/billing/invoices/$INVOICE_ID/receipt.pdf" \
  -H "Authorization: Bearer $TOKEN"
file /tmp/psynova-receipt.pdf
```
