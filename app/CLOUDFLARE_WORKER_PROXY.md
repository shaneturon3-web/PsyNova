# Cloudflare Worker reverse-proxy (`*.workers.dev`)

> Free, no-domain front door for the local PsyNova dev stack. Solves
> `*.trycloudflare.com` being DNS-blocked by routers/parental-control DNS,
> and gives external testers a hostname that survives tunnel restarts.

## Why this exists

Cloudflare quick tunnels (`https://<random-words>.trycloudflare.com`) work
on the network level but the hostname:

1. **rotates every restart** — anyone who bookmarked yesterday's URL gets
   "site can't be reached" today;
2. is **categorised as anonymizer/tunneling** by many DNS filters
   (Bell/Rogers/Vidéotron consumer routers, parental-control DNS, Cisco
   Umbrella, NextDNS, AdGuard, etc.) — those resolvers silently drop the
   answer and the user sees nothing.

This setup adds a tiny Cloudflare Worker (`psynova-staging`) that
reverse-proxies `https://psynova-staging.<account>.workers.dev/*` to
whichever quick tunnel is currently running. The `*.workers.dev` URL:

- is **stable** (doesn't change between tunnel restarts),
- is **rarely on filter lists** (workers.dev is used by legit web apps),
- is **free** (Workers free plan = 100k req/day, way over tester usage),
- needs **no domain registration**.

```
browser
   │  HTTPS to a stable URL                 (testers bookmark this)
   ▼
https://psynova-staging.<account>.workers.dev/
   │
   ▼
[Cloudflare Worker reads env.ORIGIN_URL]
   │  fetch() over Cloudflare's network
   ▼
https://<random>.trycloudflare.com/         (rotates per restart)
   │
   ▼
[your local cloudflared]
   │
   ▼
Vite :5173 ──proxy /api/*──▶ Nest :3000
```

The trycloudflare URL keeps rotating; only the **Worker's `ORIGIN_URL` env
var** needs to be refreshed on every tunnel restart. The launcher does
that automatically — see [Per-session use](#per-session-use) below.

## One-time setup

You need:

- A Cloudflare account (free tier is fine — sign up at <https://dash.cloudflare.com/sign-up>; no credit card needed).
- Node.js 18+ on this machine (for `npx wrangler`).

Then:

```bash
bash ~/PsyNova/app/ops/setup_cloudflare_worker.sh
```

What it does:

1. Picks a `wrangler` (local install if present, else `npx`).
2. Runs `wrangler login` if you're not authenticated yet — opens a browser
   tab so you can approve the OAuth flow against your Cloudflare account.
3. Installs the worker's npm deps in `app/ops/cloudflare-worker-proxy/node_modules/` (one-time).
4. Deploys the worker as `psynova-staging` with a placeholder `ORIGIN_URL`.
5. Parses the deployed URL out of wrangler's output, prints it, and writes
   it to `~/.local/state/psynova/worker-url.txt` so the launcher knows
   which front door to open.

Override the worker name with `PSYNOVA_WORKER_NAME=my-custom-name` if
`psynova-staging` is taken in your account.

After this completes, opening the URL in any browser should show:

> **PsyNova staging — origin offline**
> No tunnel is currently registered with this proxy.

That placeholder is the worker telling you it's deployed and reachable but
no quick tunnel is currently registered. Bring up the stack + tunnel and
the placeholder turns into the real app.

## Per-session use

After the one-time setup, **the launcher does everything**. Click "PsyNova
Server (Cloudflare)" in your apps menu (or run
`bash ~/PsyNova/app/ops/psynova_launcher.sh cloudflare`). The flow is:

```
psynova-stack.service       → starts Postgres, Nest, Vite
psynova-tunnel.service      → starts cloudflared quick tunnel
                            → parses public trycloudflare URL
                            → calls redeploy_worker_origin.sh <url>
                            →   wrangler deploy --var ORIGIN_URL:<url>
                            → writes the workers.dev URL into url.txt
psynova_launcher.sh         → opens Chrome at the URL in url.txt
                              (= the stable workers.dev URL)
```

Tail the logs to see the redeploy happen in real time:

```bash
tail -f ~/.local/state/psynova/tunnel.log
```

You'll see:

```
[tunnel ...] public tunnel URL: https://<random-words>.trycloudflare.com
[tunnel ...] refreshing workers.dev proxy ORIGIN_URL -> https://<random-words>.trycloudflare.com
[redeploy-worker] worker='psynova-staging' new ORIGIN_URL='https://<random-words>.trycloudflare.com'
... wrangler deploy output ...
[tunnel ...] URL_FILE -> https://psynova-staging.<account>.workers.dev (workers.dev reverse-proxy in front of <random-words>.trycloudflare.com)
```

## Stopping

```bash
systemctl --user stop psynova-tunnel.service psynova-stack.service
# OR: PsyNova Server (Stop) menu entry
```

The workers.dev URL **stays deployed** and serves the placeholder page
("origin offline") to any visitor until you start the stack again. The
trycloudflare URL underneath dies, the worker still answers, the worker's
`fetch()` to the dead URL fails fast, the placeholder is rendered. No
cleanup needed.

## Cloudflare Access upgrade (gating with email/OTP)

Right now the workers.dev URL is **open** — anyone who knows it can hit
the demo logins. To gate it behind email/OTP without changing any code:

1. Go to <https://one.dash.cloudflare.com/> → pick your account.
2. **Access** → **Applications** → **Add an application** → **Self-hosted**.
3. Application configuration:
   - Application name: `psynova-staging`
   - Session duration: 24 hours
   - Application domain: `psynova-staging.<account>.workers.dev`
4. Add a policy:
   - Action: **Allow**
   - Include: **Emails** → list the testers you want to grant access.
   - Optionally: require **One-time PIN** (sent to email on each new device).
5. Save.

From now on, any visitor to the workers.dev URL is intercepted by
Cloudflare, asked for their email, mailed an OTP, and only then forwarded
to your worker. No code changes; testers see a Cloudflare-branded login
page first, then the PsyNova SPA. Free plan supports up to 50 users.

To revert: delete the application from Cloudflare Access; the worker
becomes open again instantly.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Setup fails at `wrangler login` | Browser didn't open / can't authenticate | Run `(cd ~/PsyNova/app/ops/cloudflare-worker-proxy && npx wrangler login)` manually, then re-run `setup_cloudflare_worker.sh` |
| Setup fails with `Subdomain already taken` | The default `psynova-staging` name is taken in your account | Re-run with `PSYNOVA_WORKER_NAME=psynova-shane bash setup_cloudflare_worker.sh` |
| Workers.dev URL returns "origin offline" even with stack running | Tunnel started before worker setup, or redeploy failed | Check `~/.local/state/psynova/tunnel.log`; re-run `bash ~/PsyNova/app/ops/redeploy_worker_origin.sh "$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' ~/.local/state/psynova/tunnel.log \| tail -1)"` |
| Page loads but assets 404 | Worker stripped a header it shouldn't have | Read `app/ops/cloudflare-worker-proxy/src/index.ts` — only `host` + hop-by-hop headers are dropped; report the missing header and we'll allowlist it |
| HMR (auto-refresh on save) doesn't work | **Known limitation** — the v1 proxy doesn't pass WebSockets through. Refresh manually after edits. |
| Logs from `wrangler tail` show 5xx | Origin tunnel is flapping. Restart `psynova-tunnel.service` |

## Cleanup / uninstall

```bash
cd ~/PsyNova/app/ops/cloudflare-worker-proxy
npx wrangler delete --name psynova-staging   # deletes the Worker on Cloudflare's side
rm -f ~/.local/state/psynova/worker-{url,name}.txt ~/.local/state/psynova/worker-deploy.log
```

After this, the launcher's "Cloudflare" mode falls back to writing the raw
`*.trycloudflare.com` URL into `url.txt` — the original behaviour before
this proxy was added.

## File map

| Path | Role |
| --- | --- |
| `app/ops/cloudflare-worker-proxy/wrangler.toml` | Worker config (name, compat date, vars). |
| `app/ops/cloudflare-worker-proxy/src/index.ts` | The reverse-proxy logic (~110 lines). |
| `app/ops/cloudflare-worker-proxy/package.json` | Pins `wrangler@^3.95.0`. |
| `app/ops/setup_cloudflare_worker.sh` | One-shot installer / re-deployer. |
| `app/ops/redeploy_worker_origin.sh` | Updates `ORIGIN_URL` after each tunnel restart. |
| `app/ops/psynova_tunnel.sh` | Calls the redeploy script automatically. |
| `~/.local/state/psynova/worker-url.txt` | Stable URL of the deployed worker. |
| `~/.local/state/psynova/worker-name.txt` | Worker name (for redeploy + delete). |
| `~/.local/state/psynova/worker-deploy.log` | Last `wrangler deploy` output. |
