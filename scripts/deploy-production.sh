#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_SCRIPT="./scripts/backup-production.sh"
ROLLBACK_SCRIPT="./scripts/rollback-production.sh"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE is missing."
  exit 1
fi

if [[ ! -f "$BACKUP_SCRIPT" ]]; then
  echo "ERROR: $BACKUP_SCRIPT is missing."
  exit 1
fi

if [[ ! -f "$ROLLBACK_SCRIPT" ]]; then
  echo "ERROR: $ROLLBACK_SCRIPT is missing."
  exit 1
fi

export COMPOSE_PROJECT_NAME="procv"

CURRENT_TAG="$(grep '^IMAGE_TAG=' "$ENV_FILE" | cut -d'=' -f2- || true)"

if [[ -z "$CURRENT_TAG" ]]; then
  CURRENT_TAG="latest"
fi

echo "=========================================="
echo " ProCV Production Deployment"
echo " Current image tag: $CURRENT_TAG"
echo "=========================================="

echo
echo "==> Creating database backup"
bash "$BACKUP_SCRIPT"

echo
echo "==> Pulling production images"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull

echo
echo "==> Starting production stack"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans

echo
echo "==> Current status"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

echo
echo "==> Waiting for backend health"

HEALTH_OK=false

for i in {1..30}; do
  if docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T backend \
      /busybox wget -q -O - http://127.0.0.1:8080/actuator/health; then
    HEALTH_OK=true
    echo
    echo "==> Backend is healthy."
    break
  fi

  echo "Waiting for backend... attempt $i/30"
  sleep 5
done

if [[ "$HEALTH_OK" != "true" ]]; then
  echo
  echo "ERROR: Backend did not become healthy."
  echo "==> Starting automatic rollback to: $CURRENT_TAG"

  ROLLBACK_TAG="$CURRENT_TAG" bash "$ROLLBACK_SCRIPT"

  echo
  echo "ERROR: Deployment failed and rollback was attempted."
  exit 1
fi

echo
echo "==> Final production status"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

echo
echo "=========================================="
echo " Deployment completed successfully."
echo " Version: $(grep '^IMAGE_TAG=' "$ENV_FILE" | cut -d'=' -f2-)"
echo "=========================================="