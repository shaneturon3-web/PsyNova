# INDEX — AI Studio Recovery Bundle

All paths below are **relative to** `AI_STUDIO_RECOVERY_BUNDLE/`.

## Directory tree

```text
AI_STUDIO_RECOVERY_BUNDLE/
  FILES_FOUND.md
  STUDIO_FIRST_MESSAGE.md
  STUDIO_ORIENTATION.md
  app/
    backend/
      package.json
      src/
        app.module.ts
        main.ts
        appointments/
          appointments.controller.ts
          appointments.module.ts
          appointments.service.ts
          dto/
            create-appointment.dto.ts
            list-appointments-query.dto.ts
        auth/
          auth.controller.ts
          auth.module.ts
          auth.service.ts
          dev-auth-bypass.ts
          dto/
            login.dto.ts
            register.dto.ts
          guards/
            auth-token.guard.ts
    docs/
      ai-assistant.md
      architecture.md
    frontend/
      .env.example
      index.html
      package.json
      vite.config.js
      src/
        api.js
        app.js
        booking-wizard.js
        cms-admin-panel.js
        cms-api.js
        cms-util.js
        disclaimers.js
        i18n.js
        legal-content.js
        main.js
        mockup-banner.js
        service-categories.js
        site-content.js
        styles.css
        translate-widget.js
    ops/
      reports/
        PSYNOVA_MOCKUP_SPEC_CHATGPT_LINK_v01.md
  docs/
    repo/
      GOOGLE_AI_STUDIO_HANDOVER.md
```

## File descriptions

- **`FILES_FOUND.md`** — Bundle inventory & missing App.tsx note
- **`STUDIO_FIRST_MESSAGE.md`** — Paste message for Studio correction
- **`STUDIO_ORIENTATION.md`** — Canonical path & no-rebuild rules
- **`app/backend/package.json`** — npm manifest (dependencies & scripts)
- **`app/backend/src/app.module.ts`** — Nest root module imports
- **`app/backend/src/appointments/appointments.controller.ts`** — Appointments REST controller
- **`app/backend/src/appointments/appointments.module.ts`** — Appointments Nest module
- **`app/backend/src/appointments/appointments.service.ts`** — Appointments business logic + DB
- **`app/backend/src/appointments/dto/create-appointment.dto.ts`** — Create appointment DTO
- **`app/backend/src/appointments/dto/list-appointments-query.dto.ts`** — List appointments query DTO
- **`app/backend/src/auth/auth.controller.ts`** — Auth HTTP routes (login, register, me, …)
- **`app/backend/src/auth/auth.module.ts`** — Auth Nest module
- **`app/backend/src/auth/auth.service.ts`** — Custom JWT-style tokens, password hashing
- **`app/backend/src/auth/dev-auth-bypass.ts`** — Development auth bypass helpers
- **`app/backend/src/auth/dto/login.dto.ts`** — Login DTO
- **`app/backend/src/auth/dto/register.dto.ts`** — Register DTO
- **`app/backend/src/auth/guards/auth-token.guard.ts`** — Route guard for Bearer token / dev bypass
- **`app/backend/src/main.ts`** — Nest bootstrap, CORS, Swagger, global prefix
- **`app/docs/ai-assistant.md`** — AI assistant constraints / mockup tag
- **`app/docs/architecture.md`** — High-level architecture doc
- **`app/frontend/.env.example`** — Frontend env template
- **`app/frontend/index.html`** — SPA HTML shell
- **`app/frontend/package.json`** — npm manifest (dependencies & scripts)
- **`app/frontend/src/api.js`** — fetch wrapper, token, API calls
- **`app/frontend/src/app.js`** — Hash routing, views, auth UI, booking integration
- **`app/frontend/src/booking-wizard.js`** — Multi-step booking / calendar UI
- **`app/frontend/src/cms-admin-panel.js`** — CMS admin UI binding
- **`app/frontend/src/cms-api.js`** — CMS fetch helpers
- **`app/frontend/src/cms-util.js`** — CMS parsing helpers
- **`app/frontend/src/disclaimers.js`** — Mockup disclaimer blocks
- **`app/frontend/src/i18n.js`** — UI strings EN/FR/ES
- **`app/frontend/src/legal-content.js`** — Legal page HTML fragments
- **`app/frontend/src/main.js`** — Frontend entry (imports app.js)
- **`app/frontend/src/mockup-banner.js`** — Banner UI
- **`app/frontend/src/service-categories.js`** — DRAFT service categories
- **`app/frontend/src/site-content.js`** — Site copy helpers
- **`app/frontend/src/styles.css`** — Global styles
- **`app/frontend/src/translate-widget.js`** — Optional translate widget
- **`app/frontend/vite.config.js`** — Vite dev server & /api proxy
- **`app/ops/reports/PSYNOVA_MOCKUP_SPEC_CHATGPT_LINK_v01.md`** — Wired vs gray modules spec
- **`docs/repo/GOOGLE_AI_STUDIO_HANDOVER.md`** — External AI handover + Section 8 prompt

## Paste-friendly exports (same folder)

- `INDEX.md` — this file: tree + per-file descriptions
- `FRONTEND_BUNDLE.md` — all `app/frontend/**` concatenated
- `BACKEND_BUNDLE.md` — all `app/backend/**` concatenated
- `DOCS_BUNDLE.md` — orientation + handover + app docs + ops report
- `STUDIO_UPLOAD_ORDER.md` — recommended paste order for Shane
