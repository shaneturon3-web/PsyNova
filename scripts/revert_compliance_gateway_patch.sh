#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(pwd)}"
LATEST="$ROOT/.pre-compliance-gateway/LATEST_BACKUP"

if [ ! -f "$LATEST" ]; then echo "No compliance-gateway backup marker found: $LATEST" >&2; exit 1; fi
BACKUP_DIR="$(cat "$LATEST")"
if [ ! -d "$BACKUP_DIR" ]; then echo "Backup directory missing: $BACKUP_DIR" >&2; exit 1; fi

restore_file(){ local rel="$1"; if [ -f "$BACKUP_DIR/$rel" ]; then mkdir -p "$ROOT/$(dirname "$rel")"; cp "$BACKUP_DIR/$rel" "$ROOT/$rel"; fi; }

restore_file "app/frontend/src/app.js"
restore_file "app/frontend/src/app-legacy.js"
restore_file "app/frontend/src/styles.css"
restore_file "app/frontend/src/main.js"
restore_file "app/backend/src/app.module.ts"
restore_file "app/backend/src/main.ts"
restore_file "app/frontend/.env.example"
restore_file "app/backend/.env.example"

rm -rf "$ROOT/app/backend/src/vendor-links"
rm -f "$ROOT/app/frontend/src/compliance-gateway.js"
rm -f "$ROOT/app/frontend/src/compliance-gateway.css"
rm -f "$ROOT/docs/GITHUB_NOTE_COMPLIANCE_GATEWAY.md"

echo "Compliance gateway patch reverted from: $BACKUP_DIR"
