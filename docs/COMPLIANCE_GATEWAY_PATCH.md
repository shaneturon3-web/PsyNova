# Compliance gateway patch (in-repo)

This tree includes the **compliance gateway** feature: a clinic-facing “interface layer” with outbound links to third-party systems, `vendor-links` API endpoints, and security headers. Apply/revert scripts live at the repository root.

## Apply (from repository root)

```bash
bash scripts/apply_compliance_gateway_patch.sh .
```

Then set vendor URL env vars in `app/frontend/.env` and `app/backend/.env` (see `.env.example` in each app).

## Revert

```bash
bash scripts/revert_compliance_gateway_patch.sh .
```

## Entry point

[main.js](../app/frontend/src/main.js) loads i18n and `styles.css`, then imports `init` from [app.js](../app/frontend/src/app.js). The shell is a **router**: default `VITE_SPA_MODE=legacy` loads [app-legacy.js](../app/frontend/src/app-legacy.js) (full maquette); set `VITE_SPA_MODE=gateway` to load the compliance UI (including the patient portal booking-wizard test block). `init` is always called after language setup (no side-effect-only import of the shell).

## GitHub / PR

Use [GITHUB_NOTE_COMPLIANCE_GATEWAY.md](./GITHUB_NOTE_COMPLIANCE_GATEWAY.md) in PRs or issues. This is not a legal compliance certification; counsel and practice governance must review live content and vendors.
