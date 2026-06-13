#!/usr/bin/env bash
# install_printer_plotter.sh — parameterized large-format / plotter CUPS queue installer.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/printers/plotter.last-install.env"
PLOTTER_NAME="${PLOTTER_NAME:-Plotter}"
PLOTTER_URI="${PLOTTER_URI:-}"
PLOTTER_PPD="${PLOTTER_PPD:-}"
PLOTTER_DRIVER_PKG="${PLOTTER_DRIVER_PKG:-printer-driver-gutenprint}"
DISCOVER=0

usage() {
  cat <<EOF
Usage: $0 [--discover] [--env FILE]

Environment:
  PLOTTER_NAME       CUPS queue name (default: Plotter)
  PLOTTER_URI        Device URI from lpinfo -v
  PLOTTER_PPD        Path to PPD file OR lpadmin -m driver keyword
  PLOTTER_DRIVER_PKG apt package for drivers (default: printer-driver-gutenprint)

Examples:
  $0 --discover
  PLOTTER_URI=usb://HP/... PLOTTER_PPD=/path/to/driver.ppd $0
EOF
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --discover) DISCOVER=1; shift ;;
    --env) ENV_FILE="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) break ;;
  esac
done

if [[ "$DISCOVER" -eq 1 ]]; then
  echo "=== USB/network devices (lpinfo -v) ==="
  lpinfo -v 2>/dev/null || true
  echo ""
  echo "=== Plotter-related drivers (lpinfo -m) ==="
  lpinfo -m 2>/dev/null | grep -iE 'designjet|imageprograf|surecolor|plotter|wide|large|hp.*dj|epson.*stylus' | head -40 || true
  exit 0
fi

# Load saved env for non-interactive re-run
if [[ -f "$ENV_FILE" && -z "$PLOTTER_URI" ]]; then
  # shellcheck source=/dev/null
  source "$ENV_FILE"
fi

if [[ "$(id -u)" -ne 0 ]]; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y cups cups-filters "$PLOTTER_DRIVER_PKG"
else
  DEBIAN_FRONTEND=noninteractive apt-get install -y cups cups-filters "$PLOTTER_DRIVER_PKG"
fi

if [[ -z "$PLOTTER_URI" ]]; then
  echo "Available devices:"
  lpinfo -v 2>/dev/null || true
  read -r -p "PLOTTER_URI: " PLOTTER_URI
fi

if [[ -z "$PLOTTER_PPD" ]]; then
  echo "Sample drivers (first 15 matches):"
  lpinfo -m 2>/dev/null | grep -iE 'designjet|imageprograf|surecolor|gutenprint' | head -15 || lpinfo -m 2>/dev/null | head -15
  read -r -p "PLOTTER_PPD (path or lpadmin -m name): " PLOTTER_PPD
fi

[[ -n "$PLOTTER_URI" ]] || { echo "ERROR: PLOTTER_URI required" >&2; exit 1; }
[[ -n "$PLOTTER_PPD" ]] || { echo "ERROR: PLOTTER_PPD required" >&2; exit 1; }

echo "[plotter] Queue: $PLOTTER_NAME"
echo "[plotter] URI:   $PLOTTER_URI"

if [[ -f "$PLOTTER_PPD" ]]; then
  sudo lpadmin -p "$PLOTTER_NAME" -E -v "$PLOTTER_URI" -P "$PLOTTER_PPD" -o printer-is-shared=false 2>/dev/null || \
    lpadmin -p "$PLOTTER_NAME" -E -v "$PLOTTER_URI" -P "$PLOTTER_PPD" -o printer-is-shared=false
else
  sudo lpadmin -p "$PLOTTER_NAME" -E -v "$PLOTTER_URI" -m "$PLOTTER_PPD" -o printer-is-shared=false 2>/dev/null || \
    lpadmin -p "$PLOTTER_NAME" -E -v "$PLOTTER_URI" -m "$PLOTTER_PPD" -o printer-is-shared=false
fi

sudo cupsenable "$PLOTTER_NAME" 2>/dev/null || cupsenable "$PLOTTER_NAME"
sudo cupsaccept "$PLOTTER_NAME" 2>/dev/null || cupsaccept "$PLOTTER_NAME"

mkdir -p "$(dirname "$ENV_FILE")"
cat > "$ENV_FILE" <<EOF
PLOTTER_NAME=$PLOTTER_NAME
PLOTTER_URI=$PLOTTER_URI
PLOTTER_PPD=$PLOTTER_PPD
PLOTTER_DRIVER_PKG=$PLOTTER_DRIVER_PKG
installed_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
installed_on=$(hostname)
EOF
chmod 600 "$ENV_FILE"

echo "[plotter] Saved $ENV_FILE"
lpstat -p "$PLOTTER_NAME" 2>/dev/null || true
