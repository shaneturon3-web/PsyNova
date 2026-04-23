#!/usr/bin/env bash
# Wrapper -> ops/stack_batch_db_migrate_v01.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
exec bash "${ROOT}/ops/stack_batch_db_migrate_v01.sh" "$@"
