#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(pwd)}"
LATEST="$(ls -dt "$ROOT"/recovery/booking-flow-restore-v2-* 2>/dev/null | head -n 1 || true)"

if [ -z "$LATEST" ]; then
  echo "No booking-flow-restore-v2 backup found in $ROOT/recovery"
  exit 1
fi

cp "$LATEST/app.js" "$ROOT/app/frontend/src/app.js"
if [ -f "$LATEST/styles.css" ]; then
  cp "$LATEST/styles.css" "$ROOT/app/frontend/src/styles.css"
fi

echo "Reverted booking flow restore v2 from $LATEST"
