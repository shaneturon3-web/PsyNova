#!/usr/bin/env bash
# apply_inkscape_config.sh — restore Inkscape profile from bundle to ~/.config/inkscape
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLE="${1:-}"

find_bundle() {
  local -a candidates=(
    "${1:-}"
    "$HOME/shared/InkscapeConfig"
    "/mnt/shared/InkscapeConfig"
    "/run/user/$(id -u)/gvfs/smb-share:server=optiplex.local,share=shared/InkscapeConfig"
    "/run/user/$(id -u)/gvfs/smb-share:server=optiplex.local,share=shared/PsyNova/.bundles/InkscapeConfig"
  )
  local c
  for c in "${candidates[@]}"; do
    [[ -n "$c" && -d "$c/inkscape" ]] && { echo "$c"; return 0; }
  done
  return 1
}

BUNDLE="${BUNDLE:-$(find_bundle "${1:-}" || true)}"
[[ -n "$BUNDLE" ]] || { echo "ERROR: InkscapeConfig bundle not found" >&2; exit 1; }

DEST="$HOME/.config/inkscape"
STAMP=$(date +%Y%m%d_%H%M%S)

if [[ -d "$DEST" ]]; then
  mv "$DEST" "${DEST}.pre-restore.${STAMP}"
fi

mkdir -p "$DEST"
rsync -a "$BUNDLE/inkscape/" "$DEST/"

echo "[inkscape] Restored from $BUNDLE -> $DEST"
