# TECHNICAL IMPLEMENTATION ESCALETA: PSYNOVA & MODULAR SPINE ECOSYSTEM

## CRITICAL GLOBAL ERRATA CORRECTION

- **System-Wide Metric Audit**: Previous notes incorrectly stated "Professionals lose 6 hours daily to administrative abyss." This is a severe typo. The corrected, verified metric is **6 hours per week**.
- **Cursor Action**: Audit all project files, frontend strings, markdown files, templates, and code comments. Permanently replace any instance of "6 hours daily" with "6 hours per week". This ensures alignment with the Sugar Cubes Institute data and Pareto efficiency scoring.

---

## 1. PHASE 1: INFRASTRUCTURE HARDENING (P1–P4 GAPS)

### 1.1 Active R2 Storage Integration

- **Context**: Transition from metadata placeholders to active binary stream handling for clinical assets.
- **Configuration (wrangler.toml)**:

```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "psynova-storage-prod"
preview_bucket_name = "psynova-storage-preview"
```

- **Implementation Target (`src/handlers/storage.ts`)**: live PUT/GET binary stream handler.
- **Worker root**: `workers/modular-spine-api/` (Cloudflare Workers + D1 + R2).

### 1.2 Cloudflare Access & Zero Trust Perimeter

- **Context**: Enforce strict `PERIMETER_LOCK` across admin and professional dashboards.
- **Logic Flow**: IdP → Cloudflare Access JWT → Service Token → API Access.
- **Target**: `src/middleware/auth.ts` — validate `Cf-Access-Jwt-Assertion`, 401 on failure for `/admin/*` and `/professional/*`.

### 1.3 Production Cloudflare D1 Relational Migration

- **Context**: Replace static JSON mocks in handlers with D1 prepared statements.
- **Targets**: `getPatientRecords`, `getTherapistAvailability`, clinical notes routes.

### 1.4 Stripe Billing Recovery & Webhook Engine

- **D1 Schema**: `billing_recovery` table.
- **Target**: `src/handlers/billing.ts` — Stripe webhook with signature verification.

### 1.5 Telehealth Video Scaffolding

- **Context**: On `appointment_status === 'Confirmed'`, provision Daily.co room and persist URL in D1.
- **Target**: `src/utils/telehealth.ts` — `createTelehealthRoom()`.

---

## 2. PHASE 2: OPERATIONAL DEFICIT CLOSURE

### 2.1 Deterministic Health Check (`/api/health`)

- Parallel probes: D1 `SELECT 1`, R2 head/list, Stripe config ping. Single try/catch; 200 only when all pass.

### 2.2 Scheduled Worker Notification Automation

- Cron `0 9 * * *` — T-24h reminders, T+48h follow-ups via `src/cron/notifications.ts`.

### 2.3 Environment Parity Verification (Control Tower)

- `sync_control_tower.sh` — apply + `shipyard list --all` parity check.

---

## 3. PHASE 3: ADVANCED UNIT SCAFFOLDING (P4–P5)

### 3.1 Adaptive Wellness Gateway — `src/components/WellnessGateway.tsx`

### 3.2 SugarCube FTS — `migrations/0002_sugarcubes_fts.sql`, `src/handlers/sugarcubes.ts`

### 3.3 ClinicSpine Role Matrix — `migrations/0003_clinicspine_roles.sql`, RBAC in auth middleware

### 3.4 BureauForge Ledger — `src/utils/ledger.ts`

### 3.5 Gamification — `user_milestones` table, `src/utils/gamification.ts`

---

## Deployment Next Steps

1. Execute Phase 1 in order: R2 → Access → D1 handlers → Stripe → Telehealth.
2. Deploy: `cd workers/modular-spine-api && npx wrangler deploy`
3. Flagship SPA (`~/PsyNova/app/frontend`) remains READ-ONLY for layout refactors; edge API is additive.

**Canonical metric copy:** Recovering **6 Hours/Week** of Billable Capacity (never daily).
