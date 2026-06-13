#!/usr/bin/env bash
# install_psynova_launcher.sh — install (or uninstall) the PsyNova Server menu launcher.
#
# Install:
#   - copies app/ops/systemd/*.service to $XDG_CONFIG_HOME/systemd/user/
#   - copies app/ops/desktop/*.desktop to $XDG_DATA_HOME/applications/
#   - copies app/ops/desktop/psynova-icon.svg to $XDG_DATA_HOME/icons/hicolor/scalable/apps/
#     under the name `psynova-server.svg` (matches Icon= in the .desktop files)
#   - reloads systemd user units + the desktop database + the icon cache
#
# Uninstall (--uninstall):
#   - stops + disables both services, removes the unit files, .desktop entries, and icon
#
# This script is idempotent. Re-running install just overwrites the destination files.
set -euo pipefail

REPO_ROOT="${PSYNOVA_REPO_ROOT:-/home/shane/PsyNova}"
SRC_OPS="$REPO_ROOT/app/ops"
SD_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
DT_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICON_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/scalable/apps"

UNIT_FILES=(psynova-stack.service psynova-tunnel.service)
DESKTOP_FILES=(psynova-server-local.desktop psynova-server-cloudflare.desktop psynova-server-stop.desktop)

mode="install"
[[ "${1:-}" == "--uninstall" ]] && mode="uninstall"

cmd_install() {
  echo "[install] PsyNova Server launcher — install mode"
  mkdir -p "$SD_DIR" "$DT_DIR" "$ICON_DIR"

  for f in "${UNIT_FILES[@]}"; do
    install -m 0644 "$SRC_OPS/systemd/$f" "$SD_DIR/$f"
    echo "[install]  systemd unit: $SD_DIR/$f"
  done
  for f in "${DESKTOP_FILES[@]}"; do
    sed "s|__REPO_ROOT__|$REPO_ROOT|g" "$SRC_OPS/desktop/$f" > "$DT_DIR/$f"
    chmod 0644 "$DT_DIR/$f"
    echo "[install]  desktop: $DT_DIR/$f (REPO_ROOT=$REPO_ROOT)"
  done
  install -m 0644 "$SRC_OPS/desktop/psynova-icon.svg" "$ICON_DIR/psynova-server.svg"
  echo "[install]  icon: $ICON_DIR/psynova-server.svg"

  systemctl --user daemon-reload
  command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$DT_DIR" >/dev/null 2>&1 || true
  command -v gtk-update-icon-cache    >/dev/null 2>&1 && gtk-update-icon-cache -t "${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor" >/dev/null 2>&1 || true

  cat <<NOTE
[install] Done. You can now:
  1. Open your apps menu and search "PsyNova Server" — three entries will appear.
  2. Or run from the terminal:
       systemctl --user start psynova-stack.service
       systemctl --user start psynova-tunnel.service   # public URL
       systemctl --user stop  psynova-tunnel.service psynova-stack.service
  3. To auto-start at boot (optional):
       loginctl enable-linger \$USER
       systemctl --user enable psynova-stack.service
       # tunnel auto-starts when stack starts (Requires=)
  4. Logs:
       journalctl --user -u psynova-stack -f
       journalctl --user -u psynova-tunnel -f
       tail -f \$HOME/.local/state/psynova/{stack,backend,frontend,tunnel,launcher}.log
NOTE
}

cmd_uninstall() {
  echo "[uninstall] PsyNova Server launcher — removing everything"
  systemctl --user stop    psynova-tunnel.service 2>/dev/null || true
  systemctl --user stop    psynova-stack.service  2>/dev/null || true
  systemctl --user disable psynova-tunnel.service 2>/dev/null || true
  systemctl --user disable psynova-stack.service  2>/dev/null || true
  for f in "${UNIT_FILES[@]}"; do rm -f "$SD_DIR/$f"; done
  for f in "${DESKTOP_FILES[@]}"; do rm -f "$DT_DIR/$f"; done
  rm -f "$ICON_DIR/psynova-server.svg"
  systemctl --user daemon-reload
  command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$DT_DIR" >/dev/null 2>&1 || true
  command -v gtk-update-icon-cache    >/dev/null 2>&1 && gtk-update-icon-cache -t "${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor" >/dev/null 2>&1 || true
  echo "[uninstall] Done. State files in \$HOME/.local/state/psynova/ are kept (rm -rf manually to wipe)."
}

case "$mode" in
  install) cmd_install ;;
  uninstall) cmd_uninstall ;;
esac
