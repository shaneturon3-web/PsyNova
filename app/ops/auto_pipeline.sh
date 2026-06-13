#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TASK_FILE="${PROJECT_ROOT}/ops/task_queue.txt"

if [[ ! -f "${TASK_FILE}" ]]; then
  echo "FALLA: task_queue.txt no existe"
  printf '\a'
  exit 1
fi

TASK_COUNT="$(awk 'NF && $0 !~ /^#/' "${TASK_FILE}" | wc -l | tr -d ' ')"
echo "Batch tasks: ${TASK_COUNT}"

while IFS= read -r task || [[ -n "${task}" ]]; do
  [[ -z "${task}" ]] && continue
  [[ "${task}" =~ ^# ]] && continue
  echo "Run: ${task}"
  if ! bash -lc "cd \"${PROJECT_ROOT}\" && ${task}"; then
    echo "FALLA"
    printf '\a'
    exit 1
  fi
done < "${TASK_FILE}"
