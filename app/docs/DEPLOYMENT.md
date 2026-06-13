# PsyNova mockup — deployment and operations

This repository is a **non-operational prototype** for a psychology clinic UI (Montreal / Quebec context). It must remain clearly labelled as a mockup in all environments.

## Recommended architecture (Phase 1)

| Layer | Choice in this repo | Production-oriented alternative |
|--------|---------------------|----------------------------------|
| Frontend | Vite static SPA (`frontend/`) | Next.js (SSR) if SEO/legal pages need server rendering |
| API | NestJS (`backend/`) | Same, or serverless functions calling the same services |
| CMS | Custom tables + Nest `CmsModule` | Headless CMS (Strapi, Sanity, Contentful) if editorial workflows grow |
| Database | PostgreSQL 16 | Managed Postgres (Neon, RDS, Supabase) |
| Translation | DeepL and/or Google APIs via `TranslationService` | Same; keep keys server-side only |

### Phase 1 scope (planning reference)

Rough USD ranges for budgeting; this repo implements the **Vite + Nest + Postgres CMS** column above. A **Next.js + Sanity/Strapi** rebuild would map to the same features with different setup effort.

| Phase | Component | Description | Tools (typical) | Setup (USD) | Monthly (USD) | Priority |
|-------|-----------|-------------|-----------------|---------------|-----------------|----------|
| 1 | Website core | Editable site, CMS, multilingual structure | Next.js + headless CMS (Sanity/Strapi) *or* this repo | 2000–6000 | 20–100 | High |
| 1 | Language detection | Browser language → UI locale | i18n + first-visit logic | 0–200 | 0 | High |
| 1 | Manual language toggle | FR/EN/ES in header | Routing + switcher | 0–200 | 0 | High |
| 1 | Translation API | User input translated; store original + FR | DeepL / Google Cloud Translate | 300–1500 | 20–150 | High |
| 1 | Multilingual booking/forms | Any-language input, server translation | Custom forms + API | 200–800 | 0–50 | High |
| 1 | Disclaimer system | Non-clinical, mockup, no therapeutic relationship | Reusable components | 100–300 | 0 | High |
| 1 | Mockup banner | Persistent on all surfaces | Header strip + footer + API header | 50–150 | 0 | High |
| 1 | Content localization | FR primary, EN/ES secondary | Manual + assisted translation | 200–800 | 0–50 | High |
| 1 | Hosting | Production + staging | Vercel or similar + API host | 0–300 | 20–100 | High |
| 1 | Analytics (optional) | Usage / language | GA4 or similar | 0–200 | 0 | Medium |
| | **Total (indicative)** | | | **4150–10450** | **60–450** | |

## Environment variables

### Backend (`backend/.env` or host secrets)

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `production` in live deploys |
| `PORT` | Listen port (often set by platform) |
| `USE_PERSISTENCE` | `true` when Postgres is available |
| `JWT_SECRET` | **Required** strong secret in production |
| `DB_*` | Postgres connection |
| `DEEPL_API_KEY` | Optional; preferred for French target copies |
| `GOOGLE_TRANSLATE_API_KEY` | Optional fallback translator |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins (e.g. `https://your-app.vercel.app`) |

Never expose translation API keys to the browser. The frontend only calls `/api/translate` and `/api/forms/contact` on the same API origin (or proxied).

### Frontend (Vite)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE` | Base URL for API (e.g. `https://api.yourdomain.com/api` or `/api` behind reverse proxy) |
| `VITE_ENABLE_TRANSLATE_WIDGET` | Set to `true` to load Google’s embedded page translator as a **fallback** (UI only; does not replace server-side storage of originals + French copy) |

## Database migrations

New installs (Docker init): scripts under `database/` run in order, including `07-notes-and-contact.sql`.

**Existing Postgres volumes** created before that file was added must run `07-notes-and-contact.sql` manually (or recreate the volume).

## Deploying the frontend (e.g. Vercel)

1. **Build command:** `cd frontend && npm ci && npm run build`  
2. **Output directory:** `frontend/dist-psynova`  
3. **Environment:** set `VITE_API_BASE` to your deployed API’s `/api` URL if the API is on another host; if you use rewrites so that `/api` hits the Nest server on the same domain, keep default `/api`.

**Rewrites (example):** map `/api/*` to your Nest server URL so the static site and API share one origin and CORS stays simple.

## Deploying the API

- Run `npm ci && npm run build` in `backend/`, start with `node dist/main.js` (or platform-specific start).
- Set `CORS_ORIGINS` to your Vercel (or other) site URL(s).
- Enable `USE_PERSISTENCE=true` and provide `DB_*` when using Postgres.

## Mockup and legal visibility

- **Fixed banner** in `frontend/index.html` (trilingual + non-clinical line).
- **In-app** `mockupStripHtml()` + `globalContentDisclaimer()` on public pages; **footer** `siteFooterDisclaimer()` on public and authenticated views; app shell uses the same strip.
- **API:** response header `X-PsyNova-Maquette` matches the canonical one-liner; Swagger description repeats it.
- **Forms:** `formDisclaimerBlock()` near inputs (contact + booking).
- Do **not** remove these for “cleaner” marketing screenshots without legal/product review.

## Crisis routing

Copy consistently points users to **911** and **988** (Canada) for emergencies. This prototype does not handle crises.

## Stack disclaimer

This document describes deployment mechanics only. It does **not** constitute legal advice, OPQ guidance, or Law 25 compliance certification. Have counsel review before any public or clinical-adjacent launch.
