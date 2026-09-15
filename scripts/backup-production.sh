#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="${BACKUP_DIR:-./backups/mysql}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE is missing."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/procv_${TIMESTAMP}.sql.gz"

echo "==> Creating MySQL backup: $BACKUP_FILE"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T db \
  sh -c 'exec mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" --single-transaction --routines --triggers --events' \
  | gzip > "$BACKUP_FILE"

if [[ ! -s "$BACKUP_FILE" ]]; then
  echo "ERROR: backup file is empty."
  rm -f "$BACKUP_FILE"
  exit 1
fi

echo "==> Backup created successfully."

echo "==> Removing backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -type f -name "procv_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "==> Available backups:"
ls -lh "$BACKUP_DIR"