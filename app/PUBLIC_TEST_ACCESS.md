# Public test access (Cloudflare Tunnel)

> Quick path to put the local dev stack behind a public HTTPS URL so external
> testers (or you, on another device) can hit it without deploying anything.

## How it works

```
internet ──▶ https://<random>.trycloudflare.com
                    │
                    ▼
           cloudflared (local)
                    │
                    ▼
           Vite dev server  :5173 ──proxy /api/*──▶  Nest backend  :3000
```

Vite's built-in proxy (`vite.config.js → server.proxy['/api']`) forwards every
`/api/*` request to `127.0.0.1:3000`, so a single tunnel hostname covers both
the SPA and the API. No CORS or auth changes required — the backend still only
sees `127.0.0.1` as the request origin.

## One-shot launch

```bash
# 1. backend
cd app/backend
DISABLE_AUTH=false NODE_ENV=test JWT_SECRET=psynova_test_secret_for_qa_only \
  JITSI_PUBLIC_DEMO_ROOM=true \
  npm run start:dev

# 2. frontend (separate terminal)
cd app/frontend
npm run dev

# 3. tunnel (separate terminal)
bash app/ops/start_public_tunnel.sh
```

The tunnel script will install `cloudflared` into `~/.local/bin/` on first run
(no sudo) and then print a line like:

```
Your quick Tunnel has been created! Visit it at:
  https://<random-words>.trycloudflare.com
```

Share that URL with whoever is testing. They get HTTPS automatically.

## Demo logins (seeded by `app/backend/scripts/seed_test.sh`)

| Role      | Email                         | Password         |
| --------- | ----------------------------- | ---------------- |
| Patient   | `patient.demo@psynova.local`  | `Patient!2026`   |
| Clinician | `clinician.demo@psynova.local`| `Clinician!2026` |
| Admin     | `admin.demo@psynova.local`    | `Admin!2026`     |

In dev these are also surfaced via `GET /api/dev/test-accounts` and rendered on
the **Test accounts (dev)** page in the side nav, with one-click sign-in.

## Stopping

`Ctrl-C` in the tunnel terminal. The hostname is invalidated immediately;
re-running `start_public_tunnel.sh` gives you a fresh random one.

## Stable URL (no domain required)

If your local DNS resolver blocks `*.trycloudflare.com` (common on
Bell/Rogers/Vidéotron consumer routers and any parental-control DNS), or
you just want a URL that survives tunnel restarts without paying for a
domain, see [`CLOUDFLARE_WORKER_PROXY.md`](CLOUDFLARE_WORKER_PROXY.md) —
it sets up a free `*.workers.dev` reverse-proxy in front of the rotating
quick tunnel. One-time `bash app/ops/setup_cloudflare_worker.sh`, then the
launcher handles everything per session.

## Upgrading to a stable hostname (with your own domain)

Quick tunnels rotate every restart and have no SLA. When you're ready for
something that survives a reboot:

1. Cloudflare account + a domain on Cloudflare DNS.
2. One-time setup:

   ```bash
   cloudflared tunnel login                          # opens browser
   cloudflared tunnel create psynova-dev
   cloudflared tunnel route dns psynova-dev dev.your-domain.tld
   ```

3. Drop a config at `~/.cloudflared/config.yml`:

   ```yaml
   tunnel: psynova-dev
   credentials-file: /home/shane/.cloudflared/<UUID>.json
   ingress:
     - hostname: dev.your-domain.tld
       service: http://localhost:5173
     - service: http_status:404
   ```

4. Run:

   ```bash
   bash app/ops/start_public_tunnel.sh --named psynova-dev
   ```

5. Optional, recommended: gate it with **Cloudflare Access** (Zero Trust →
   Applications → Self-hosted) for invite-only email auth. The tunnel itself
   stays public, but Cloudflare challenges every visitor with a one-time email
   code before forwarding the request to your machine.

## Caveats

- **No persistence guarantee.** Quick tunnels are best-effort and may be
  rate-limited under abuse.
- **Vite HMR over the tunnel.** WebSocket HMR may reconnect noisily but does
  not break the page; refresh works.
- **Backend env.** Ensure the backend was started with a non-default
  `JWT_SECRET` (the `start_public_tunnel.sh` flow above sets one for `test`
  mode). In `production` mode the backend refuses to boot without one.
- **`MOCKUP-PURPOSE-ONLY`.** All API responses include this tag. The stack is
  not Law 25 compliant; do not use it with real PHI.
