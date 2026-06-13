#!/usr/bin/env bash
# Define el comando BENCHY (función shell: mismo uso que un alias, compatible con scripts).
# En ~/.bashrc (ajusta la ruta):
#   source "/ruta/a/tools/benchmark-armyknife/BENCHY.snippet.sh"
#
# Uso: BENCHY https://example.com
#      BENCHY "https://a.com" "https://b.com"

_BENCHY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"

BENCHY() {
  node "${_BENCHY_ROOT}/dist/index.js" "$@"
}
