# Modular Spine API (Cloudflare Worker)

Implements **Phase 1** of `psynova-cursor-escaleta-v1.md` (R2, Access perimeter, D1 handlers, Stripe webhook, Daily.co telehealth).

## Dual fallback

- **Telehealth:** Daily.co live → Jitsi public room (same pattern as Nest `SessionsService`).
- **Access JWT:** Full JWKS verify pending `CF_ACCESS_TEAM_DOMAIN` — stub validates payload shape when vars unset.

## Deploy

```bash
cd workers/modular-spine-api
npx wrangler d1 create psynova-edge-db   # once — update database_id in wrangler.toml
npx wrangler r2 bucket create psynova-storage-preview
npm run db:migrate:local
npx wrangler dev
npx wrangler deploy
```

**PENDING without Cloudflare resources:** R2 bucket + D1 ID must exist in your account before deploy succeeds.

## Metric

Canonical copy: **6 hours per week** (never daily). See escaleta errata section.
