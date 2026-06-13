#!/usr/bin/env bash
# Wrapper -> ops/migrate_db_password_hash.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
exec bash "${ROOT}/ops/migrate_db_password_hash.sh"
