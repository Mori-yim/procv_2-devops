#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE is missing. Copy deploy/.env.production.example to .env.production and configure it."
  exit 1
fi

export COMPOSE_PROJECT_NAME="procv"
echo "==> Pulling production images"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull

echo "==> Starting production stack"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans

echo "==> Current status"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

echo "==> Backend health"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T backend /busybox wget -q -O - http://127.0.0.1:8080/actuator/health || true
