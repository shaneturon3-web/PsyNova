#!/usr/bin/env bash
# sync_to_optiplex.sh — push PsyNova, SugarCubes, Cursor secrets, AgentStack, Inkscape to OptiPlex SMB shares.
#
# Targets:
#   smb://optiplex.local/shared/PsyNova
#   smb://optiplex.local/shared/SugarCubes
#   smb://optiplex.local/shared/CursorSecrets
#   smb://optiplex.local/shared/AgentStack
#   smb://optiplex.local/shared/InkscapeConfig
#
# IMPORTANT: Quit Cursor before running. state.vscdb is checkpointed locally — never copy WAL over SMB.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=cursor_secrets_lib.sh
source "$SCRIPT_DIR/cursor_secrets_lib.sh"

GVFS_BASE="${GVFS_BASE:-/run/user/$(id -u)/gvfs/smb-share:server=optiplex.local,share=shared}"
DEST_PSYNOVA="${DEST_PSYNOVA:-$GVFS_BASE/PsyNova}"
DEST_SUGARCUBES="${DEST_SUGARCUBES:-$GVFS_BASE/SugarCubes}"
DEST_CURSOR="${DEST_CURSOR:-$GVFS_BASE/CursorSecrets}"
DEST_AGENT="${DEST_AGENT:-$GVFS_BASE/AgentStack}"
DEST_INKSCAPE="${DEST_INKSCAPE:-$GVFS_BASE/InkscapeConfig}"

SRC_PSYNOVA="${PSYNOVA_REPO_ROOT:-$HOME/PsyNova}"
SRC_SUGARCUBES="${SUGARCUBES_ROOT:-$HOME/SugarCubes}"
LOCAL_SHARED="${LOCAL_SHARED:-$HOME/shared}"

RSYNC_FLAGS=(-a --no-perms --no-owner --no-group --info=progress2 --copy-links)

rsync_or_warn() {
  rsync "${RSYNC_FLAGS[@]}" "$@" || {
    local code=$?
    if [[ $code -eq 23 ]]; then
      echo "[sync] WARN: rsync code 23 (SMB metadata); data likely copied" >&2
    else
      return $code
    fi
  }
}

require_mount() {
  local path="$1" url="$2"
  if [[ ! -d "$path" ]]; then
    echo "ERROR: share not mounted at $path" >&2
    echo "Open $url in the file manager first." >&2
    exit 1
  fi
}

echo "[sync] Pre-flight: Cursor must be fully quit before syncing secrets."
cursor_must_be_closed

require_mount "$GVFS_BASE" "smb://optiplex.local/shared"
require_mount "$DEST_PSYNOVA" "smb://optiplex.local/shared/PsyNova"
require_mount "$DEST_SUGARCUBES" "smb://optiplex.local/shared/SugarCubes"
mkdir -p "$DEST_CURSOR" "$DEST_AGENT" "$DEST_INKSCAPE"

echo "[sync] Packing AgentStack + Inkscape bundles locally..."
mkdir -p "$LOCAL_SHARED"
bash "$SCRIPT_DIR/pack_agentstack_bundle.sh" "$LOCAL_SHARED/AgentStack"
bash "$SCRIPT_DIR/pack_inkscape_config.sh" "$LOCAL_SHARED/InkscapeConfig"

echo "[sync] PsyNova -> $DEST_PSYNOVA"
rsync_or_warn \
  --exclude node_modules --exclude dist --exclude .venv-excel --exclude exports/ \
  --exclude 'MKT Artifacts/' --exclude 'migration-bundle/' \
  "$SRC_PSYNOVA/" "$DEST_PSYNOVA/"

for envf in .env app/.env app/backend/.env app/backend/.env.local; do
  [[ -f "$SRC_PSYNOVA/$envf" ]] && cp --no-preserve=mode,ownership "$SRC_PSYNOVA/$envf" "$DEST_PSYNOVA/$envf"
done

mkdir -p "$DEST_PSYNOVA/.psynova-sync"
[[ -d "$HOME/.local/state/psynova" ]] && rsync_or_warn "$HOME/.local/state/psynova/" "$DEST_PSYNOVA/.psynova-sync/state/"
[[ -d "$HOME/.cloudflared" ]] && rsync_or_warn "$HOME/.cloudflared/" "$DEST_PSYNOVA/.psynova-sync/cloudflared/"
[[ -f "$HOME/.config/rclone/rclone.conf" ]] && cp --no-preserve=mode,ownership "$HOME/.config/rclone/rclone.conf" "$DEST_PSYNOVA/.psynova-sync/rclone.conf"

echo "[sync] SugarCubes -> $DEST_SUGARCUBES"
rsync_or_warn \
  --exclude .venv --exclude __pycache__ --exclude '*.pyc' \
  "$SRC_SUGARCUBES/" "$DEST_SUGARCUBES/"

echo "[sync] Cursor secrets bundle -> $DEST_CURSOR"
bundle_cursor_secrets_to "$DEST_CURSOR"

echo "[sync] AgentStack -> $DEST_AGENT"
rsync_or_warn "$LOCAL_SHARED/AgentStack/" "$DEST_AGENT/"

echo "[sync] InkscapeConfig -> $DEST_INKSCAPE"
rsync_or_warn "$LOCAL_SHARED/InkscapeConfig/" "$DEST_INKSCAPE/"

echo ""
echo "[sync] Done."
echo "  On OptiPlex (Cursor quit): fix-cursor-secrets"
echo "  AgentStack: bash ~/PsyNova/app/ops/apply_agentstack_bundle.sh"
echo "  Inkscape:   bash ~/PsyNova/app/ops/install_inkscape.sh"
