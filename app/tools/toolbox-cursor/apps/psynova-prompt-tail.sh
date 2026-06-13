#!/usr/bin/env bash
# Cierre operativo estandar (handshake + recordatorios PsyNova). Sin efectos secundarios.
set -euo pipefail
cat <<'EOF'
- Migracion: database/03-alter-users-password-hash.sql aplicada via ops/migrate_db_password_hash.sh
- API local (sin contenedor): cd backend && npm run start:dev  (puerto 3000; no levantes con Docker API a la vez)

Si acabas de: sudo usermod -aG docker "$USER" — ejecuta: newgrp docker  o cierra sesion.
OK for Next Step o pega la FALLA
EOF
