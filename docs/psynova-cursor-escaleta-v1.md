# PsyNova Core Wrapper (Jane + Zoom) — Cursor escaleta v1

Canonical copy: **`~/PsyNova/psynova-cursor-escaleta-v1.md`** (audited v1, 6 hours **per week**).  
Cloudflare implementation: **`~/PsyNova/workers/modular-spine-api/`**.

## Implementation map

| Escaleta phase | Delivered path |
|----------------|----------------|
| 1.1 Next.js stack | `app/jane-zoom-wrapper/` (standalone App Router) |
| 1.2 Env / DB | `app/backend/.env.example` keys + `app/database/11-jane-zoom.sql` |
| 2.1 Zoom token | `GET /api/zoom/token` |
| 2.2 Create meeting | `POST /api/zoom/create-meeting` |
| 2.3 Embedded video | `views/jane-dashboard.js` + Next `ZoomMeeting.tsx` |
| 3.1 Jane sync | `POST /api/jane/sync` + `jane-ical.parser.ts` |
| 3.2 Schedule match | auto `createMeeting` per imported event |
| 4.1 Dashboard | `/#/app/jane` split timeline + session panel |
| 5.1 Deploy prep | `jane-zoom-wrapper/README.md` |

## Dual fallback

1. **Backend:** Zoom live → `SessionsService` mock (same as backup-video).
2. **Frontend:** `/api/jane/*` → local mock schedule + Jitsi / `createBackupVideoSession`.
3. **Jane feed:** `JANE_ICAL_URL` → parse; on failure → mock appointments.

## Run

```bash
# Backend (port 3000)
cd ~/PsyNova/app/backend && npm run start:dev

# Flagship SPA (port 5173) — #/app/jane
cd ~/PsyNova/app/frontend && npm run dev

# Optional Next wrapper (port 3001)
cd ~/PsyNova/app/jane-zoom-wrapper && npm install && npm run dev
```
