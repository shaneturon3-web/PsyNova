#!/bin/bash
set -euo pipefail

echo "Applying schema patches to psynova-db..."

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

for f in \
  "$ROOT_DIR/database/schema.sql" \
  "$ROOT_DIR/database/03-alter-users-password-hash.sql" \
  "$ROOT_DIR/database/04-alter-appointments-service-category.sql" \
  "$ROOT_DIR/database/05-cms-schema.sql" \
  "$ROOT_DIR/database/06-cms-seed.sql" \
  "$ROOT_DIR/database/07-notes-and-contact.sql"
do
  [ -f "$f" ] || continue
  echo "-> $f"
  docker compose exec -T db psql -U psynova -d psynova -f - < "$f"
done

echo "Migration complete."
