#!/usr/bin/env bash
# Shared helpers for safe Cursor secrets sync/restore (SQLite must stay on local disk).
set -euo pipefail

CURSOR_USER_DIR="${CURSOR_USER_DIR:-$HOME/.config/Cursor/User}"
CURSOR_DOT_DIR="${CURSOR_DOT_DIR:-$HOME/.cursor}"
CURSOR_GLOBAL_STORAGE="${CURSOR_GLOBAL_STORAGE:-$CURSOR_USER_DIR/globalStorage}"
CURSOR_STATE_VSCDB="${CURSOR_STATE_VSCDB:-$CURSOR_GLOBAL_STORAGE/state.vscdb}"

find_cursor_secrets_share() {
  local -a candidates=(
    "${1:-}"
    "$HOME/shared/CursorSecrets"
    "/mnt/shared/CursorSecrets"
    "/media/$USER/shared/CursorSecrets"
    "/run/user/$(id -u)/gvfs/smb-share:server=optiplex.local,share=shared/CursorSecrets"
  )
  local c
  for c in "${candidates[@]}"; do
    [[ -n "$c" && -d "$c" ]] && { echo "$c"; return 0; }
  done
  return 1
}

cursor_is_running() {
  pgrep -f '[C]ursor' >/dev/null 2>&1 || \
  pgrep -f '[c]ursor' >/dev/null 2>&1 || \
  pgrep -x cursor >/dev/null 2>&1
}

cursor_must_be_closed() {
  if cursor_is_running; then
    echo "ERROR: Cursor is running. Quit Cursor completely before syncing or restoring secrets." >&2
    echo "  (SQLite state.vscdb corrupts when copied over SMB while Cursor is open.)" >&2
    exit 1
  fi
}

cursor_sqlite_quick_check() {
  local db="$1"
  command -v sqlite3 >/dev/null 2>&1 || { echo "WARN: sqlite3 not installed; skipping quick_check for $db" >&2; return 0; }
  [[ -f "$db" ]] || return 1
  local result
  result="$(sqlite3 "$db" 'PRAGMA quick_check;' 2>/dev/null | head -1 || true)"
  [[ "$result" == "ok" ]]
}

cursor_checkpoint_vscdb() {
  local src_dir="${1:-$CURSOR_GLOBAL_STORAGE}"
  local db="$src_dir/state.vscdb"
  [[ -f "$db" ]] || return 0

  if ! command -v sqlite3 >/dev/null 2>&1; then
    echo "[cursor] WARN: sqlite3 missing; cannot checkpoint $db" >&2
    return 0
  fi

  echo "[cursor] Checkpoint + vacuum: $db"
  sqlite3 "$db" 'PRAGMA wal_checkpoint(FULL); VACUUM;' 2>/dev/null || {
    echo "[cursor] WARN: checkpoint failed (DB may be locked); ensure Cursor is quit" >&2
    return 1
  }
}

cursor_copy_vscdb_safe() {
  local src_dir="$1"
  local dest_dir="$2"
  mkdir -p "$dest_dir"

  local -a candidates=()
  [[ -f "$src_dir/state.vscdb.backup" ]] && candidates+=("$src_dir/state.vscdb.backup")
  [[ -f "$src_dir/state.vscdb" ]] && candidates+=("$src_dir/state.vscdb")

  local src chosen=""
  for src in "${candidates[@]}"; do
    if cursor_sqlite_quick_check "$src"; then
      chosen="$src"
      break
    fi
    echo "[cursor] WARN: skipping corrupt $(basename "$src")" >&2
  done

  if [[ -z "$chosen" ]]; then
    echo "[cursor] WARN: no valid state.vscdb to bundle" >&2
    return 0
  fi

  cp --no-preserve=mode,ownership "$chosen" "$dest_dir/state.vscdb"
  [[ "$chosen" == *".backup" ]] && cp --no-preserve=mode,ownership "$chosen" "$dest_dir/state.vscdb.backup"
  echo "[cursor] Bundled $(basename "$chosen") -> $dest_dir/state.vscdb"
}

cursor_rsync_or_warn() {
  rsync -a --no-perms --no-owner --no-group "$@" || {
    local code=$?
    if [[ $code -eq 23 ]]; then
      echo "[cursor] WARN: rsync code 23 (SMB metadata); data likely copied" >&2
    else
      return $code
    fi
  }
}

bundle_cursor_secrets_to() {
  local dest="$1"
  local src_global="${CURSOR_GLOBAL_STORAGE}"
  local src_user="${CURSOR_USER_DIR}"
  local src_dot="${CURSOR_DOT_DIR}"

  cursor_must_be_closed
  cursor_checkpoint_vscdb "$src_global"

  mkdir -p "$dest/dot-cursor" "$dest/config-Cursor/globalStorage" "$dest/machine"

  for f in mcp.json cli-config.json argv.json; do
    [[ -f "$src_dot/$f" ]] && cp --no-preserve=mode,ownership "$src_dot/$f" "$dest/dot-cursor/"
  done

  [[ -d "$src_dot/skills-cursor" ]] && cursor_rsync_or_warn "$src_dot/skills-cursor/" "$dest/dot-cursor/skills-cursor/"
  [[ -d "$src_dot/rules" ]] && cursor_rsync_or_warn "$src_dot/rules/" "$dest/dot-cursor/rules/"
  [[ -d "$src_dot/projects" ]] && cursor_rsync_or_warn "$src_dot/projects/" "$dest/dot-cursor/projects/"

  if [[ -d "$src_dot/plugins" ]]; then
    cursor_rsync_or_warn \
      --exclude 'cache/' \
      "$src_dot/plugins/" "$dest/dot-cursor/plugins/"
  fi

  if [[ -d "$src_dot/extensions" ]]; then
    mkdir -p "$dest/dot-cursor/extensions"
    [[ -f "$src_dot/extensions/extensions.json" ]] && \
      cp --no-preserve=mode,ownership "$src_dot/extensions/extensions.json" "$dest/dot-cursor/extensions/"
  fi

  if [[ -d "$HOME/.cursor/plans" ]]; then
    cursor_rsync_or_warn "$HOME/.cursor/plans/" "$dest/dot-cursor/plans/"
  fi

  for f in settings.json keybindings.json; do
    [[ -f "$src_user/$f" ]] && cp --no-preserve=mode,ownership "$src_user/$f" "$dest/config-Cursor/$f"
  done

  cursor_copy_vscdb_safe "$src_global" "$dest/config-Cursor/globalStorage"

  [[ -f "$HOME/.machine_env" ]] && cp --no-preserve=mode,ownership "$HOME/.machine_env" "$dest/machine/.machine_env"
  [[ -f "$HOME/.ssh/id_ed25519_optiplex.pub" ]] && cp --no-preserve=mode,ownership "$HOME/.ssh/id_ed25519_optiplex.pub" "$dest/optiplex_authorized_key.pub"

  cat > "$dest/manifest.txt" <<EOF
created_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
source_host=$(hostname)
source_user=$USER
bundle_version=2
note=state.vscdb checkpointed; no WAL/SHM files
psynova_share=smb://optiplex.local/shared/PsyNova
sugarcubes_share=smb://optiplex.local/shared/SugarCubes
cursor_share=smb://optiplex.local/shared/CursorSecrets
EOF
}
