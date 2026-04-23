#!/usr/bin/env bash
# Lanza el servidor local de la UI (abre el navegador por defecto salvo ARMYK_OPEN_BROWSER=0).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/desktop-shell"
export ARMYK_OPEN_BROWSER="${ARMYK_OPEN_BROWSER:-1}"
exec node server.cjs
