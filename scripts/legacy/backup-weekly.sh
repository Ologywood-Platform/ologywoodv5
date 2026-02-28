#!/bin/bash

################################################################################
# Ologywood Weekly Database Backup Script
# Purpose: Automated weekly full backup of production MySQL database
# Schedule: Every Sunday at 3:00 AM UTC (via cron)
# Retention: 4 weeks in S3
################################################################################

set -e

# Configuration
BACKUP_DIR="/backups/weekly"
DB_USER="${DB_USER:-backup_user}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-localhost}"
S3_BUCKET="${S3_BUCKET:-ologywood-backups}"
S3_REGION="${S3_REGION:-us-east-1}"
WEEK=$(date +%Y_week_%U)
BACKUP_FILE="$BACKUP_DIR/ologywood_weekly_$WEEK.sql.gz"
LOG_FILE="/var/log/ologywood-backup.log"
LOCK_FILE="/var/run/ologywood-backup-weekly.lock"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE"
  exit 1
}

cleanup() {
  rm -f "$LOCK_FILE"
}

trap cleanup EXIT

# Check if already running
if [ -f "$LOCK_FILE" ]; then
  error "Weekly backup already in progress"
fi

touch "$LOCK_FILE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Verify MySQL connectivity
if ! mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" > /dev/null 2>&1; then
  error "Cannot connect to MySQL"
fi

log "Starting weekly backup..."

# Perform backup
if mysqldump \
  --host="$DB_HOST" \
  --user="$DB_USER" \
  --password="$DB_PASSWORD" \
  --single-transaction \
  --quick \
  --lock-tables=false \
  --all-databases \
  2>>"$LOG_FILE" | gzip > "$BACKUP_FILE"; then
  
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  log "Weekly backup completed: $BACKUP_FILE (Size: $BACKUP_SIZE)"
  
else
  error "Weekly backup failed"
fi

# Verify integrity
if ! gunzip -t "$BACKUP_FILE" > /dev/null 2>&1; then
  error "Backup integrity check failed"
fi

log "Backup integrity verified"

# Upload to S3
log "Uploading to S3..."

if aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/weekly/" \
  --region "$S3_REGION" \
  --sse AES256 \
  >> "$LOG_FILE" 2>&1; then
  
  log "S3 upload successful"
  
else
  error "S3 upload failed"
fi

log "Weekly backup completed successfully"

exit 0
