# STUDIO_ORIENTATION.md — PsyNova canonical source

## Canonical repository

**Path on disk:** `/home/shane/PsyNova`

This is the only authoritative Git working tree. Do not assume a blank Vite/React prototype or a path under `Desktop/Projects/PsyNova` (obsolete).

## Real project structure (subset)

```
/home/shane/PsyNova/
  app/
    backend/          # NestJS API (package.json, src/main.ts, auth/, appointments/, …)
    frontend/         # Vite + vanilla JavaScript (no App.tsx, no React router folders)
      src/main.js     # browser entry
      src/app.js      # hash routing + UI composition
      src/api.js      # fetch + auth header + appointments
      src/booking-wizard.js
    database/         # SQL (not fully exported in this bundle)
    docs/             # product/architecture docs
    ops/              # runbooks, reports
  docs/               # repo-root docs (e.g. GOOGLE_AI_STUDIO_HANDOVER.md)
  backend/            # symlink → app/backend (in full repo only; bundle uses app/backend paths)
```

## About the incorrect Studio workspace

If Google AI Studio was opened on an empty project, a generic React template, or paths that do not match the tree above, that workspace was **wrong**. The files in **`AI_STUDIO_RECOVERY_BUNDLE/`** are **raw exports** from the real repo and override any assumed scaffold.

## Source of truth

- Use the **exported files in this bundle** (and the full clone at `/home/shane/PsyNova` when available) as the **only** baseline for PsyNova behavior, dependencies, and file layout.
- **Do not** rebuild architecture, folder layout, or tech stack from scratch. Extend and edit the existing Nest + vanilla Vite codebase.

## Bootstrap prompt

See **`docs/repo/GOOGLE_AI_STUDIO_HANDOVER.md`** → **Section 8 — AI Studio Bootstrap Prompt** in the full repo, or paste from there after syncing the canonical clone.
