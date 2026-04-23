# PsyNova Canonical Repository

This is the canonical consolidated PsyNova root at `/home/shane/PsyNova`.

Legacy preserved copy (do not use for active work): `/home/shane/Desktop/Projects/PsyNova`.

## Layout
- `app/` live operational codebase copied from `PsyNova Virtual Clinic/virtual-psychology-clinic`
- `ops/` operational scripts and infra helpers
- `docs/` curated documentation
- `reports/` verification/state reports imported from stray packets
- `recovery/` rescue and packet artifacts preserved with provenance
- `exports/` exported state snapshots and extracted raw assets
- `registry/` DB alignment/fix execution traces
- `scripts/` root-level consolidation helpers
- `archive/` retained legacy artifacts when classification is uncertain

## Running app
- Backend: `cd app/backend && npm run start:dev`
- Frontend: `cd app/frontend && npm run dev`
- Database mode: Docker Compose PostgreSQL (`db` service, user/db `psynova`)

## Auth + dev-test notes
- Dev bypass is controlled by environment flags in backend auth flow.
- For strict auth checks, run with `DISABLE_AUTH=false` and non-development env.

## Database bootstrap
- Migrate: `cd app/backend && npm run db:migrate:local`
- Seed deterministic QA fixtures: `cd app/backend && npm run db:seed:test`

## Recovery and archival policy
- Recovery/export packets are preserved in `recovery/`, `exports/`, `reports/`, and `registry/`.
- Working runtime app remains source-of-truth unless explicitly recovered with evidence.
