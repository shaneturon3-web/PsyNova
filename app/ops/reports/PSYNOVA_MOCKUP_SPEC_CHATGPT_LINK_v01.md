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
