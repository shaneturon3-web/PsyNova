#!/usr/bin/env bash
# psynova_tunnel.sh — start/stop/status a Cloudflare quick tunnel that exposes Vite
# (port 5173) to a public https://*.trycloudflare.com URL. Wraps start_public_tunnel.sh
# in a supervised mode that:
#   1. requires the stack to be up first (poll /api/health),
#   2. parses the printed `https://*.trycloudflare.com` URL from cloudflared's output,
#   3. atomically rewrites $URL_FILE so the launcher (and any opened browser) sees the
#      public URL instead of the local one.
#
# Usage from systemd: PsyNova-tunnel.service has Requires=psynova-stack.service.
set -uo pipefail

REPO_ROOT="${PSYNOVA_REPO_ROOT:-/home/shane/PsyNova}"
APP_DIR="$REPO_ROOT/app"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/psynova"
URL_FILE="$STATE_DIR/url.txt"
PID_TUNNEL="$STATE_DIR/tunnel.pid"
LOG_TUNNEL="$STATE_DIR/tunnel.log"
LOCAL_URL="http://localhost:5173"

mkdir -p "$STATE_DIR"

log() { echo "[tunnel $(date -Is)] $*" | tee -a "$LOG_TUNNEL"; }

cmd_start() {
  if [[ -f "$PID_TUNNEL" ]] && kill -0 "$(cat "$PID_TUNNEL")" 2>/dev/null; then
    log "tunnel already running (pid=$(cat "$PID_TUNNEL"))"
    return 0
  fi
  log "waiting for local stack on :5173 (max 60s)..."
  for _ in $(seq 1 60); do
    curl -fsS -o /dev/null --max-time 1 "$LOCAL_URL/" && break || sleep 1
  done

  # Start cloudflared via the helper script. Pipe stdout+stderr to LOG_TUNNEL so we
  # can grep for the public URL even after the process detaches.
  : > "$LOG_TUNNEL.live"
  log "starting cloudflared..."
  (
    setsid bash "$APP_DIR/ops/start_public_tunnel.sh" >>"$LOG_TUNNEL.live" 2>&1
  ) &
  echo $! > "$PID_TUNNEL"
  log "cloudflared pid=$(cat "$PID_TUNNEL")"

  # Parse the public URL within 30s.
  local public=""
  for _ in $(seq 1 30); do
    public="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG_TUNNEL.live" | head -n1 || true)"
    [[ -n "$public" ]] && break
    sleep 1
  done
  cat "$LOG_TUNNEL.live" >> "$LOG_TUNNEL"

  if [[ -n "$public" ]]; then
    log "public tunnel URL: $public"

    # If a workers.dev reverse-proxy is set up (see setup_cloudflare_worker.sh),
    # refresh its ORIGIN_URL var so the stable workers.dev URL keeps serving
    # after the trycloudflare URL rotates. Front the launcher (and any opened
    # browser) with the workers.dev URL instead of the raw trycloudflare one,
    # which solves DNS-filter blocking of *.trycloudflare.com.
    WORKER_URL_FILE="$STATE_DIR/worker-url.txt"
    if [[ -f "$WORKER_URL_FILE" && -s "$WORKER_URL_FILE" ]]; then
      log "refreshing workers.dev proxy ORIGIN_URL -> $public"
      if bash "$APP_DIR/ops/redeploy_worker_origin.sh" "$public" >>"$LOG_TUNNEL" 2>&1; then
        worker_url="$(cat "$WORKER_URL_FILE")"
        printf '%s\n' "$worker_url" > "$URL_FILE.tmp" && mv "$URL_FILE.tmp" "$URL_FILE"
        log "URL_FILE -> $worker_url (workers.dev reverse-proxy in front of $public)"
      else
        log "WARN: worker redeploy failed; falling back to raw trycloudflare URL"
        printf '%s\n' "$public" > "$URL_FILE.tmp" && mv "$URL_FILE.tmp" "$URL_FILE"
      fi
    else
      printf '%s\n' "$public" > "$URL_FILE.tmp" && mv "$URL_FILE.tmp" "$URL_FILE"
      log "URL_FILE -> $public (no workers.dev proxy; run setup_cloudflare_worker.sh to add a stable URL)"
    fi
  else
    log "WARN: could not detect public URL in 30s; keeping $URL_FILE as-is."
  fi

  # Stay foreground so systemd sees a live PID; on TERM/INT, clean up and rewrite the
  # URL file back to the local URL.
  if [[ "${PSYNOVA_FOREGROUND:-true}" == "true" ]]; then
    trap 'log "trapped signal — stopping"; cmd_stop; exit 0' TERM INT
    wait "$(cat "$PID_TUNNEL")" 2>/dev/null || true
    cmd_stop
    exit 0
  fi
}

cmd_stop() {
  if [[ -f "$PID_TUNNEL" ]]; then
    pid="$(cat "$PID_TUNNEL")"
    if kill -0 "$pid" 2>/dev/null; then
      log "killing tunnel pid=$pid"
      # cloudflared spawns under setsid; kill the whole process group.
      kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
      for _ in $(seq 1 5); do kill -0 "$pid" 2>/dev/null || break; sleep 1; done
      kill -KILL -- "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
    fi
    rm -f "$PID_TUNNEL"
  fi
  pkill -f 'cloudflared tunnel' 2>/dev/null || true
  # Reset URL file back to local if local stack is up.
  if curl -fsS -o /dev/null --max-time 1 "$LOCAL_URL/"; then
    printf '%s\n' "$LOCAL_URL" > "$URL_FILE"
  else
    rm -f "$URL_FILE"
  fi
  log "tunnel stopped."
}

cmd_status() {
  if [[ -f "$PID_TUNNEL" ]] && kill -0 "$(cat "$PID_TUNNEL")" 2>/dev/null; then
    echo "tunnel    UP (pid $(cat "$PID_TUNNEL"))"
    [[ -f "$URL_FILE" ]] && echo "url       $(cat "$URL_FILE")"
    exit 0
  else
    echo "tunnel    DOWN"; exit 1
  fi
}

case "${1:-}" in
  start)  cmd_start ;;
  stop)   cmd_stop ;;
  status) cmd_status ;;
  *) echo "usage: $0 start|stop|status" >&2; exit 2 ;;
esac
