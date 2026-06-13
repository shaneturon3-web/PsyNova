#!/usr/bin/env bash
# apply_from_optiplex_shares.sh — restore ~/PsyNova and ~/SugarCubes from OptiPlex SMB shares.
# Cursor secrets are NOT applied here — run fix-cursor-secrets after quitting Cursor.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=cursor_secrets_lib.sh
source "$SCRIPT_DIR/cursor_secrets_lib.sh"

find_share() {
  local name="$1"
  local -a candidates=(
    "/srv/shared/$name"
    "$HOME/shared/$name"
    "/mnt/shared/$name"
    "/media/$USER/shared/$name"
    "/run/user/$(id -u)/gvfs/smb-share:server=optiplex.local,share=shared/$name"
  )
  for c in "${candidates[@]}"; do
    [[ -d "$c" ]] && { echo "$c"; return 0; }
  done
  return 1
}

SHARE_PSYNOVA="${SHARE_PSYNOVA:-$(find_share PsyNova || true)}"
SHARE_SUGARCUBES="${SHARE_SUGARCUBES:-$(find_share SugarCubes || true)}"
SHARE_CURSOR="${SHARE_CURSOR:-$(find_share CursorSecrets || true)}"

if [[ -z "$SHARE_PSYNOVA" ]] || [[ ! -d "$SHARE_PSYNOVA/app" ]]; then
  echo "ERROR: PsyNova share not found. Mount smb://optiplex.local/shared/PsyNova" >&2
  exit 1
fi
if [[ -z "$SHARE_SUGARCUBES" ]]; then
  echo "ERROR: SugarCubes share not found. Mount smb://optiplex.local/shared/SugarCubes" >&2
  exit 1
fi

STAMP=$(date +%Y%m%d)
RSYNC_FLAGS=(-a)

echo "[apply] PsyNova share: $SHARE_PSYNOVA"
echo "[apply] SugarCubes share: $SHARE_SUGARCUBES"
[[ -n "$SHARE_CURSOR" ]] && echo "[apply] CursorSecrets share: $SHARE_CURSOR (restore separately)"

for dir in PsyNova SugarCubes; do
  target="$HOME/$dir"
  if [[ -d "$target" && ! -L "$target" ]]; then
    backup="${target}.pre-migration.${STAMP}"
    echo "[apply] Backup $target -> $backup"
    mv "$target" "$backup"
  fi
done

echo "[apply] Restore PsyNova from share"
mkdir -p "$HOME/PsyNova"
rsync "${RSYNC_FLAGS[@]}" \
  --exclude 'MKT Artifacts/' --exclude 'migration-bundle/' --exclude '.psynova-sync/' \
  "$SHARE_PSYNOVA/" "$HOME/PsyNova/"

echo "[apply] Restore SugarCubes from share"
mkdir -p "$HOME/SugarCubes"
rsync "${RSYNC_FLAGS[@]}" \
  --exclude '.fr-*' \
  "$SHARE_SUGARCUBES/" "$HOME/SugarCubes/"

if [[ -d "$SHARE_PSYNOVA/.psynova-sync/state" ]]; then
  mkdir -p "$HOME/.local/state/psynova"
  rsync "${RSYNC_FLAGS[@]}" "$SHARE_PSYNOVA/.psynova-sync/state/" "$HOME/.local/state/psynova/"
fi
if [[ -f "$SHARE_PSYNOVA/.psynova-sync/rclone.conf" ]]; then
  mkdir -p "$HOME/.config/rclone"
  cp "$SHARE_PSYNOVA/.psynova-sync/rclone.conf" "$HOME/.config/rclone/rclone.conf"
fi
if [[ -d "$SHARE_PSYNOVA/.psynova-sync/cloudflared" ]]; then
  mkdir -p "$HOME/.cloudflared"
  rsync "${RSYNC_FLAGS[@]}" "$SHARE_PSYNOVA/.psynova-sync/cloudflared/" "$HOME/.cloudflared/"
fi

echo ""
echo "[apply] Cursor secrets NOT applied automatically (SQLite safety)."
if cursor_is_running; then
  echo "  Quit Cursor completely, then run:"
  echo "    fix-cursor-secrets"
else
  echo "  Cursor is not running — restoring secrets now..."
  bash "$SCRIPT_DIR/restore_cursor_secrets_local.sh" "${SHARE_CURSOR:-}"
fi

echo ""
echo "[apply] Done. Next: bash ~/PsyNova/app/ops/bootstrap_optiplex.sh"
