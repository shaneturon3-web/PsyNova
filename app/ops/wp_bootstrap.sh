#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}"

if [[ ! -f ".env" ]]; then
  cp .env.example .env
fi

load_env_file() {
  local env_file="$1"
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" == *"="* ]]; then
      local key="${line%%=*}"
      local value="${line#*=}"
      key="$(echo "$key" | xargs)"
      value="${value%$'\r'}"
      value="${value%\"}"
      value="${value#\"}"
      value="${value%\'}"
      value="${value#\'}"
      if [[ -n "$key" ]]; then
        export "$key=$value"
      fi
    fi
  done < "$env_file"
}

load_env_file ".env"

WP_SITE_URL="${WP_SITE_URL:-http://localhost:8080}"
WP_SITE_TITLE="${WP_SITE_TITLE:-PsyNova Virtual Clinic}"
WP_ADMIN_USER="${WP_ADMIN_USER:-psynova_admin}"
WP_ADMIN_PASSWORD="${WP_ADMIN_PASSWORD:-psynova_admin_change_me}"
WP_ADMIN_EMAIL="${WP_ADMIN_EMAIL:-admin@psynova.local}"

DOCKER_CMD="docker compose"
if command -v sudo >/dev/null 2>&1 && sudo -n true >/dev/null 2>&1; then
  DOCKER_CMD="sudo docker compose"
fi

${DOCKER_CMD} pull wordpress
${DOCKER_CMD} up -d --force-recreate wordpress wpdb

${DOCKER_CMD} exec -T wordpress sh -lc \
  "mkdir -p /var/www/html/wp-content/upgrade && chown -R www-data:www-data /var/www/html/wp-content && chmod -R 775 /var/www/html/wp-content"

if ! ${DOCKER_CMD} run --rm --user root wpcli wp core is-installed --path=/var/www/html --allow-root >/dev/null 2>&1; then
  ${DOCKER_CMD} run --rm --user root wpcli wp core install \
    --path=/var/www/html \
    --url="${WP_SITE_URL}" \
    --title="${WP_SITE_TITLE}" \
    --admin_user="${WP_ADMIN_USER}" \
    --admin_password="${WP_ADMIN_PASSWORD}" \
    --admin_email="${WP_ADMIN_EMAIL}" \
    --skip-email \
    --allow-root
fi

${DOCKER_CMD} run --rm --user root wpcli wp core update --path=/var/www/html --allow-root || true

${DOCKER_CMD} run --rm --user root wpcli wp plugin install \
  wp-mail-smtp woocommerce updraftplus --activate --path=/var/www/html --allow-root

printf '\a'
echo "OK for Next Step o pega la FALLA"
