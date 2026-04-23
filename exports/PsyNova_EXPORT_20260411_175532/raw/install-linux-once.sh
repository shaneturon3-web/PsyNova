#!/usr/bin/env bash
# Instalación “una vez”: icono en escritorio + entrada en menú + intento de fijar en dock/barra (GNOME Shell).
# Uso: ./install-linux-once.sh [RUTA_AL_PAQUETE_benchmark-armyknife]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALL_ROOT="${1:-$SCRIPT_DIR}"
INSTALL_ROOT="$(cd "$INSTALL_ROOT" && pwd)"

DESKTOP_ID="benchmark-armyknife.desktop"
ICON_NAME="benchmark-armyknife.png"
LAUNCHER="$INSTALL_ROOT/desktop-shell/launch-desktop.sh"
ICON_SRC="$INSTALL_ROOT/desktop-shell/assets/icon.png"
DESKTOP_FILE_LOCAL="$HOME/.local/share/applications/$DESKTOP_ID"
ICON_DEST_DIR="$HOME/.local/share/icons/hicolor/512x512/apps"
ICON_DEST="$ICON_DEST_DIR/$ICON_NAME"

if [[ ! -f "$INSTALL_ROOT/package.json" ]] || [[ ! -f "$INSTALL_ROOT/desktop-shell/server.cjs" ]]; then
  echo "Ruta inválida: falta package.json o desktop-shell/server.cjs en $INSTALL_ROOT" >&2
  exit 1
fi

chmod +x "$LAUNCHER" 2>/dev/null || true

echo "==> npm install + build (motor)…"
(cd "$INSTALL_ROOT" && npm install && npm run build)

echo "==> npm install (escritorio)…"
(cd "$INSTALL_ROOT/desktop-shell" && npm install)

mkdir -p "$ICON_DEST_DIR"
cp -f "$ICON_SRC" "$ICON_DEST"
gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true

DESKTOP_DIR="${XDG_DESKTOP_DIR:-$HOME/Desktop}"
mkdir -p "$DESKTOP_DIR"

{
  echo '[Desktop Entry]'
  echo 'Version=1.0'
  echo 'Type=Application'
  echo 'Name=Benchmark Armyknife'
  echo 'Comment=Benchmark web + URLs (arrastre y archivos)'
  printf 'Exec=env ARMYK_OPEN_BROWSER=1 %q\n' "$LAUNCHER"
  echo "Icon=$ICON_DEST"
  echo 'Terminal=false'
  echo 'Categories=Development;Utility;'
  echo 'StartupNotify=true'
} > "$DESKTOP_FILE_LOCAL"

chmod +x "$DESKTOP_FILE_LOCAL"
cp -f "$DESKTOP_FILE_LOCAL" "$DESKTOP_DIR/$DESKTOP_ID"
chmod +x "$DESKTOP_DIR/$DESKTOP_ID"

update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true

echo "==> Entrada de escritorio: $DESKTOP_DIR/$DESKTOP_ID"

if command -v gsettings >/dev/null 2>&1; then
  if gsettings list-schemas 2>/dev/null | grep -q '^org.gnome.shell$'; then
    echo "==> Intentando fijar en favoritos de GNOME Shell (barra)…"
    python3 - <<'PY' || true
import ast
import subprocess
import sys

key = "benchmark-armyknife.desktop"
try:
    raw = subprocess.check_output(
        ["gsettings", "get", "org.gnome.shell", "favorite-apps"], text=True
    )
except (subprocess.CalledProcessError, FileNotFoundError):
    sys.exit(0)
try:
    apps = ast.literal_eval(raw.strip())
except Exception:
    sys.exit(0)
if not isinstance(apps, list):
    sys.exit(0)
if key in apps:
    print("Ya estaba en favoritos.")
    sys.exit(0)
apps = apps + [key]
subprocess.check_call(
    ["gsettings", "set", "org.gnome.shell", "favorite-apps", str(apps)]
)
print("Añadido a favoritos de GNOME Shell.")
PY
  else
    echo "No es GNOME Shell o no hay esquema org.gnome.shell; fija el icono manualmente en la barra."
  fi
else
  echo "Sin gsettings: fija el lanzador manualmente en el panel si tu entorno lo permite."
fi

echo "Listo. Abre «Benchmark Armyknife» desde el escritorio o el menú de aplicaciones."
