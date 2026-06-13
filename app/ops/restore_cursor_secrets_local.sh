#!/usr/bin/env bash
# restore_cursor_secrets_local.sh — restore Cursor config from SMB bundle to local disk.
# Never run while Cursor is open. Never work from the SMB path directly in Cursor.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=cursor_secrets_lib.sh
source "$SCRIPT_DIR/cursor_secrets_lib.sh"

SHARE_CURSOR="${1:-$(find_cursor_secrets_share "${1:-}" || true)}"
if [[ -z "$SHARE_CURSOR" || ! -d "$SHARE_CURSOR" ]]; then
  echo "ERROR: CursorSecrets share not found. Mount smb://optiplex.local/shared/CursorSecrets" >&2
  exit 1
fi

cursor_must_be_closed

echo "[restore] Source bundle: $SHARE_CURSOR"
echo "[restore] Target: $CURSOR_DOT_DIR + $CURSOR_USER_DIR"

mkdir -p "$CURSOR_DOT_DIR" "$CURSOR_USER_DIR" "$CURSOR_GLOBAL_STORAGE"

# dot-cursor: everything except state DB
if [[ -d "$SHARE_CURSOR/dot-cursor" ]]; then
  for f in mcp.json cli-config.json argv.json; do
    [[ -f "$SHARE_CURSOR/dot-cursor/$f" ]] && \
      cp --no-preserve=mode,ownership "$SHARE_CURSOR/dot-cursor/$f" "$CURSOR_DOT_DIR/"
  done
  for dir in skills-cursor rules plugins projects plans; do
    [[ -d "$SHARE_CURSOR/dot-cursor/$dir" ]] && \
      cursor_rsync_or_warn "$SHARE_CURSOR/dot-cursor/$dir/" "$CURSOR_DOT_DIR/$dir/"
  done
  if [[ -f "$SHARE_CURSOR/dot-cursor/extensions/extensions.json" ]]; then
    mkdir -p "$CURSOR_DOT_DIR/extensions"
    cp --no-preserve=mode,ownership "$SHARE_CURSOR/dot-cursor/extensions/extensions.json" "$CURSOR_DOT_DIR/extensions/"
  fi
fi

# settings + keybindings (never blind rsync of globalStorage)
for f in settings.json keybindings.json; do
  [[ -f "$SHARE_CURSOR/config-Cursor/$f" ]] && \
    cp --no-preserve=mode,ownership "$SHARE_CURSOR/config-Cursor/$f" "$CURSOR_USER_DIR/$f"
done

# state.vscdb — pick best valid copy from bundle
bundle_gs="$SHARE_CURSOR/config-Cursor/globalStorage"
dest_db="$CURSOR_GLOBAL_STORAGE/state.vscdb"
chosen=""
for candidate in "$bundle_gs/state.vscdb.backup" "$bundle_gs/state.vscdb"; do
  if [[ -f "$candidate" ]] && cursor_sqlite_quick_check "$candidate"; then
    chosen="$candidate"
    break
  fi
done

if [[ -n "$chosen" ]]; then
  if [[ -f "$dest_db" ]]; then
    corrupt_backup="$CURSOR_GLOBAL_STORAGE/state.vscdb.corrupt.$(date +%Y%m%d_%H%M%S)"
    mv "$dest_db" "$corrupt_backup" 2>/dev/null || true
    echo "[restore] Backed up existing state.vscdb -> $(basename "$corrupt_backup")"
  fi
  rm -f "$CURSOR_GLOBAL_STORAGE/state.vscdb-wal" "$CURSOR_GLOBAL_STORAGE/state.vscdb-shm"
  cp --no-preserve=mode,ownership "$chosen" "$dest_db"
  echo "[restore] Installed state.vscdb from $(basename "$chosen")"
else
  echo "[restore] WARN: no valid state.vscdb in bundle; keeping existing local DB if any" >&2
fi

if [[ -f "$SHARE_CURSOR/machine/.machine_env" ]]; then
  cp "$SHARE_CURSOR/machine/.machine_env" "$HOME/.machine_env"
  sed -i "s/^export MACHINE_NAME=.*/export MACHINE_NAME=\"$(hostname)\"/" "$HOME/.machine_env"
  echo "[restore] Updated ~/.machine_env MACHINE_NAME=$(hostname)"
fi

if [[ -f "$SHARE_CURSOR/optiplex_authorized_key.pub" ]]; then
  mkdir -p "$HOME/.ssh"
  chmod 700 "$HOME/.ssh"
  touch "$HOME/.ssh/authorized_keys"
  chmod 600 "$HOME/.ssh/authorized_keys"
  if ! grep -qF "$(cat "$SHARE_CURSOR/optiplex_authorized_key.pub")" "$HOME/.ssh/authorized_keys" 2>/dev/null; then
    cat "$SHARE_CURSOR/optiplex_authorized_key.pub" >> "$HOME/.ssh/authorized_keys"
    echo "[restore] Added SSH public key from bundle"
  fi
fi

echo ""
echo "[restore] Done."
echo "  1. Reopen Cursor and open folder: ~/PsyNova  (NOT the SMB share path)"
echo "  2. Settings -> MCP -> re-auth any disconnected servers"
echo "  3. Settings -> Rules -> verify they match your source machine"
