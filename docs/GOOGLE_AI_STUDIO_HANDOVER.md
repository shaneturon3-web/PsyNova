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
