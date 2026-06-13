#!/usr/bin/env bash
# Genera un ZIP junto a benchmark-armyknife con el par motor + escritorio + scripts.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
cd "$ROOT"

python3 "$ROOT/desktop-shell/scripts/write_icon_png.py"
cp -f "$ROOT/desktop-shell/assets/icon.png" "$ROOT/desktop-shell/public/assets/icon.png"

echo "==> npm install + build (motor)…"
npm install
npm run build

echo "==> npm install (escritorio)…"
(cd "$ROOT/desktop-shell" && npm install)

STAMP="$(date +%Y%m%d)"
OUT_ZIP="$(cd "$ROOT/.." && pwd)/benchmark-armyknife-bundle-${STAMP}.zip"

echo "==> empaquetando → $OUT_ZIP"

(
  cd "$(cd "$ROOT/.." && pwd)"
  zip -r "$OUT_ZIP" "$(basename "$ROOT")" \
    -x "$(basename "$ROOT")/node_modules/*" \
    -x "$(basename "$ROOT")/desktop-shell/node_modules/*" \
    -x "*.git*"
)

echo "Creado: $OUT_ZIP"
echo "Incluye: código fuente, dist/, package-lock(s) si existen; excluye node_modules (ejecutar npm install tras descomprimir)."
