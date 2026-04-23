#!/usr/bin/env bash
# Apply password_hash column to existing Postgres (init scripts only run on first volume create).
set -euo pipefail
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}"

# Read KEY=value from .env without sourcing (avoids "command not found" on unquoted spaces).
read_env_val() {
  local key="$1" file="$2" line val
  [[ -f "$file" ]] || return 1
  line=$(grep -E "^${key}=" "$file" 2>/dev/null | head -1) || return 1
  val="${line#*=}"
  val="${val%$'\r'}"
  val="${val#\"}"
  val="${val%\"}"
  val="${val#\'}"
  val="${val%\'}"
  printf '%s' "$val"
}

ENV_FILE="${PROJECT_ROOT}/.env"
DB_USER="${DB_USER:-$(read_env_val DB_USER "${ENV_FILE}" 2>/dev/null || true)}"
DB_NAME="${DB_NAME:-$(read_env_val DB_NAME "${ENV_FILE}" 2>/dev/null || true)}"
DB_USER="${DB_USER:-psynova}"
DB_NAME="${DB_NAME:-psynova}"

SQL_FILE="${PROJECT_ROOT}/database/03-alter-users-password-hash.sql"

# Prefer plain docker; if socket permission denied, use sudo (NOPASSWD not required).
DOCKER_CMD="docker compose"
if ! docker info >/dev/null 2>&1; then
  if command -v sudo >/dev/null 2>&1 && sudo docker info >/dev/null 2>&1; then
    DOCKER_CMD="sudo docker compose"
  else
    echo "Cannot talk to Docker (permission denied or daemon down)."
    echo "Fix one of:"
    echo "  sudo usermod -aG docker \"\${USER}\"   # then log out and back in"
    echo "  sudo docker compose up -d db           # then: bash $0"
    exit 1
  fi
fi

if ! ${DOCKER_CMD} ps --format '{{.Names}}' 2>/dev/null | grep -q '^psynova-db$'; then
  echo "psynova-db is not running. Start it with:"
  echo "  ${DOCKER_CMD} up -d db"
  exit 1
fi

echo "Applying migration to psynova-db..."
cat "${SQL_FILE}" | ${DOCKER_CMD} exec -T db psql -U "${DB_USER:-psynova}" -d "${DB_NAME:-psynova}"
echo "Done. Retry register/login."
