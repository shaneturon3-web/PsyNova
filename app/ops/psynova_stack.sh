#!/usr/bin/env bash
# psynova_stack.sh — start/stop/status the PsyNova local stack:
#   1. ensure Postgres container `psynova-db` is healthy (DB stays up; we don't stop it)
#   2. backend  : npm run start:dev      (Nest, port 3000)
#   3. frontend : npm run dev            (Vite, port 5173)
#
# Behaviours:
#   start  — starts both children in this process group; writes PIDs;
#            polls /api/health until ready; writes ~/.local/state/psynova/url.txt with
#            the local URL (http://localhost:5173). Exits 0 once both are up.
#            (Designed to be run via `setsid` so child processes survive.)
#   stop   — kills tracked PIDs (SIGTERM, then SIGKILL after 5s grace); frees port 3000.
#   status — prints up/down for backend + frontend + DB; exits 0 only if all up.
#
# State directory: $XDG_STATE_HOME/psynova (default ~/.local/state/psynova).
# Log files there: stack.log, backend.log, frontend.log.
set -uo pipefail

# systemd and non-login shells often omit nvm; load before any npm invocation.
if [[ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  source "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
fi
export PATH="${HOME}/.local/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"

REPO_ROOT="${PSYNOVA_REPO_ROOT:-/home/shane/PsyNova}"
APP_DIR="$REPO_ROOT/app"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/psynova"
URL_FILE="$STATE_DIR/url.txt"
PID_BACKEND="$STATE_DIR/backend.pid"
PID_FRONTEND="$STATE_DIR/frontend.pid"
LOG_BACKEND="$STATE_DIR/backend.log"
LOG_FRONTEND="$STATE_DIR/frontend.log"
LOG_STACK="$STATE_DIR/stack.log"
LOCAL_URL="http://localhost:5173"

mkdir -p "$STATE_DIR" "$REPO_ROOT/app/uploads/clinical"

log() { echo "[stack $(date -Is)] $*" | tee -a "$LOG_STACK"; }

ensure_db() {
  if ! docker ps --format '{{.Names}}' | grep -qx 'psynova-db'; then
    log "psynova-db not running; starting via docker compose..."
    (cd "$APP_DIR" && docker compose up -d db) >>"$LOG_STACK" 2>&1
  fi
  for _ in $(seq 1 30); do
    if docker exec psynova-db pg_isready -U psynova -d psynova >/dev/null 2>&1; then
      log "DB healthy."
      return 0
    fi
    sleep 1
  done
  log "DB not healthy after 30s — bailing out."
  return 1
}

start_backend() {
  if [[ -f "$PID_BACKEND" ]] && kill -0 "$(cat "$PID_BACKEND")" 2>/dev/null; then
    log "backend already running (pid=$(cat "$PID_BACKEND"))"
    return 0
  fi
  bash "$APP_DIR/ops/free_port_3000.sh" >>"$LOG_STACK" 2>&1 || true
  log "starting backend → $LOG_BACKEND"
  (
    cd "$APP_DIR/backend"
    NODE_ENV="${NODE_ENV:-development}" \
    USE_PERSISTENCE=true \
    DB_HOST=localhost DB_PORT=5432 DB_NAME=psynova DB_USER=psynova DB_PASSWORD=psynova_password_change_me \
    JWT_SECRET="${JWT_SECRET:-psynova_dev_secret_change_me}" \
    AUDIT_LOG_HMAC_SECRET="${AUDIT_LOG_HMAC_SECRET:-psynova_dev_hmac_secret_change_me}" \
    ATTACHMENTS_DIR="${ATTACHMENTS_DIR:-$REPO_ROOT/app/uploads/clinical}" \
    JITSI_PUBLIC_DEMO_ROOM=true \
    npm run start:dev >>"$LOG_BACKEND" 2>&1
  ) &
  echo $! > "$PID_BACKEND"
  log "backend pid=$(cat "$PID_BACKEND")"
}

start_frontend() {
  if [[ -f "$PID_FRONTEND" ]] && kill -0 "$(cat "$PID_FRONTEND")" 2>/dev/null; then
    log "frontend already running (pid=$(cat "$PID_FRONTEND"))"
    return 0
  fi
  log "starting frontend → $LOG_FRONTEND"
  (
    cd "$APP_DIR/frontend"
    npm run dev >>"$LOG_FRONTEND" 2>&1
  ) &
  echo $! > "$PID_FRONTEND"
  log "frontend pid=$(cat "$PID_FRONTEND")"
}

wait_for_ready() {
  log "waiting for backend on :3000 ..."
  for _ in $(seq 1 60); do
    if curl -fsS -o /dev/null --max-time 1 http://localhost:3000/api/health; then
      log "backend ready."; break
    fi
    sleep 1
  done
  log "waiting for frontend on :5173 ..."
  for _ in $(seq 1 60); do
    if curl -fsS -o /dev/null --max-time 1 "$LOCAL_URL/"; then
      log "frontend ready."; break
    fi
    sleep 1
  done
}

cmd_start() {
  ensure_db || exit 1
  start_backend
  start_frontend
  wait_for_ready
  printf '%s\n' "$LOCAL_URL" > "$URL_FILE"
  log "URL written: $URL_FILE -> $LOCAL_URL"
  # Stay foreground so systemd Type=simple sees a live PID; trap on TERM/INT to clean up.
  if [[ "${PSYNOVA_FOREGROUND:-true}" == "true" ]]; then
    trap 'log "trapped signal — stopping"; cmd_stop; exit 0' TERM INT
    while kill -0 "$(cat "$PID_BACKEND" 2>/dev/null)" 2>/dev/null \
       && kill -0 "$(cat "$PID_FRONTEND" 2>/dev/null)" 2>/dev/null; do
      sleep 5
    done
    log "a child process exited — calling stop and quitting."
    cmd_stop
    exit 1
  fi
}

cmd_stop() {
  for f in "$PID_BACKEND" "$PID_FRONTEND"; do
    if [[ -f "$f" ]]; then
      pid="$(cat "$f")"
      if kill -0 "$pid" 2>/dev/null; then
        log "killing $f pid=$pid"
        kill -TERM "$pid" 2>/dev/null || true
        for _ in $(seq 1 5); do kill -0 "$pid" 2>/dev/null || break; sleep 1; done
        kill -KILL "$pid" 2>/dev/null || true
      fi
      rm -f "$f"
    fi
  done
  # Sweep any straggler processes by name + free port 3000 + remove URL file.
  pkill -f 'nest start --watch' 2>/dev/null || true
  pkill -f 'vite.*--host' 2>/dev/null || true
  pkill -f 'vite' 2>/dev/null || true
  bash "$APP_DIR/ops/free_port_3000.sh" >>"$LOG_STACK" 2>&1 || true
  rm -f "$URL_FILE"
  log "stack stopped."
}

cmd_status() {
  local rc=0
  if docker ps --format '{{.Names}}' | grep -qx 'psynova-db'; then echo "db        UP"; else echo "db        DOWN"; rc=1; fi
  if [[ -f "$PID_BACKEND" ]] && kill -0 "$(cat "$PID_BACKEND")" 2>/dev/null; then echo "backend   UP (pid $(cat "$PID_BACKEND"))"; else echo "backend   DOWN"; rc=1; fi
  if [[ -f "$PID_FRONTEND" ]] && kill -0 "$(cat "$PID_FRONTEND")" 2>/dev/null; then echo "frontend  UP (pid $(cat "$PID_FRONTEND"))"; else echo "frontend  DOWN"; rc=1; fi
  [[ -f "$URL_FILE" ]] && echo "url       $(cat "$URL_FILE")" || echo "url       (none)"
  exit $rc
}

case "${1:-}" in
  start)  cmd_start ;;
  stop)   cmd_stop ;;
  status) cmd_status ;;
  *) echo "usage: $0 start|stop|status" >&2; exit 2 ;;
esac
