#!/usr/bin/env bash
# start_public_tunnel.sh
#
# Spins up a Cloudflare Tunnel that exposes the local Vite dev server (port 5173)
# to a public https://*.trycloudflare.com URL. Vite already proxies /api/* to the
# Nest backend (port 3000), so a single tunnel covers the whole stack.
#
# Quick mode (default): no Cloudflare account, throwaway random hostname.
# Named mode (`--named <name>`): requires `cloudflared tunnel login` first and a
# Cloudflare-managed domain — gives a stable hostname.
#
# Prereqs:
#   - Backend running:  cd app/backend && npm run start:dev
#   - Vite running:     cd app/frontend && npm run dev
#   - cloudflared on PATH (this script will install ~/.local/bin/cloudflared if missing)

set -euo pipefail

PORT="${PORT:-5173}"
MODE="quick"
NAME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --named) MODE="named"; NAME="${2:-}"; shift 2 ;;
    --port)  PORT="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,16p' "$0"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

CF_BIN="${CF_BIN:-$HOME/.local/bin/cloudflared}"
if ! command -v cloudflared >/dev/null 2>&1 && [[ ! -x "$CF_BIN" ]]; then
  echo "[tunnel] cloudflared not found, installing to $CF_BIN ..."
  mkdir -p "$(dirname "$CF_BIN")"
  curl -fsSL --retry 3 --output "$CF_BIN" \
    https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
  chmod +x "$CF_BIN"
fi
command -v cloudflared >/dev/null 2>&1 || export PATH="$HOME/.local/bin:$PATH"

# Sanity check: is Vite up?
if ! curl -fsS -o /dev/null --max-time 2 "http://localhost:$PORT/"; then
  echo "[tunnel] WARN: nothing answering on http://localhost:$PORT/"
  echo "[tunnel]       start Vite first:  cd app/frontend && npm run dev"
  echo "[tunnel]       (continuing anyway — cloudflared will retry once Vite is up)"
fi

echo "[tunnel] mode=$MODE port=$PORT"
case "$MODE" in
  quick)
    echo "[tunnel] starting quick tunnel (random hostname, no account)"
    exec cloudflared tunnel --no-autoupdate --url "http://localhost:$PORT"
    ;;
  named)
    if [[ -z "$NAME" ]]; then
      echo "ERROR: --named requires a tunnel name" >&2
      exit 2
    fi
    echo "[tunnel] starting named tunnel '$NAME'"
    echo "[tunnel] requires:  cloudflared tunnel login   (one-time)"
    echo "[tunnel]            cloudflared tunnel create $NAME"
    echo "[tunnel]            cloudflared tunnel route dns $NAME <your.host>"
    exec cloudflared tunnel --no-autoupdate run "$NAME"
    ;;
esac
