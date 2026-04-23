#!/usr/bin/env bash
set -euo pipefail

# Session bootstrap for environment inventory and dependency checks.
# Usage:
#   bash ops/session_bootstrap.sh
#   bash ops/session_bootstrap.sh --project-root "/path/to/project"

PROJECT_ROOT="$(pwd)"
if [[ "${1:-}" == "--project-root" && -n "${2:-}" ]]; then
  PROJECT_ROOT="${2}"
fi

LOG_DIR="${PROJECT_ROOT}/ops/logs"
mkdir -p "${LOG_DIR}"

TS="$(date '+%Y-%m-%d__%H-%M-%S')"
INVENTORY_FILE="${LOG_DIR}/${TS}__SYSTEM__INVENTORY__SESSION__v01.md"
CHECK_FILE="${LOG_DIR}/${TS}__SYSTEM__CHECKS__DEPENDENCIES__v01.md"

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

version_or_missing() {
  local cmd="$1"
  local ver_cmd="$2"
  if command_exists "${cmd}"; then
    eval "${ver_cmd}" 2>/dev/null | head -n 1
  else
    echo "MISSING"
  fi
}

HAS_NODE=false
HAS_NPM=false
HAS_DOCKER=false
HAS_GIT=false
if command_exists node; then HAS_NODE=true; fi
if command_exists npm; then HAS_NPM=true; fi
if command_exists docker; then HAS_DOCKER=true; fi
if command_exists git; then HAS_GIT=true; fi

{
  echo "# Session System Inventory"
  echo
  echo "- Timestamp: ${TS}"
  echo "- Host: $(hostname)"
  echo "- User: ${USER:-unknown}"
  echo "- OS: $(uname -a)"
  echo "- Project root: ${PROJECT_ROOT}"
  echo
  echo "## Runtime Tools"
  echo
  echo "- bash: $(version_or_missing bash 'bash --version')"
  echo "- git: $(version_or_missing git 'git --version')"
  echo "- node: $(version_or_missing node 'node --version')"
  echo "- npm: $(version_or_missing npm 'npm --version')"
  echo "- python3: $(version_or_missing python3 'python3 --version')"
  echo "- pip3: $(version_or_missing pip3 'pip3 --version')"
  echo "- docker: $(version_or_missing docker 'docker --version')"
  echo "- docker compose: $(version_or_missing docker 'docker compose version')"
  echo "- psql: $(version_or_missing psql 'psql --version')"
  echo
  echo "## Project Files"
  echo
  [[ -f "${PROJECT_ROOT}/backend/package.json" ]] && echo "- backend/package.json: FOUND" || echo "- backend/package.json: MISSING"
  [[ -f "${PROJECT_ROOT}/frontend/package.json" ]] && echo "- frontend/package.json: FOUND" || echo "- frontend/package.json: MISSING"
  [[ -f "${PROJECT_ROOT}/docker-compose.yml" ]] && echo "- docker-compose.yml: FOUND" || echo "- docker-compose.yml: MISSING"
  [[ -f "${PROJECT_ROOT}/database/schema.sql" ]] && echo "- database/schema.sql: FOUND" || echo "- database/schema.sql: MISSING"
} > "${INVENTORY_FILE}"

{
  echo "# Dependency Checks"
  echo
  echo "- Timestamp: ${TS}"
  echo
  echo "## What Works"
  echo
  if ${HAS_NODE} && ${HAS_NPM}; then
    echo "- Node.js + npm available: PASS"
  else
    echo "- Node.js + npm available: FAIL"
  fi
  if ${HAS_DOCKER}; then
    echo "- Docker available: PASS"
  else
    echo "- Docker available: FAIL"
  fi
  if ${HAS_GIT}; then
    echo "- Git available: PASS"
  else
    echo "- Git available: FAIL"
  fi
  echo
  echo "## What Does Not Work Yet"
  echo
  if ! ${HAS_NPM}; then
    echo "- npm commands fail. Recommended action: install Node LTS with nvm."
  fi
  if ${HAS_DOCKER} && ! docker compose version >/dev/null 2>&1; then
    echo "- docker compose plugin unavailable. Recommended action: install docker-compose-plugin."
  fi
  if ! ${HAS_DOCKER}; then
    echo "- Docker unavailable. Compose workflows blocked."
  fi
  echo
  echo "## Recommended Next Commands"
  echo
  if ! ${HAS_NPM}; then
    echo "1) Install nvm and Node LTS."
    echo "2) Verify with: node -v && npm -v"
  fi
  echo "3) Run project checks: npm install && npm run test:e2e (inside backend)."
  echo
  echo "## Proxima accion para Shane"
  echo
  if ${HAS_NODE} && ${HAS_NPM}; then
    echo "Entorno Node/npm detectado. Ejecuta ahora:"
    echo "\`cd \"${PROJECT_ROOT}/backend\" && npm install && npm run test:e2e\`"
    echo "Si en la salida aparece \`FAIL\` o \`TypeError\`, copia ese error exacto back to Cursor's chat."
  else
    echo "Falta Node/npm. Ejecuta instalacion de Node LTS con nvm y luego repite bootstrap."
    echo "Comandos base: \`node -v && npm -v\` para validar."
  fi
} > "${CHECK_FILE}"

echo "Inventory created:"
echo " - ${INVENTORY_FILE}"
echo " - ${CHECK_FILE}"
