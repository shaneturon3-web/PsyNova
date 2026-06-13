#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Running pre-push secret scan..."

PATTERN='BEGIN (RSA |EC |OPENSSH |)?PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z\-_]{35}|Authorization:\s*Bearer\s+\S+|(?i)\b(api[_-]?key|client[_-]?secret|jwt[_-]?secret|db[_-]?password|private[_-]?key|access[_-]token|refresh[_-]token)\b\s*[:=]\s*["'"'"']?[A-Za-z0-9_\-\.\/]{8,}'

MATCHES="$(rg -n --hidden \
  -g '!.git' \
  -g '!app/.env' \
  -g '!app/backend/.env' \
  -g '!app/.env.example' \
  -g '!app/backend/.env.example' \
  -g '!app/docker-compose.yml' \
  -g '!recovery/**/docker-compose.yml' \
  -e "$PATTERN" . || true)"

FILTERED="$(printf "%s\n" "$MATCHES" | rg -v 'REDACTED_FOR_PUBLIC_REPO' || true)"

if [ -n "$FILTERED" ]; then
  printf "%s\n" "$FILTERED"
  echo "Potential secrets detected. Review matches before push."
  exit 1
fi

echo "No high-confidence secret patterns found."
