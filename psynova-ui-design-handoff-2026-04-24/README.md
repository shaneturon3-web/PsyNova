# PsyNova — UI design handoff package

This archive is for someone who **cannot access GitHub** and needs the **relevant source files** plus a **map** from common SPA folder names to this repository’s actual layout.

## What’s inside

| Path in this package | Contents |
|---------------------|----------|
| `REPO_MAP.md` | **Read first:** how `src/`, `components/`, `pages/`, `routes`, `api`, `auth`, `booking`, and `therapist` ideas map to real files; full route list. |
| `frontend/` | Vite SPA: `index.html`, `src/*.js`, `styles.css`, `vite.config.js`, `package.json` (no `node_modules`). |
| `backend/` | NestJS API: `src/**`, configs (no `node_modules`, no `.env` — use `.env.example`). |

## Stack (short)

- **Frontend:** Vanilla JS + Vite, **not** React. There is no `components/` or `pages/` directory; views are **functions** in `app-legacy.js` (and optional `compliance-gateway.js` when `VITE_SPA_MODE=gateway`).
- **Routing:** Hash-based (`#/about`, `#/book`, etc.), implemented in `app-legacy.js` (`render()` + `view*` functions).
- **API:** `frontend/src/api.js` calls the backend; auth token in `localStorage`.
- **Backend:** NestJS under `backend/src` (`auth/`, `appointments/`, `cms/`, etc.).

## Constraints for design work (from product owner)

- **Preserve** existing routes, mock API behavior, copy/wording, and **safety / legal disclaimers** (see `disclaimers.js`, `legal-content.js`, `compliance-gateway.js` where applicable).
- Goal: **visual** upgrade (shell, typography, spacing, cards, footer, mobile) and clearer **booking progress** UI **without** changing data flow or logic unless explicitly agreed.

## Zip filename

Produced as: `psynova-ui-design-handoff-2026-04-24.zip` at the repository root (same directory as this folder). The archive **omits** `node_modules`, prebuilt `dist*`, and stray `wordpress/` / `patient-portal/` copies so the download stays design-focused.
