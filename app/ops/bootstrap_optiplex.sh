#!/usr/bin/env bash
# bootstrap_optiplex.sh — install deps and start PsyNova + SugarCubes after migration apply.
set -euo pipefail

PSYNOVA="${PSYNOVA_REPO_ROOT:-$HOME/PsyNova}"
SUGAR="${SUGARCUBES_ROOT:-$HOME/SugarCubes}"

echo "[bootstrap] PsyNova at $PSYNOVA"

# nvm
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
  nvm use --silent default 2>/dev/null || nvm use --silent node 2>/dev/null || nvm use --lts 2>/dev/null || true
else
  echo "WARN: nvm not found at $NVM_DIR — install Node before continuing." >&2
fi

if command -v node >/dev/null 2>&1; then
  echo "[bootstrap] npm ci (backend + frontend)"
  (cd "$PSYNOVA/app/backend" && npm ci)
  (cd "$PSYNOVA/app/frontend" && npm ci)
else
  echo "WARN: node not available; skipping npm ci" >&2
fi

if command -v docker >/dev/null 2>&1; then
  echo "[bootstrap] docker compose db"
  (cd "$PSYNOVA/app" && docker compose up -d db)
  if [[ -x "$PSYNOVA/app/backend/scripts/seed_test.sh" ]]; then
    bash "$PSYNOVA/app/backend/scripts/seed_test.sh"
  fi
else
  echo "WARN: docker not available; skipping DB seed" >&2
fi

if [[ -x "$PSYNOVA/app/ops/install_psynova_launcher.sh" ]]; then
  bash "$PSYNOVA/app/ops/install_psynova_launcher.sh"
fi

# SugarCubes venv
if [[ -d "$SUGAR/Library/SugarMail_Cube" ]]; then
  echo "[bootstrap] SugarMail_Cube venv"
  (cd "$SUGAR/Library/SugarMail_Cube" && python3 -m venv .venv && .venv/bin/pip install -r requirements-ui.txt)
fi

if [[ -f "$SUGAR/sugar_cubes.db" ]]; then
  echo "[bootstrap] sugar_cubes.db present ($(stat -c%s "$SUGAR/sugar_cubes.db") bytes)"
else
  echo "WARN: sugar_cubes.db missing" >&2
fi

echo "[bootstrap] Verification hints:"
echo "  curl -sf http://localhost:3000/health || curl -sf http://localhost:3000/"
echo "  open http://localhost:5173"
echo "  Cursor -> Settings -> MCP (re-auth disconnected servers)"
echo "  source ~/.machine_env && echo \$MACHINE_NAME"
