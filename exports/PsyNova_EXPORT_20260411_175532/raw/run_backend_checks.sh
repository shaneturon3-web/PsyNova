#!/usr/bin/env bash
set -eo pipefail

# One-command backend validation runner.
# Usage:
#   bash ops/run_backend_checks.sh
#   bash ops/run_backend_checks.sh --skip-install

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/load_node_env.sh"

PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
LOG_DIR="${PROJECT_ROOT}/ops/logs"
SKIP_INSTALL=false

if [[ "${1:-}" == "--skip-install" ]]; then
  SKIP_INSTALL=true
fi

mkdir -p "${LOG_DIR}"
TS="$(date '+%Y-%m-%d__%H-%M-%S')"
E2E_LOG="${LOG_DIR}/${TS}__BACKEND__TEST_E2E__RUN__v01.log"

if [[ ! -d "${BACKEND_DIR}" ]]; then
  echo "ERROR: backend directory not found at ${BACKEND_DIR}"
  echo "Proxima accion para Shane: copia este error back to Cursor's chat."
  exit 1
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: Node.js/npm not detected."
  echo "Proxima accion para Shane: instala Node LTS y pega aqui el resultado de 'node -v && npm -v'."
  exit 1
fi

echo "Project root: ${PROJECT_ROOT}"
echo "Backend dir: ${BACKEND_DIR}"
echo "Node: $(node -v)"
echo "npm: $(npm -v)"

cd "${BACKEND_DIR}"

if [[ "${SKIP_INSTALL}" == "false" ]]; then
  echo
  echo "==> Running npm install"
  npm install
fi

echo
echo "==> Running e2e tests"
if npm run test:e2e >"${E2E_LOG}" 2>&1; then
  TEST_SUITES_LINE="$(sed -n '/Test Suites:/p' "${E2E_LOG}" | head -n 1)"
  TESTS_LINE="$(sed -n '/Tests:/p' "${E2E_LOG}" | head -n 1)"
  [[ -n "${TEST_SUITES_LINE}" ]] && echo "${TEST_SUITES_LINE}"
  [[ -n "${TESTS_LINE}" ]] && echo "${TESTS_LINE}"
  echo "Detail log: ${E2E_LOG}"
  echo
  printf '\a'
  echo "OK for Next Step o pega la FALLA"
else
  TEST_SUITES_LINE="$(sed -n '/Test Suites:/p' "${E2E_LOG}" | head -n 1)"
  TESTS_LINE="$(sed -n '/Tests:/p' "${E2E_LOG}" | head -n 1)"
  [[ -n "${TEST_SUITES_LINE}" ]] && echo "${TEST_SUITES_LINE}"
  [[ -n "${TESTS_LINE}" ]] && echo "${TESTS_LINE}"
  echo "Detail log: ${E2E_LOG}"
  echo "Error snippet:"
  awk '/FAIL|Error|TypeError|Unauthorized|SyntaxError/ { print; c++; if (c >= 8) exit }' "${E2E_LOG}" || true
  echo
  printf '\a'
  echo "OK for Next Step o pega la FALLA"
  exit 1
fi
