#!/bin/bash

echo "[GUARD] Checking PsyNova DB configuration..."

ENV_FILE="backend/.env"

USE_PERSISTENCE=$(grep '^USE_PERSISTENCE=' $ENV_FILE | cut -d '=' -f2)
DB_HOST=$(grep '^DB_HOST=' $ENV_FILE | cut -d '=' -f2)

if [ "$USE_PERSISTENCE" != "true" ]; then
  echo "[FAIL] USE_PERSISTENCE is not true"
  exit 1
fi

if [ "$DB_HOST" != "localhost" ] && [ "$DB_HOST" != "db" ]; then
  echo "[FAIL] DB_HOST invalid: $DB_HOST"
  exit 1
fi

echo "[OK] DB config valid"

RESPONSE=$(curl -s http://localhost:3000/api/health)

echo "[INFO] Health: $RESPONSE"

if echo "$RESPONSE" | grep -q '"database":"connected"'; then
  echo "[OK] Database connected"
else
  echo "[FAIL] Database NOT connected"
  exit 1
fi
