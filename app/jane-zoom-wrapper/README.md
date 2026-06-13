# PsyNova Jane + Zoom Wrapper (Next.js)

Standalone App Router UI from `psynova-cursor-escaleta-v1.md`. Proxies `/api/*` to the Nest backend.

## Dual fallback

- API errors → mock schedule + Jitsi URLs (`lib/api.ts`)
- Zoom embed blocked → external tab + tab fallback button (`ZoomMeeting.tsx`)

## Run

```bash
npm install
PSYNOVA_API_BASE=http://127.0.0.1:3000 npm run dev
```

Open http://localhost:3001

Integrated in flagship SPA: https://psynova.shaneturon.ca/#/app/jane
