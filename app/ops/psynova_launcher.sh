#!/usr/bin/env bash
# psynova_launcher.sh — invoked by the three "PsyNova Server" .desktop entries.
#
# Usage:
#   psynova_launcher.sh local       — ensure stack is up, no tunnel, open Chrome to local URL
#   psynova_launcher.sh cloudflare  — ensure stack is up + tunnel is running, open Chrome to public URL
#   psynova_launcher.sh stop        — stop tunnel + stack, do not open browser
#
# The actual stack/tunnel processes are managed by systemd user services
# (psynova-stack.service, psynova-tunnel.service); this script just toggles them
# via `systemctl --user`, polls $URL_FILE for the resulting URL, then launches Chrome.
set -uo pipefail

STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/psynova"
URL_FILE="$STATE_DIR/url.txt"
LOG="$STATE_DIR/launcher.log"
mkdir -p "$STATE_DIR"

log() { echo "[launcher $(date -Is)] $*" | tee -a "$LOG"; }

notify() {
  local title="$1" body="${2:-}"
  command -v notify-send >/dev/null 2>&1 && notify-send -a 'PsyNova Server' -i web-browser "$title" "$body" || true
}

# Pick whichever Chrome/Chromium is on PATH. Override with $PSYNOVA_BROWSER.
pick_browser() {
  if [[ -n "${PSYNOVA_BROWSER:-}" ]]; then echo "$PSYNOVA_BROWSER"; return; fi
  for b in google-chrome google-chrome-stable chromium chromium-browser microsoft-edge firefox xdg-open; do
    command -v "$b" >/dev/null 2>&1 && { echo "$b"; return; }
  done
  echo ""
}

wait_for_url_change() {
  local max_secs="${1:-30}" baseline="${2:-}"
  for _ in $(seq 1 "$max_secs"); do
    if [[ -f "$URL_FILE" ]]; then
      local url; url="$(cat "$URL_FILE" 2>/dev/null || true)"
      if [[ -n "$url" && "$url" != "$baseline" ]]; then
        echo "$url"; return 0
      fi
    fi
    sleep 1
  done
  return 1
}

open_browser() {
  local url="$1"
  local browser; browser="$(pick_browser)"
  if [[ -z "$browser" ]]; then
    log "no browser found on PATH"
    notify 'PsyNova Server' "Stack ready at $url (no browser found to launch)"
    return 0
  fi
  log "opening $browser → $url"
  if [[ "$browser" == "xdg-open" ]]; then
    xdg-open "$url" >/dev/null 2>&1 &
  else
    "$browser" --new-window "$url" >/dev/null 2>&1 &
  fi
}

case "${1:-}" in
  local)
    log "MODE: local"
    notify 'PsyNova Server' 'Starting local stack...'
    systemctl --user stop psynova-tunnel.service >/dev/null 2>&1 || true
    rm -f "$URL_FILE"
    if ! systemctl --user start psynova-stack.service; then
      log "failed to start stack; check journalctl --user -u psynova-stack"
      notify 'PsyNova Server' 'Failed to start — check journalctl --user -u psynova-stack'
      exit 1
    fi
    url="$(wait_for_url_change 60 '')" || url="http://localhost:5173"
    open_browser "$url"
    notify 'PsyNova Server' "Local stack ready: $url"
    ;;
  cloudflare)
    log "MODE: cloudflare"
    notify 'PsyNova Server' 'Starting local stack + Cloudflare tunnel...'
    rm -f "$URL_FILE"
    if ! systemctl --user start psynova-stack.service; then
      log "failed to start stack"; notify 'PsyNova Server' 'Stack failed to start'
      exit 1
    fi
    local_url="$(wait_for_url_change 60 '')" || local_url="http://localhost:5173"
    log "local URL ready ($local_url); launching tunnel..."
    if ! systemctl --user start psynova-tunnel.service; then
      log "failed to start tunnel; falling back to local URL"
      open_browser "$local_url"
      notify 'PsyNova Server' "Tunnel failed; opened local URL: $local_url"
      exit 1
    fi
    public_url="$(wait_for_url_change 45 "$local_url")" || public_url="$local_url"
    open_browser "$public_url"
    notify 'PsyNova Server' "Cloudflare tunnel ready: $public_url"
    ;;
  stop)
    log "MODE: stop"
    notify 'PsyNova Server' 'Stopping stack + tunnel...'
    systemctl --user stop psynova-tunnel.service >/dev/null 2>&1 || true
    systemctl --user stop psynova-stack.service >/dev/null 2>&1 || true
    notify 'PsyNova Server' 'Stack stopped'
    ;;
  *) echo "usage: $0 local|cloudflare|stop" >&2; exit 2 ;;
esac
