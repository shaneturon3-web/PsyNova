#!/usr/bin/env bash
# Free host port 3000 for local NestJS. Docker backend uses the same port — stop it first.
set -euo pipefail
PORT="${1:-3000}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[free_port] Target: TCP ${PORT}"

if command -v docker >/dev/null 2>&1; then
  mapfile -t DOCKER_ROWS < <(docker ps --filter "publish=${PORT}" --format '{{.Names}}\t{{.Image}}' 2>/dev/null || true)
  if [[ ${#DOCKER_ROWS[@]} -gt 0 ]]; then
    echo "[free_port] Something is published on :${PORT} via Docker:"
    printf '%s\n' "${DOCKER_ROWS[@]}"
    echo ""
    echo "Stop the backend container (started with profile with-api):"
    echo "  cd \"${PROJECT_ROOT}\" && docker compose stop backend"
    echo "  (Plain \`docker compose up\` no longer starts backend; use \`--profile prod\` or \`--profile with-api\`.)"
    echo "Or: docker stop psynova-backend"
    echo ""
    echo "Then re-run: npm run start:dev (backend)"
    exit 2
  fi
fi

if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}/tcp" 2>/dev/null || true
fi

if command -v lsof >/dev/null 2>&1; then
  pids="$(lsof -t -iTCP:"${PORT}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    kill -9 ${pids} 2>/dev/null || true
  fi
fi

sleep 0.3
if ss -tln 2>/dev/null | grep -qE ":${PORT}\\s"; then
  echo "[free_port] Port ${PORT} still busy. Try:"
  echo "  sudo fuser -k ${PORT}/tcp"
  echo "  sudo lsof -i :${PORT}"
  exit 1
fi

echo "[free_port] Port ${PORT} is free."
exit 0
