#!/usr/bin/env bash
# install_printer_xerox_6130.sh — install Xerox Phaser 6130N from bundled PPD.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PPD="$SCRIPT_DIR/printers/Phaser-6130N.ppd"
QUEUE="${PRINTER_QUEUE:-Phaser-6130N}"
URI="${PRINTER_URI:-}"
PRINT_TEST=0

usage() {
  echo "Usage: $0 [-t] [PRINTER_URI]"
  echo "  -t   print test page after install"
  exit 0
}

while getopts ":th" opt; do
  case "$opt" in
    t) PRINT_TEST=1 ;;
    h) usage ;;
    *) usage ;;
  esac
done
shift $((OPTIND - 1))
[[ -n "${1:-}" ]] && URI="$1"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Installing CUPS packages (sudo)..."
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
    cups cups-filters foomatic-db-compressed-ppds openprinting-ppds printer-driver-all
else
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
    cups cups-filters foomatic-db-compressed-ppds openprinting-ppds printer-driver-all
fi

[[ -f "$PPD" ]] || { echo "ERROR: missing PPD at $PPD" >&2; exit 1; }

if [[ -z "$URI" ]]; then
  URI="$(lpinfo -v 2>/dev/null | grep -i 'phaser.*6130' | head -1 | awk '{print $2}' || true)"
fi
if [[ -z "$URI" ]]; then
  echo "Phaser 6130 not found on USB. Available devices:"
  lpinfo -v 2>/dev/null || true
  echo "Set PRINTER_URI=usb://... or pass URI as argument." >&2
  exit 1
fi

echo "[xerox] Queue: $QUEUE"
echo "[xerox] URI:   $URI"
echo "[xerox] PPD:   $PPD"

sudo lpadmin -p "$QUEUE" -E -v "$URI" -P "$PPD" -o printer-is-shared=false 2>/dev/null || \
  lpadmin -p "$QUEUE" -E -v "$URI" -P "$PPD" -o printer-is-shared=false

sudo lpoptions -p "$QUEUE" -o print-color-mode=monochrome 2>/dev/null || \
  lpoptions -p "$QUEUE" -o print-color-mode=monochrome

sudo cupsenable "$QUEUE" 2>/dev/null || cupsenable "$QUEUE"
sudo cupsaccept "$QUEUE" 2>/dev/null || cupsaccept "$QUEUE"

echo "[xerox] Installed. Default options:"
lpoptions -p "$QUEUE" 2>/dev/null || true

if [[ "$PRINT_TEST" -eq 1 ]]; then
  echo "[xerox] Printing test page..."
  lp -d "$QUEUE" /usr/share/cups/data/testprint 2>/dev/null || \
    lp -d "$QUEUE" -o job-sheets=standard,standard /etc/hosts
fi
