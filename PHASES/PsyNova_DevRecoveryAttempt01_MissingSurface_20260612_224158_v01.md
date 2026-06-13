# PsyNova .dev Recovery Attempt 01 — Missing Surface State

Date: Fri 12 Jun 2026 10:41:58 PM EDT

STATUS=DEV_DEPLOYED_BUT_SURFACE_INCOMPLETE
CANONICAL_CANDIDATE=/home/shane/Projects/PsyNova_FRESH_20260612_214251
DEV_URL=https://e2402973.psynova-dev.pages.dev
RECOVERY_COMMIT=47feaa0
DEV_PHASE_COMMIT=2e7675f
DEV_BUILD_OUTPUT=/home/shane/Projects/PsyNova_FRESH_20260612_214251/app/frontend/dist-psynova

## User visual verdict

The .dev deployment loads, but it is missing pieces.

User report:
- home page reverted to mockup state
- services reverted to mockup state
- blog reverted to mockup state
- likely missing pieces are from Cursor’s last repair tickets
- these are the same pieces previously repaired

## What already passed

- Fresh candidate launched locally.
- Backend health returned HTTP 200.
- Backend reported persistence enabled and database connected.
- Frontend returned HTTP 200.
- Temporary Cloudflare tunnel visually passed.
- Recovery archive exists.
- Recovery git checkpoint exists.
- Frontend production build passed.
- Backend Nest build passed.
- Cloudflare Pages project was created.
- .dev static deployment succeeded.

## What did not pass

.dev visual surface is incomplete.

This means:
DEV_SURFACE_PASS=NO
QUARANTINE_READY=NO
LIVE_DEPLOY_READY=NO

## Current diagnosis

The static .dev deployment is likely serving the production frontend bundle without the repaired backend/CMS content path.

Probable causes:
1. /api routes are not available on Cloudflare Pages static deployment.
2. Home/services/blog are CMS/backend-driven and fall back to embedded mockup content when API is missing.
3. Cursor’s last repair files were not captured in the fresh candidate production build.
4. Production build may be using older source path or fallback mockup content.
5. Correct repaired state may exist in /home/shane/PsyNova, Cursor reports, or selected files in /srv/shared/PsyNova, but must be recovered selectively.

## Current path map

ACTIVE_CANDIDATE=/home/shane/Projects/PsyNova_FRESH_20260612_214251
OLD_MENU_PATH=/home/shane/PsyNova
ARCHIVE_REFERENCE=/srv/shared/PsyNova
BAD_SURFACE=qpc.shaneturon.ca
DEV_URL=https://e2402973.psynova-dev.pages.dev

## Menu entry guidance

Old menu entries can be used only as visual reference.

They launch:
  /home/shane/PsyNova/app/ops/psynova_launcher.sh

Allowed:
- launch old Local or Cloudflare menu entry to see what the previously good surface looked like
- compare home/services/blog
- identify exact missing content

Not allowed:
- treat old menu path as final deployment source without comparison
- wholesale sync /srv/shared/PsyNova
- quarantine anything before .dev passes
- deploy live

## First recovery action for sibling chat

Run a focused diff between:

FRESH:
  /home/shane/Projects/PsyNova_FRESH_20260612_214251

OLD MENU PATH:
  /home/shane/PsyNova

SHARED REFERENCE:
  /srv/shared/PsyNova

Focus files:
- app/frontend/src/site-content.js
- app/frontend/src/service-categories.js
- app/frontend/src/app.js
- app/frontend/src/app-legacy.js
- app/frontend/src/main.js
- app/frontend/src/cms-api.js
- app/frontend/src/cms-util.js
- app/backend/src/cms/cms-seed.data.ts
- app/backend/src/cms/cms-public.controller.ts
- app/backend/src/cms/cms.service.ts
- app/database/05-cms-schema.sql
- app/database/06-cms-seed.sql

## Required exit condition

Recover missing home/services/blog content into canonical fresh candidate only.

Then:
1. rebuild frontend
2. redeploy psynova-dev Pages
3. visually confirm .dev
4. only then prepare quarantine

## Status flags

DEV_PASS=NO
RECOVERY_ATTEMPT=01
SCAVENGE_REQUIRED=LIKELY_SELECTIVE
QUARANTINE_READY=NO
DEPLOY_BLOCKED=UNTIL_DEV_SURFACE_PASS
