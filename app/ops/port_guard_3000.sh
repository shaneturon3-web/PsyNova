#!/usr/bin/env bash
# Exit 0 if nothing listens on TCP 3000; exit 1 with diagnostics if busy.
# Use before local `npm run start:dev` (see backend/package.json).
set -euo pipefail
PORT="${1:-3000}"

if command -v ss >/dev/null 2>&1; then
  if ss -tln | grep -qE ":${PORT}\\s"; then
    echo "[port_guard] Port ${PORT} is already in use. One owner only (Docker API or local Nest)."
    ss -tlnp 2>/dev/null | grep ":${PORT}" || ss -tln | grep ":${PORT}"
    echo "[port_guard] If psynova-backend is running: docker compose stop backend"
    echo "[port_guard] Or: docker compose --profile prod down"
    exit 1
  fi
elif command -v lsof >/dev/null 2>&1; then
  if lsof -iTCP:"${PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "[port_guard] Port ${PORT} busy:"
    lsof -iTCP:"${PORT}" -sTCP:LISTEN
    exit 1
  fi
else
  echo "[port_guard] Install ss (iproute2) or lsof for port checks."
  exit 0
fi

echo "[port_guard] Port ${PORT} is free."
exit 0
