#!/usr/bin/env bash
# pack_inkscape_config.sh — bundle ~/.config/inkscape for SMB migration.
set -euo pipefail

DEST="${1:-${INKSCAPE_BUNDLE_DEST:-$HOME/shared/InkscapeConfig}}"
SRC="${INKSCAPE_CONFIG_SRC:-$HOME/.config/inkscape}"

[[ -d "$SRC" ]] || { echo "ERROR: Inkscape config not found at $SRC" >&2; exit 1; }

mkdir -p "$DEST"

rsync -a --delete \
  --exclude 'extension-errors.log' \
  --exclude 'cphistory.xml' \
  "$SRC/" "$DEST/inkscape/"

cat > "$DEST/manifest.txt" <<EOF
created_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
source_host=$(hostname)
source_user=$USER
source_path=$SRC
bundle_version=1
EOF

echo "[inkscape] Packed -> $DEST"
