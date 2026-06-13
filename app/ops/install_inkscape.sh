#!/usr/bin/env bash
# install_inkscape.sh — install Inkscape package and apply bundled config.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "$(id -u)" -ne 0 ]]; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y inkscape
else
  DEBIAN_FRONTEND=noninteractive apt-get install -y inkscape
fi

bash "$SCRIPT_DIR/apply_inkscape_config.sh" "${1:-}"
echo "[inkscape] Install complete. Run: inkscape"
