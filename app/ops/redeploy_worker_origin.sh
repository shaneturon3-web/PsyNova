#!/usr/bin/env bash
# redeploy_worker_origin.sh — refresh the ORIGIN_URL var on the *.workers.dev
# reverse-proxy after the cloudflared quick-tunnel rotates.
#
# Usage:
#   redeploy_worker_origin.sh https://<random>.trycloudflare.com
#
# Reads the worker name from $XDG_STATE_HOME/psynova/worker-name.txt (written
# by setup_cloudflare_worker.sh). Bails out cleanly with exit 0 if the worker
# isn't set up yet — letting the caller (psynova_tunnel.sh) fall back to the
# raw trycloudflare URL.
set -uo pipefail

REPO_ROOT="${PSYNOVA_REPO_ROOT:-/home/shane/PsyNova}"
WORKER_DIR="$REPO_ROOT/app/ops/cloudflare-worker-proxy"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/psynova"
WORKER_NAME_FILE="$STATE_DIR/worker-name.txt"
WORKER_URL_FILE="$STATE_DIR/worker-url.txt"
DEPLOY_LOG="$STATE_DIR/worker-deploy.log"

ORIGIN="${1:-}"
if [[ -z "$ORIGIN" ]]; then
  echo "usage: $0 <ORIGIN_URL>" >&2
  exit 2
fi

if [[ ! -f "$WORKER_NAME_FILE" || ! -s "$WORKER_NAME_FILE" ]]; then
  echo "[redeploy-worker] no worker is set up yet (no $WORKER_NAME_FILE) — skipping."
  exit 0
fi
WORKER_NAME="$(cat "$WORKER_NAME_FILE")"

# Pick wrangler — local install if present, else npx (lazy auto-install).
if [[ -x "$WORKER_DIR/node_modules/.bin/wrangler" ]]; then
  WRANGLER_CMD=(./node_modules/.bin/wrangler)
else
  if ! command -v npx >/dev/null 2>&1; then
    echo "[redeploy-worker] ERROR: neither local wrangler nor npx available" >&2
    exit 1
  fi
  WRANGLER_CMD=(npx --yes wrangler@^3.95.0)
fi

echo "[redeploy-worker] worker='$WORKER_NAME' new ORIGIN_URL='$ORIGIN'"
: > "$DEPLOY_LOG"
if (cd "$WORKER_DIR" && "${WRANGLER_CMD[@]}" deploy \
      --name "$WORKER_NAME" \
      --var "ORIGIN_URL:$ORIGIN" \
      2>&1 | tee "$DEPLOY_LOG"); then
  # Re-parse the served URL in case it changed (subdomain renames, account
  # moves, etc.) and refresh worker-url.txt for the launcher.
  URL=$(grep -Eo 'https://[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev' "$DEPLOY_LOG" | head -n1)
  if [[ -n "$URL" ]]; then
    printf '%s\n' "$URL" > "$WORKER_URL_FILE"
    echo "[redeploy-worker] OK — proxy now serving from $URL"
  else
    echo "[redeploy-worker] OK — proxy redeployed (worker URL unchanged: $(cat "$WORKER_URL_FILE" 2>/dev/null))"
  fi
  exit 0
else
  echo "[redeploy-worker] ERROR: wrangler deploy failed (full log in $DEPLOY_LOG above)" >&2
  exit 1
fi
