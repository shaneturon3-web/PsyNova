#!/usr/bin/env bash
# Purpose: Ensure Node.js + npm are available in ALL contexts:
# - normal user shell
# - sudo/root shell
# - non-interactive bash (CI/autopilot)

set -e

# Prefer Shane's NVM installation if it exists (root has HOME=/root otherwise)
export NVM_DIR="/home/shane/.nvm"

if [[ -s "${NVM_DIR}/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  . "${NVM_DIR}/nvm.sh"
elif [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
  export NVM_DIR="${HOME}/.nvm"
  # shellcheck source=/dev/null
  . "${NVM_DIR}/nvm.sh"
else
  echo "ERROR: nvm not found. Node.js environment cannot be loaded." >&2
  exit 1
fi

# Default alias, else latest node
nvm use --silent default >/dev/null 2>&1 || nvm use --silent node >/dev/null 2>&1 || nvm use --lts >/dev/null 2>&1 || true

if [[ -d "${NVM_DIR}/versions/node" ]]; then
  LATEST_NODE_BIN="$(ls -1d "${NVM_DIR}"/versions/node/*/bin 2>/dev/null | tail -n 1 || true)"
  if [[ -n "${LATEST_NODE_BIN}" ]]; then
    export PATH="${LATEST_NODE_BIN}:${PATH}"
  fi
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: Node.js/npm not detected after loading nvm." >&2
  exit 1
fi
