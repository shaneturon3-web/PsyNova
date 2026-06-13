#!/usr/bin/env bash
# SETUP_AND_APPLY.sh — run once on OptiPlex after SMB shares are populated.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPLY="$SCRIPT_DIR/apply_from_optiplex_shares.sh"
BOOT="$SCRIPT_DIR/bootstrap_optiplex.sh"
RESTORE="$SCRIPT_DIR/restore_cursor_secrets_local.sh"

for script in "$APPLY" "$BOOT" "$RESTORE"; do
  [[ -f "$script" ]] || { echo "ERROR: missing $script" >&2; exit 1; }
done

# shellcheck source=cursor_secrets_lib.sh
source "$SCRIPT_DIR/cursor_secrets_lib.sh"

echo "=== OptiPlex setup from SMB shares on $(hostname) ==="
bash "$APPLY"
bash "$BOOT"

echo ""
if cursor_is_running; then
  echo "=== Cursor secrets pending ==="
  echo "Quit Cursor completely, then run:"
  echo "  fix-cursor-secrets"
else
  echo "=== Restoring Cursor secrets ==="
  bash "$RESTORE"
fi

echo ""
echo "=== Done ==="
echo "Reopen Cursor on ~/PsyNova (NOT the SMB share path)."
echo "Settings -> MCP -> re-auth disconnected servers if needed."
