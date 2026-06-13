#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${PROJECT_ROOT}/ops/logs"
mkdir -p "${LOG_DIR}"
TS="$(date '+%Y-%m-%d__%H-%M-%S')"
RUN_LOG="${LOG_DIR}/${TS}__AUTOPILOT__LAUNCH__v01.log"

nohup bash "${PROJECT_ROOT}/ops/lunch_autopilot.sh" > "${RUN_LOG}" 2>&1 &
PID=$!

echo "AUTOPILOT_PID=${PID}"
echo "AUTOPILOT_LAUNCH_LOG=${RUN_LOG}"
echo "OK for Next Step o pega la FALLA"
