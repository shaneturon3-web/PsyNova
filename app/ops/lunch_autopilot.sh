#!/usr/bin/env bash
set -u

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${PROJECT_ROOT}/ops/logs"
mkdir -p "${LOG_DIR}"
TS="$(date '+%Y-%m-%d__%H-%M-%S')"
LOG_FILE="${LOG_DIR}/${TS}__AUTOPILOT__BATCH__v01.log"

DOCKER_CMD="docker compose"
if command -v sudo >/dev/null 2>&1 && sudo -n true >/dev/null 2>&1; then
  DOCKER_CMD="sudo docker compose"
fi

# Third arg: plain | node — node always sources ops/load_node_env.sh first.
run_step() {
  local name="$1"
  local cmd="$2"
  local mode="${3:-plain}"

  echo
  echo "===== ${name} ====="
  echo "CMD: ${cmd}"

  if [[ "${mode}" == "node" ]]; then
    bash -c "set -e; source \"${PROJECT_ROOT}/ops/load_node_env.sh\"; cd \"${PROJECT_ROOT}\"; ${cmd}"
  else
    bash -c "set -e; cd \"${PROJECT_ROOT}\"; ${cmd}"
  fi

  local exit_code=$?
  if [[ "${exit_code}" -ne 0 ]]; then
    echo "STEP FAILED: ${name} (exit ${exit_code})"
    exit "${exit_code}"
  fi
  echo "STEP OK: ${name}"
}

{
  echo "AUTOPILOT START: ${TS}"
  echo "PROJECT_ROOT: ${PROJECT_ROOT}"
  echo "LOG_FILE: ${LOG_FILE}"
  echo "DOCKER_CMD: ${DOCKER_CMD}"
  echo

  run_step "System inventory" "bash ops/session_bootstrap.sh" plain || exit 1
  run_step "Backend checks (e2e compact)" "bash ops/run_backend_checks.sh --skip-install" node || exit 1
  run_step "Backend build" "cd backend && npm run build" node || exit 1
  run_step "Backend test (allow empty unit tests)" "cd backend && npm run test -- --passWithNoTests" node || exit 1
  run_step "Backend e2e full" "cd backend && npm run test:e2e" node || exit 1
  run_step "Frontend deps" "cd frontend && npm install" node || exit 1
  run_step "Frontend build" "cd frontend && npm run build" node || exit 1
  run_step "Docker pull (services)" "${DOCKER_CMD} --profile prod pull" plain || exit 1
  run_step "Docker up (full stack + API)" "${DOCKER_CMD} --profile prod up --build -d" plain || exit 1
  run_step "WordPress bootstrap/plugins" "bash ops/wp_bootstrap.sh" plain || exit 1
  run_step "Docker status" "${DOCKER_CMD} ps" plain || exit 1
  run_step "Backend health probe" "curl -fsS http://localhost:3000/api/health" plain || exit 1

  echo
  echo "AUTOPILOT RESULT: OK"
  echo "NEXT: open http://localhost:8080/wp-admin and continue settings"
  printf '\a'
} 2>&1 | tee "${LOG_FILE}"

exit ${PIPESTATUS[0]}
