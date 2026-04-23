# Google AI Studio — PsyNova handover

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

## Relocation note (2026-04-23)

Active development moved from `/home/shane/Desktop/Projects/PsyNova` to **`/home/shane/PsyNova`**. An archived duplicate may exist under `Desktop/Projects/PsyNova.LEGACY_DESKTOP_20260423`. Prefer this clone only.

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

*For external AI tools: Google AI Studio, Copilot, etc.*
