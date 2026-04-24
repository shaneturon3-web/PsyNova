# DOCS BUNDLE

Paths relative to `AI_STUDIO_RECOVERY_BUNDLE/`.

===== FILE: FILES_FOUND.md =====

```markdown
# AI Studio Recovery Bundle — `FILES_FOUND.md`

**Generated from canonical repo:** `/home/shane/PsyNova`  
**Bundle root:** `AI_STUDIO_RECOVERY_BUNDLE/` (relative to repo root)

---

## Requested items — existence

| Requested | Status | Notes |
|-----------|--------|--------|
| `app/backend/package.json` | **Present** | Exported |
| `app/frontend/package.json` | **Present** | Exported |
| `app/frontend/src/App.tsx` | **Absent** | No React; SPA uses `main.js` → `app.js` |
| `app/frontend/src/routes/` | **Absent** | No directory |
| `app/frontend/src/router/` | **Absent** | No directory |
| `app/frontend/src/pages/` | **Absent** | No directory |
| `app/frontend/src/views/` | **Absent** | No directory |
| `app/frontend/src/layout/` | **Absent** | No directory |
| `app/frontend/src/layouts/` | **Absent** | No directory |
| `app/frontend/src/components/` | **Absent** | No directory |

---

## Real frontend entrypoints (exported)

| Canonical path | Role |
|----------------|------|
| `app/frontend/index.html` | HTML entry |
| `app/frontend/vite.config.js` | Vite + `/api` proxy |
| `app/frontend/src/main.js` | JS bootstrap |
| `app/frontend/src/app.js` | Routing (hash), layout, views, auth UI, booking, gray modules |
| `app/frontend/src/api.js` | HTTP client, auth token, appointments API |
| `app/frontend/src/booking-wizard.js` | Booking / calendar UI (local widget, not Zoom) |
| `app/frontend/src/service-categories.js` | Service categories for booking |
| Other `src/*.js` | i18n, CMS, legal, disclaimers, etc. |
| `app/frontend/src/styles.css` | Global styles |

---

## Keyword-related exports (grep on `app/`)

Included in this bundle where they are primary source:

- **Auth (backend):** `app/backend/src/auth/**`, `app/backend/src/main.ts`, `app.module.ts`
- **Appointments / booking:** `app/backend/src/appointments/**`, `app/frontend/src/booking-wizard.js`, `app.js`, `api.js`, `service-categories.js`
- **Billing / payment:** No dedicated integration files; UI placeholders in `app.js` — exported via full `app.js`
- **Zoom / video:** No SDK; copy mentions in `app.js` / i18n only — covered by exported `app.js`, `i18n.js`, mockup spec report
- **Patient / clinic:** Domain copy and routes in `app.js`, `site-content.js`, CMS seeds (not full CMS export); **PII** appears in policy sense in `app/docs/architecture.md`

**Also exported:**

- `app/docs/architecture.md` (mentions PII minimization at architecture level)
- `app/docs/ai-assistant.md`
- `app/ops/reports/PSYNOVA_MOCKUP_SPEC_CHATGPT_LINK_v01.md` (wired vs gray modules)
- `docs/repo/GOOGLE_AI_STUDIO_HANDOVER.md` (copy of repo `docs/GOOGLE_AI_STUDIO_HANDOVER.md`)

---

## Exact files in this bundle (relative to `AI_STUDIO_RECOVERY_BUNDLE/`)

```
app/backend/package.json
app/backend/src/app.module.ts
app/backend/src/main.ts
app/backend/src/appointments/appointments.controller.ts
app/backend/src/appointments/appointments.module.ts
app/backend/src/appointments/appointments.service.ts
app/backend/src/appointments/dto/create-appointment.dto.ts
app/backend/src/appointments/dto/list-appointments-query.dto.ts
app/backend/src/auth/auth.controller.ts
app/backend/src/auth/auth.module.ts
app/backend/src/auth/auth.service.ts
app/backend/src/auth/dev-auth-bypass.ts
app/backend/src/auth/dto/login.dto.ts
app/backend/src/auth/dto/register.dto.ts
app/backend/src/auth/guards/auth-token.guard.ts
app/docs/ai-assistant.md
app/docs/architecture.md
app/frontend/.env.example
app/frontend/index.html
app/frontend/package.json
app/frontend/vite.config.js
app/frontend/src/api.js
app/frontend/src/app.js
app/frontend/src/booking-wizard.js
app/frontend/src/cms-admin-panel.js
app/frontend/src/cms-api.js
app/frontend/src/cms-util.js
app/frontend/src/disclaimers.js
app/frontend/src/i18n.js
app/frontend/src/legal-content.js
app/frontend/src/main.js
app/frontend/src/mockup-banner.js
app/frontend/src/service-categories.js
app/frontend/src/site-content.js
app/frontend/src/styles.css
app/frontend/src/translate-widget.js
app/ops/reports/PSYNOVA_MOCKUP_SPEC_CHATGPT_LINK_v01.md
docs/repo/GOOGLE_AI_STUDIO_HANDOVER.md
FILES_FOUND.md
STUDIO_FIRST_MESSAGE.md
STUDIO_ORIENTATION.md
```

At repo root (sibling of this folder): **`AI_STUDIO_RECOVERY_BUNDLE.zip`** archives the entire `AI_STUDIO_RECOVERY_BUNDLE/` directory.

*(This inventory includes the markdown files above.)*

---

## Missing requested files (summary)

- `app/frontend/src/App.tsx`
- Any of: `routes/`, `router/`, `pages/`, `views/`, `layout/`, `layouts/`, `components/` under `app/frontend/src/`

Use **`main.js`** and **`app.js`** as the authoritative SPA entry and shell.
```

===== FILE: STUDIO_FIRST_MESSAGE.md =====

```markdown
# STUDIO_FIRST_MESSAGE.md — paste into Google AI Studio

Copy the block below into a new chat (after uploading **`AI_STUDIO_RECOVERY_BUNDLE.zip`** or the bundle folder).

---

The workspace you were using before was **not** the real PsyNova codebase. The files attached here are **raw exports** from the canonical repository at **`/home/shane/PsyNova`**.

**Instructions:**

1. Treat these files as the **authoritative baseline** for PsyNova (NestJS backend under `app/backend`, Vite + **vanilla JavaScript** frontend under `app/frontend` — there is **no** `App.tsx` and no `routes/` / `components/` tree under `src/`).
2. **Do not** regenerate the architecture, stack, or folder layout from scratch. **Do not** assume React unless you see React dependencies in the exported `package.json` files (the frontend only lists Vite).
3. Read **`STUDIO_ORIENTATION.md`** and **`FILES_FOUND.md`** in the bundle for what exists vs what was missing from generic templates.
4. Primary SPA entry: **`app/frontend/src/main.js`** → **`app/frontend/src/app.js`**. API client: **`app/frontend/src/api.js`**.

If something is not in the bundle, it still lives in the full clone under `/home/shane/PsyNova` — ask for specific paths instead of inventing files.

---
```

===== FILE: STUDIO_ORIENTATION.md =====

```markdown
# STUDIO_ORIENTATION.md — PsyNova canonical source

## Canonical repository

**Path on disk:** `/home/shane/PsyNova`

This is the only authoritative Git working tree. Do not assume a blank Vite/React prototype or a path under `Desktop/Projects/PsyNova` (obsolete).

## Real project structure (subset)

```
/home/shane/PsyNova/
  app/
    backend/          # NestJS API (package.json, src/main.ts, auth/, appointments/, …)
    frontend/         # Vite + vanilla JavaScript (no App.tsx, no React router folders)
      src/main.js     # browser entry
      src/app.js      # hash routing + UI composition
      src/api.js      # fetch + auth header + appointments
      src/booking-wizard.js
    database/         # SQL (not fully exported in this bundle)
    docs/             # product/architecture docs
    ops/              # runbooks, reports
  docs/               # repo-root docs (e.g. GOOGLE_AI_STUDIO_HANDOVER.md)
  backend/            # symlink → app/backend (in full repo only; bundle uses app/backend paths)
```

## About the incorrect Studio workspace

If Google AI Studio was opened on an empty project, a generic React template, or paths that do not match the tree above, that workspace was **wrong**. The files in **`AI_STUDIO_RECOVERY_BUNDLE/`** are **raw exports** from the real repo and override any assumed scaffold.

## Source of truth

- Use the **exported files in this bundle** (and the full clone at `/home/shane/PsyNova` when available) as the **only** baseline for PsyNova behavior, dependencies, and file layout.
- **Do not** rebuild architecture, folder layout, or tech stack from scratch. Extend and edit the existing Nest + vanilla Vite codebase.

## Bootstrap prompt

See **`docs/repo/GOOGLE_AI_STUDIO_HANDOVER.md`** → **Section 8 — AI Studio Bootstrap Prompt** in the full repo, or paste from there after syncing the canonical clone.
```

===== FILE: app/docs/ai-assistant.md =====

```markdown
# AI Assistant Specification

## Virtual Psychology Platform – Montréal, Québec

### Purpose

The PsyNova assistant supports intake guidance, booking help, and non-clinical navigation for patients and administrators.

---

### Language Coverage

* English
* French
* Spanish (interface and assistant only)

**Note:** Psychological services are delivered exclusively in English and French.

---

### Safety Constraints

* No medical diagnosis output
* No crisis intervention advice
* Escalate crisis-related requests to emergency resources and human support workflows
* Avoid legal and clinical claims beyond approved content

---

### Required Placeholder Tag

All generated placeholder content must include:

**[MOCKUP PURPOSE ONLY – NOT REAL DATA]**

---

### Baseline System Prompt

```text
You are a multilingual virtual assistant for a virtual psychology clinic based in Montréal. Services are offered only in English and French. Include the tag: [MOCKUP PURPOSE ONLY – NOT REAL DATA] in all generated content.
```
```

===== FILE: app/docs/architecture.md =====

```markdown
# Architecture Overview

## Scope

PsyNova is an online-only virtual psychology clinic platform for Quebec.

## High-Level Components

- WordPress public site (`frontend/wordpress`)
- Patient portal frontend (`frontend/patient-portal`)
- NestJS backend API (`backend/src`)
- PostgreSQL data layer (`database`)
- Third-party integrations (`integrations`)
- Infrastructure definitions (`infrastructure`)
- Legal and compliance assets (`legal`)

## Core Functional Domains

- Identity and access management
- Appointment booking and scheduling
- Secure messaging
- Clinical records and document handling
- Billing and payment orchestration
- Telehealth session integration
- AI assistant (non-diagnostic support only)

## Non-Functional Priorities

- Security by default
- Privacy by design
- Bilingual clinical operations (EN/FR)
- Scalable cloud deployment in Canada
- Accessibility (WCAG 2.1)

## Data and Privacy Guardrails

- Data residency target: Canada region (`ca-central-1`)
- Encrypt data in transit and at rest
- Role-based access controls for clinicians and staff
- Audit logging for sensitive operations
- Minimize personally identifiable information exposure
```

===== FILE: app/ops/reports/PSYNOVA_MOCKUP_SPEC_CHATGPT_LINK_v01.md =====

```markdown
---
title: "PsyNova Virtual Clinic — Mockup specification & ChatGPT link note"
date: 2026-04-09
---

# 1. ChatGPT shared link — ingestion result

**URL:** `https://chatgpt.com/s/t_69d80eac14688191a31ec7918b49abd1`

**Result:** The public fetch of this URL does not return the conversation body. ChatGPT shared links typically require an authenticated session or execute content in the browser. **No design text could be extracted** for automated implementation.

**Action taken:** Implementation follows `ops/CHATGPT_UI_DESIGN_BRIEF_v01.txt`, the project README vision, and existing NestJS endpoints (`/api/auth/*`, `/api/appointments`, `/api/health`).

---

# 2. Design brief summary (internal source)

- **Goal:** Navigable shell for human review; features not yet built appear **disabled / gray** with clear copy.
- **Tag:** `[MOCKUP PURPOSE ONLY - NOT REAL DATA]` on all mock surfaces.
- **Connected today:** Register, login, token session, `/api/auth/me`, list/create appointments (with Bearer token), health.
- **Gray / not wired:** Secure messaging, telehealth session, billing, EHR, clinician admin tools, AI assistant, insurance flows.

---

# 3. Implementation (functional mockup)

| Area | Behaviour |
|------|-----------|
| **Frontend** | Vite SPA, hash routes, vanilla ES modules under `frontend/src/`. |
| **API** | `fetch` to `http://localhost:3000/api/*` with optional Bearer token. |
| **CORS** | Enabled in `backend/src/main.ts` for dev ports 5173 / 4173. |
| **Live features** | Login, register, logout, session banner, appointments list + create demo row (UUIDs for patient/clinician per DTO). |
| **Gray modules** | Messages, telehealth, billing, EHR, clinician workspace, admin — navigable but disabled with `aria-disabled` and tooltips. |

---

# 4. Run locally

```bash
# Terminal A — backend (or use docker compose for backend + db)
cd virtual-psychology-clinic/backend && npm install && npm run start:dev

# Terminal B — frontend
cd virtual-psychology-clinic/frontend && npm install && npm run dev
```

Open `http://localhost:5173`. Backend: `http://localhost:3000/api/health`.

---

# 5. Compliance note

This document is a **technical mockup specification**, not clinical or legal advice. Production use requires Quebec Law 25 / PIPEDA / HIPAA-aligned review.

**End of document.**
```

===== FILE: docs/repo/GOOGLE_AI_STUDIO_HANDOVER.md =====

```markdown
# Google AI Studio — PsyNova handover

**External AI tools should start from Section 8.**

**Canonical Git working tree:** `/home/shane/PsyNova`  
**Application code:** `app/` (Nest API in `app/backend`, Vite UI in `app/frontend`).  
**Shortcut:** `backend/` at repo root is a **symlink** to `app/backend` (paths like `backend/src/auth/...` resolve here).

---

## What PsyNova is

Mockup virtual psychology platform (Québec-oriented). NestJS REST API (`/api`), PostgreSQL, Vite + vanilla JS SPA. Responses carry **MOCKUP-PURPOSE-ONLY** semantics — no real clinical services.

---

## Auth (agents must read)

- **No Passport.** Custom tokens in `AuthService`.
- **Dev bypass:** `backend/src/auth/dev-auth-bypass.ts` — when `NODE_ENV=development` or `DISABLE_AUTH=true`, guards inject a mock user; `verifyAccessToken` aligns.
- **Guards:** `backend/src/auth/guards/auth-token.guard.ts`, `backend/src/cms/admin.guard.ts`.
- **Env template:** `backend/.env.example` → copy to `backend/.env`.

---

## Canonical path

Use **`/home/shane/PsyNova`** as the only Git working tree for active work. Older Desktop `Projects/PsyNova` paths are obsolete and must not be used in runbooks or tooling.

---

## Run (short)

- DB: `cd app && docker compose up -d`
- API: `cd app/backend && npm install && npm run start:dev` (port **3000**; see `app/ops/port_guard_3000.sh`)
- UI: `cd app/frontend && npm install && npm run dev` (**5173**)

---

## Read next

- `README.md`, `app/README.md`
- `backend/src/main.ts`, `backend/src/app.module.ts`
- Root `HANDOVER_PACKAGE/` if present (extended collaborator pack)

---

## Section 8 — AI Studio Bootstrap Prompt

Paste the block below as the system instruction or first message in Google AI Studio (after attaching or syncing this repo).

```text
You are assisting on **PsyNova Virtual Clinic**, a **mockup** Québec-oriented virtual psychology platform.

**Canonical clone layout**

- **Absolute path (Shane’s machine):** `/home/shane/PsyNova` — treat as the canonical Git root; other clones should mirror this layout.
- Repository root contains `app/`, `exports/`, `recovery/`, `registry/`, `docs/`, etc.
- **Working codebase:** `app/` — `backend/`, `frontend/`, `database/`, `docker-compose.yml`, `app/docs/`, `app/ops/`.
- Repo root **`backend/`** is a symlink to **`app/backend`** (same files).

**Project summary**

- **Backend:** NestJS 11, REST API under global prefix `/api`, Swagger at `/api/docs`, custom JWT-like tokens (**no Passport**), PostgreSQL via `pg`, optional DeepL/Google translate env keys.
- **Frontend:** Vite 5, **vanilla JavaScript only** — **there is no `App.tsx`**. Main UI is `app/frontend/src/app.js`; API client is `app/frontend/src/api.js`; booking flow is `booking-wizard.js`.
- **Database:** SQL in `app/database/`, applied via Docker init scripts or `app/backend/scripts/migrate.sh` + `seed_test.sh`.
- **Disclaimer:** All responses should respect **MOCKUP-PURPOSE-ONLY** / **[MOCKUP PURPOSE ONLY – NOT REAL DATA]** framing for clinical/product claims.

**Current status (filesystem-backed)**

- Backend **e2e** may be run via `app/ops/run_backend_checks.sh`; logs under `app/ops/logs/` when present.
- **Persistence:** enabled in `app/backend/.env.example` via `USE_PERSISTENCE=true`; real `.env` is gitignored.
- **Dev auth bypass:** Active when `NODE_ENV=development` OR `DISABLE_AUTH=true`. Implemented in `auth/dev-auth-bypass.ts`, `AuthTokenGuard`, and short-circuit in `AuthService.verifyAccessToken`. **Not for production** without explicit review.

**Architecture (short)**

- Modules: `DatabaseModule`, `AuthModule`, `CmsModule`, `TranslationModule`, `FormsModule`, `AppointmentsModule`, `HealthModule` (`app.module.ts`).
- **Port 3000:** exactly **one** listener — Docker `backend` profile **or** host `npm run start:dev` (`port_guard_3000.sh`).
- **Frontend dev:** Vite **5173**, proxies `/api` to **127.0.0.1:3000**.

**Key requirements**

- Node + npm for backend/frontend; Docker for Postgres (and optional WordPress / containerized API).
- Copy `app/backend/.env.example` → `app/backend/.env` and follow `app/README.md` for root env before running.

**Files to inspect first (exact paths, relative to repo root)**

1. `app/README.md`
2. `app/backend/src/main.ts`
3. `app/backend/src/app.module.ts`
4. `app/backend/src/auth/auth.service.ts`
5. `app/backend/src/auth/dev-auth-bypass.ts`
6. `app/backend/src/auth/guards/auth-token.guard.ts`
7. `app/frontend/src/app.js`
8. `app/frontend/src/api.js`
9. `app/frontend/src/booking-wizard.js`
10. `app/frontend/vite.config.js`
11. `app/docker-compose.yml`
12. `app/database/schema.sql`

**Known constraints**

- **No Zoom, Stripe, or PayPal integration** in repo dependencies; UI shows gray placeholders for telehealth/billing.
- **Booking** is internal wizard + `appointments` API, not an external calendar product.
- **Two `ops/` trees:** repo root `ops/` vs **`app/ops/`** — primary runbooks for the app are under **`app/ops/`**.

**Fixes already applied (high level)**

- Consolidated monorepo with `app/` as live code (`FIRST_COMMIT_SUMMARY.md`).
- DB local-dev template uses `DB_HOST=localhost` + `USE_PERSISTENCE=true` (avoid host-using `psynova-db` + persistence-off loop documented in `registry/PSYNOVA_FIX_DB_20260411_184053/`).
- Port 3000 guard; verify with current `app/ops/logs/` e2e output when available.

**When editing**

- Prefer minimal diffs; match Nest and existing JS patterns.
- Never claim Zoom/billing are implemented without pointing to actual code.
- Treat dev auth bypass as **temporary**; flag for removal or hard gating before production.
```

---

*For external AI tools: Google AI Studio, Copilot, etc.*
```
