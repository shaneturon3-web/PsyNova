#!/usr/bin/env bash
# setup_cloudflare_worker.sh — one-shot installer for the *.workers.dev
# reverse-proxy that fronts the cloudflared quick-tunnel with a stable URL.
#
# What it does:
#   1. ensures `wrangler` is reachable (uses npx so no global install needed)
#   2. prompts `wrangler login` if the user isn't authenticated yet
#   3. installs the Worker's npm deps (only on first run)
#   4. does a first deploy with ORIGIN_URL set to the placeholder
#   5. parses the deployed *.workers.dev URL out of wrangler's output
#   6. writes the URL + worker-name to ~/.local/state/psynova/ for the launcher
#
# Re-running is safe (idempotent): step 4 just redeploys, picking up any
# changes you made to src/index.ts.
#
# Override the worker name with $PSYNOVA_WORKER_NAME (default: psynova-staging).
set -euo pipefail

REPO_ROOT="${PSYNOVA_REPO_ROOT:-/home/shane/PsyNova}"
WORKER_DIR="$REPO_ROOT/app/ops/cloudflare-worker-proxy"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/psynova"
WORKER_URL_FILE="$STATE_DIR/worker-url.txt"
WORKER_NAME_FILE="$STATE_DIR/worker-name.txt"
WORKER_DEPLOY_LOG="$STATE_DIR/worker-deploy.log"

mkdir -p "$STATE_DIR"

WORKER_NAME="${PSYNOVA_WORKER_NAME:-psynova-staging}"

echo "[setup-worker] worker dir : $WORKER_DIR"
echo "[setup-worker] worker name: $WORKER_NAME"
echo "[setup-worker] state dir  : $STATE_DIR"
echo

if [[ ! -f "$WORKER_DIR/wrangler.toml" ]]; then
  echo "ERROR: $WORKER_DIR/wrangler.toml not found." >&2
  echo "       Make sure the worker source is committed to the repo." >&2
  exit 2
fi

# 1. wrangler — prefer locally-installed, fall back to npx (auto-installs).
WRANGLER_CMD=()
if (cd "$WORKER_DIR" && [[ -x node_modules/.bin/wrangler ]]); then
  WRANGLER_CMD=(./node_modules/.bin/wrangler)
  echo "[setup-worker] using local wrangler"
else
  if ! command -v npx >/dev/null 2>&1; then
    echo "ERROR: npx not found. Install Node.js 18+ (e.g. via nvm) and re-run." >&2
    exit 2
  fi
  WRANGLER_CMD=(npx --yes wrangler@^3.95.0)
  echo "[setup-worker] using npx wrangler (will be auto-installed on first run)"
fi
echo

# 3. install deps (only if missing) so the local wrangler is available next time
if [[ ! -d "$WORKER_DIR/node_modules" ]]; then
  echo "[setup-worker] installing worker npm deps (one-time)..."
  (cd "$WORKER_DIR" && npm install --no-audit --no-fund) || {
    echo "[setup-worker] WARN: npm install failed; will continue with npx wrangler" >&2
  }
  if [[ -x "$WORKER_DIR/node_modules/.bin/wrangler" ]]; then
    WRANGLER_CMD=(./node_modules/.bin/wrangler)
    echo "[setup-worker] switched to local wrangler"
  fi
  echo
fi

# 2. authentication check
echo "[setup-worker] checking Cloudflare auth..."
if ! (cd "$WORKER_DIR" && "${WRANGLER_CMD[@]}" whoami >/dev/null 2>&1); then
  cat <<HINT
[setup-worker] not authenticated yet — running 'wrangler login' interactively.
[setup-worker] A browser tab will open. Approve access for the Cloudflare account
[setup-worker] you want to host the proxy under, then come back to this terminal.
HINT
  (cd "$WORKER_DIR" && "${WRANGLER_CMD[@]}" login)
fi
WHOAMI=$(cd "$WORKER_DIR" && "${WRANGLER_CMD[@]}" whoami 2>&1 | tail -n 5)
echo "[setup-worker] auth OK:"
echo "$WHOAMI" | sed 's/^/  /'
echo

# 4. deploy
echo "[setup-worker] deploying worker '$WORKER_NAME' (placeholder ORIGIN_URL)..."
: > "$WORKER_DEPLOY_LOG"
if ! (cd "$WORKER_DIR" && "${WRANGLER_CMD[@]}" deploy \
        --name "$WORKER_NAME" \
        --var "ORIGIN_URL:http://placeholder.invalid" \
        2>&1 | tee "$WORKER_DEPLOY_LOG"); then
  echo "[setup-worker] ERROR: wrangler deploy failed (see $WORKER_DEPLOY_LOG above)" >&2
  exit 1
fi
echo

# 5. parse the deployed *.workers.dev URL
URL=$(grep -Eo 'https://[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev' "$WORKER_DEPLOY_LOG" | head -n1)
if [[ -z "$URL" ]]; then
  # Some wrangler versions print the URL without an `https://` prefix on a separate line; fall back.
  URL_BARE=$(grep -Eo '[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev' "$WORKER_DEPLOY_LOG" | head -n1)
  [[ -n "$URL_BARE" ]] && URL="https://$URL_BARE"
fi
if [[ -z "$URL" ]]; then
  echo "[setup-worker] WARN: could not parse deployed URL from wrangler output." >&2
  echo "[setup-worker]       Falling back to constructed name. Edit ~/.local/state/psynova/worker-url.txt by hand if wrong." >&2
  # Best-effort fallback — wrangler usually prints the actual URL, so this is rare.
  URL="https://${WORKER_NAME}.workers.dev"
fi

# 6. persist for the launcher + tunnel script
printf '%s\n' "$URL"         > "$WORKER_URL_FILE"
printf '%s\n' "$WORKER_NAME" > "$WORKER_NAME_FILE"

echo "[setup-worker] DONE."
echo
echo "  Public URL : $URL"
echo "  worker name: $WORKER_NAME"
echo "  state files: $WORKER_URL_FILE"
echo "               $WORKER_NAME_FILE"
echo
cat <<NEXT
[setup-worker] Next:
  - Open $URL in any browser — you should see the "PsyNova staging — origin offline"
    placeholder page (because no tunnel is registered with the proxy yet).
  - Then start the stack + tunnel either via the menu (PsyNova Server (Cloudflare))
    or via:
      systemctl --user start psynova-stack.service
      systemctl --user start psynova-tunnel.service
    The tunnel script will redeploy the worker with the live trycloudflare URL,
    after which the proxy URL above starts serving the real app.
  - To gate access later, see the Cloudflare Access section in
    app/CLOUDFLARE_WORKER_PROXY.md (5-minute upgrade, no code changes).
  - To wipe the worker:
      cd $WORKER_DIR && ${WRANGLER_CMD[*]} delete --name $WORKER_NAME
NEXT
