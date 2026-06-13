#!/usr/bin/env bash
# install_fix_cursor_secrets.sh — symlink fix-cursor-secrets into ~/.local/bin
set -euo pipefail

OPS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN="${HOME}/.local/bin"
mkdir -p "$BIN"
ln -sf "$OPS/fix-cursor-secrets" "$BIN/fix-cursor-secrets"
ln -sf "$OPS/restore_cursor_secrets_local.sh" "$BIN/restore_cursor_secrets_local.sh"
echo "Installed:"
echo "  $BIN/fix-cursor-secrets"
echo "  $BIN/restore_cursor_secrets_local.sh"
