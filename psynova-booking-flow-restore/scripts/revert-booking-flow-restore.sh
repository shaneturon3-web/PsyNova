#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(pwd)}"
LATEST="$(find "$ROOT/recovery" -maxdepth 1 -type d -name 'booking-flow-restore-*' 2>/dev/null | sort | tail -n 1 || true)"

if [ -z "$LATEST" ]; then
  echo "No booking-flow-restore backup found under $ROOT/recovery"
  exit 1
fi

cp "$LATEST/app.js" "$ROOT/app/frontend/src/app.js"
cp "$LATEST/booking-wizard.js" "$ROOT/app/frontend/src/booking-wizard.js"
if [ -f "$LATEST/styles.css" ]; then
  cp "$LATEST/styles.css" "$ROOT/app/frontend/src/styles.css"
fi

echo "Reverted booking flow restore from $LATEST"
