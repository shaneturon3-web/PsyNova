#!/usr/bin/env bash
# Hot-patch compiled API inside the running container (all dist/*.js + maquette line in main.js).
# Usage (from repo root): bash psynova/ops/patch_backend_dist_header.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/psynova/platform"

echo "=== docker compose ps --services ==="
docker compose ps --services

API_SERVICE="$(docker compose ps --services --status running 2>/dev/null | grep -E 'api|backend' | head -n 1 || true)"
if [[ -z "${API_SERVICE}" ]]; then
  API_SERVICE="backend"
fi
echo "=== Using service: ${API_SERVICE} ==="

docker compose exec -T "${API_SERVICE}" find /app/dist -name "*.js" -exec sed -i 's/\[MOCKUP PURPOSE ONLY - NOT REAL DATA\]/MOCKUP-PURPOSE-ONLY/g' {} +
docker compose exec -T "${API_SERVICE}" sh -c 'test -f /app/dist/forms/forms.service.js && sed -i "s/\[MOCKUP PURPOSE ONLY - NOT REAL DATA — no email sent\]/MOCKUP-PURPOSE-ONLY-NO-EMAIL/g" /app/dist/forms/forms.service.js' || true
docker compose exec -T "${API_SERVICE}" sh -c "sed -i \"s/const maquetteHeader = '[^']*'/const maquetteHeader = 'MOCKUP-PURPOSE-ONLY'/\" /app/dist/main.js"

docker compose restart "${API_SERVICE}"
sleep 3
echo "=== curl -I http://localhost:3000/api/health ==="
curl -sS -I "http://localhost:3000/api/health" || true
