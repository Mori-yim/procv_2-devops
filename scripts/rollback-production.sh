#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE is missing."
  exit 1
fi

if [[ -z "${ROLLBACK_TAG:-}" ]]; then
  echo "ERROR: ROLLBACK_TAG is required."
  echo "Example: ROLLBACK_TAG=1.0.0 ./scripts/rollback-production.sh"
  exit 1
fi

echo "==> Rolling back ProCV to version: $ROLLBACK_TAG"

sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$ROLLBACK_TAG/" "$ENV_FILE"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans

echo "==> Waiting for backend health..."

for i in {1..30}; do
  if docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T backend \
      /busybox wget -q -O - http://127.0.0.1:8080/actuator/health; then
    echo
    echo "==> Rollback successful."
    exit 0
  fi

  sleep 5
done

echo "ERROR: Backend did not become healthy after rollback."
exit 1