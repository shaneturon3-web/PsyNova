#!/usr/bin/env bash
# Wrapper -> ops/free_port_3000.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
exec bash "${ROOT}/ops/free_port_3000.sh"
