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
