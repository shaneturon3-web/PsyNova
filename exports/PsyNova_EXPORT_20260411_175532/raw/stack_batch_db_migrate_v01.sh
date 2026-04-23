#!/usr/bin/env bash
#
# PsyNova — Lote operativo: Postgres + migracion password_hash + (opcional) API Docker.
# Salvaguardas: reintentos, comprobacion pg_isready, docker con/sin sudo, salida controlada.
# Uso:
#   bash ops/stack_batch_db_migrate_v01.sh
#   bash ops/stack_batch_db_migrate_v01.sh --with-api    # levanta backend en Docker y prueba /api/health
#
set -u

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}" || exit 1

WITH_API=0
for arg in "$@"; do
  case "$arg" in
    --with-api) WITH_API=1 ;;
    -h | --help)
      echo "Usage: $0 [--with-api]"
      exit 0
      ;;
  esac
done

read_env_val() {
  local key="$1" file="$2" line val
  [[ -f "$file" ]] || return 1
  line=$(grep -E "^${key}=" "$file" 2>/dev/null | head -1) || return 1
  val="${line#*=}"
  val="${val%$'\r'}"
  val="${val#\"}"
  val="${val%\"}"
  val="${val#\'}"
  val="${val%\'}"
  printf '%s' "$val"
}

ENV_FILE="${PROJECT_ROOT}/.env"
DB_USER="${DB_USER:-$(read_env_val DB_USER "${ENV_FILE}" 2>/dev/null || true)}"
DB_NAME="${DB_NAME:-$(read_env_val DB_NAME "${ENV_FILE}" 2>/dev/null || true)}"
DB_USER="${DB_USER:-psynova}"
DB_NAME="${DB_NAME:-psynova}"

log() { printf '%s\n' "$*"; }
fail() {
  log "[FAIL] $*"
  log "Copia el bloque anterior completo back to Cursor's chat (OK for Next Step o pega la FALLA)."
  exit 1
}
ok() { log "[OK] $*"; }

pick_docker_compose() {
  DOCKER_CMD="docker compose"
  if docker info >/dev/null 2>&1; then
    return 0
  fi
  if command -v sudo >/dev/null 2>&1 && sudo docker info >/dev/null 2>&1; then
    DOCKER_CMD="sudo docker compose"
    log "[INFO] Usando: sudo docker compose (socket sin permiso para usuario actual)."
    return 0
  fi
  fail "Docker no accesible. Prueba: sudo usermod -aG docker \"\$USER\" (luego cerrar sesion) o: sudo systemctl start docker"
}

retry_loop() {
  local name="$1" max="${2:-30}" delay="${3:-2}"
  shift 3
  local i=1
  while (( i <= max )); do
    if "$@"; then
      ok "${name} (intento ${i})"
      return 0
    fi
    log "[WAIT] ${name} — reintento ${i}/${max} (espera ${delay}s)..."
    sleep "${delay}"
    ((i++)) || true
  done
  fail "${name} — agotados reintentos (${max})."
}

pg_ready() {
  ${DOCKER_CMD} exec -T db pg_isready -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1
}

api_health_ok() {
  curl -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1
}

step_start_db() {
  log "===== PASO 1: Levantar psynova-db ====="
  ${DOCKER_CMD} up -d db || fail "docker compose up -d db"
  retry_loop "pg_isready" 40 2 pg_ready
}

step_migrate() {
  log "===== PASO 2: Migracion password_hash ====="
  bash "${PROJECT_ROOT}/ops/migrate_db_password_hash.sh" || fail "migrate_db_password_hash.sh"
}

step_optional_api() {
  if [[ "${WITH_API}" -ne 1 ]]; then
    log "===== PASO 3 (omitido): API Docker — ejecuta con --with-api para incluirlo ====="
    return 0
  fi
  log "===== PASO 3: Backend Docker (perfil prod) ====="
  ${DOCKER_CMD} --profile prod up -d --build backend || fail "compose profile prod backend"
  retry_loop "curl /api/health" 30 2 api_health_ok
  curl -fsS http://127.0.0.1:3000/api/health | head -c 200 || true
  log ""
}

step_summary() {
  log "===== RESUMEN ====="
  log "- DB: contenedor psynova-db (usuario DB: ${DB_USER})"
  log "- Migracion: 03-alter-users-password-hash.sql aplicada via migrate_db_password_hash.sh"
  if [[ "${WITH_API}" -eq 1 ]]; then
    log "- API: http://127.0.0.1:3000/api/health"
  else
    log "- API local (sin contenedor): cd backend && npm run start:dev  (puerto 3000; no levantes con Docker API a la vez)"
  fi
  log ""
  log "Si acabas de: sudo usermod -aG docker \"\$USER\" — ejecuta: newgrp docker  o cierra sesion."
  log "OK for Next Step o pega la FALLA"
}

log "PROJECT_ROOT=${PROJECT_ROOT}"
pick_docker_compose
step_start_db
step_migrate
step_optional_api
step_summary
exit 0
