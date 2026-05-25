# FLAGSHIP READ-ONLY — GATE_E ENFORCED

**Status:** Forensic restore complete (2026-05-25)  
**Live:** https://psynova.shaneturon.ca/  
**Source tree:** `~/PsyNova/app/frontend/` (synced from OptiPlex SMB share)

## Restore source priority (forensics)

| Priority | Path | Use |
|----------|------|-----|
| **1 — Authoritative** | `/srv/shared/PsyNova` | OptiPlex SMB “share truth”; `diff` vs live `src/` should be empty before/after sync |
| **2 — Fallback** | `~/PsyNova.quarantine-standardization-20260524T223405/` | May 24 22:34 snapshot; byte-identical to share for `src/` + `index.html` |
| **Never** | `~/PsyNova.pre-migration.20260523/` | May 23 backup **before** rsync — no `app-legacy.js`, no `views/`, monolithic `app.js`, fr-CA maquette `index.html` |
| **Never** | `~/PsyNova.pre-migration.20260522/` | Incomplete frontend `src/` |
| **Never** | `~/PsyNova.quarantine-wrong-elite-restore-20260524T225045/` | Snapshot after mistaken pre-migration revert |
| **Not May state** | GitHub `shaneturon3-web/PsyNova` | Last push 2026-04-26 |

Full timeline: Cursor plan `psynova_forensic_timeline` (do not edit plan file).

## Rules

1. **No edits** to `app/frontend/src`, `index.html`, or production deploy artifacts except explicit operator revert/deploy orders.
2. **Copy-only** — L4 work clones logic into `~/Projects/corporate-identity/clinical-module/`.
3. **No new standardization** — do not re-apply corporate-identity/Ferrari tokens or refactor the flagship; afternoon state uses `app-legacy.js` + thin `app.js` router.

## Production path

`psynova.shaneturon.ca` → Worker `psynova-staging` (`app/ops/cloudflare-worker-proxy`) → cloudflared → **Vite dev** `http://127.0.0.1:5173` (not `dist-psynova/`). Wrong **content** may be API/CMS/backend, not missing files in `src/`.

## Restore command (if live tree damaged again)

```bash
# 1) Share sync (preferred)
rsync -a --delete /srv/shared/PsyNova/app/frontend/src/ ~/PsyNova/app/frontend/src/
cp /srv/shared/PsyNova/app/frontend/index.html ~/PsyNova/app/frontend/index.html

# 2) Or quarantine fallback (only if share unavailable)
# rsync -a --delete ~/PsyNova.quarantine-standardization-20260524T223405/src/ ~/PsyNova/app/frontend/src/
# cp ~/PsyNova.quarantine-standardization-20260524T223405/index.html ~/PsyNova/app/frontend/index.html

# 3) Full repo apply (creates new dated pre-migration.* backup — do NOT restore frontend from that backup)
# bash ~/PsyNova/app/ops/apply_from_optiplex_shares.sh

cd ~/PsyNova/app/frontend && npm run build
bash ~/PsyNova/app/ops/psynova_stack.sh start
bash ~/PsyNova/app/ops/psynova_tunnel.sh start
```

## Acceptance checks

- `src/app-legacy.js` exists (~100 KB)
- `src/app.js` ~944 B
- `src/views/` contains `billing.js`, `clinician-workspace.js`, `ehr.js`
- `index.html` — Studio minimal shell (`lang="en"`, `#app`); **no** `maquette-banner` in served HTML
- Hash routes `/#/services`, `/#/team` load (HTTP 200 from Vite)
- Worker `ORIGIN_URL` refreshed after tunnel start (`redeploy_worker_origin.sh` via tunnel launcher)
