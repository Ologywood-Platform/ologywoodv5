#!/bin/bash

################################################################################
# Ologywood Daily Database Backup Script
# Purpose: Automated daily backup of production MySQL database
# Schedule: Daily at 2:00 AM UTC (via cron)
# Retention: 7 days local + S3
################################################################################

set -e  # Exit on error

# ============================================================================
# Configuration
# ============================================================================

BACKUP_DIR="/backups/daily"
DB_USER="${DB_USER:-backup_user}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-localhost}"
S3_BUCKET="${S3_BUCKET:-ologywood-backups}"
S3_REGION="${S3_REGION:-us-east-1}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ologywood_daily_$TIMESTAMP.sql.gz"
LOG_FILE="/var/log/ologywood-backup.log"
LOCK_FILE="/var/run/ologywood-backup.lock"

# ============================================================================
# Functions
# ============================================================================

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

# ============================================================================
# Pre-flight Checks
# ============================================================================

# Check if already running
if [ -f "$LOCK_FILE" ]; then
  error "Backup already in progress (lock file exists)"
fi

# Create lock file
touch "$LOCK_FILE"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
  log "Creating backup directory: $BACKUP_DIR"
  mkdir -p "$BACKUP_DIR"
fi

# Check MySQL connectivity
if ! mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" > /dev/null 2>&1; then
  error "Cannot connect to MySQL database"
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
  error "AWS CLI not found"
fi

# Check disk space (need at least 500MB free)
AVAILABLE_SPACE=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
if [ "$AVAILABLE_SPACE" -lt 512000 ]; then
  error "Insufficient disk space (need 500MB, have ${AVAILABLE_SPACE}KB)"
fi

log "Pre-flight checks passed"

# ============================================================================
# Perform Backup
# ============================================================================

log "Starting daily backup..."

# Create backup using mysqldump
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
  log "Backup completed successfully: $BACKUP_FILE (Size: $BACKUP_SIZE)"
  
else
  error "Backup failed"
fi

# ============================================================================
# Verify Backup
# ============================================================================

log "Verifying backup integrity..."

if gunzip -t "$BACKUP_FILE" > /dev/null 2>&1; then
  log "Backup integrity verified"
else
  error "Backup integrity check failed"
fi

# ============================================================================
# Upload to S3
# ============================================================================

log "Uploading backup to S3..."

if aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/daily/" \
  --region "$S3_REGION" \
  --sse AES256 \
  --metadata "timestamp=$TIMESTAMP,hostname=$(hostname)" \
  >> "$LOG_FILE" 2>&1; then
  
  log "S3 upload successful"
  
else
  error "S3 upload failed"
fi

# ============================================================================
# Cleanup Old Backups
# ============================================================================

log "Cleaning up old backups..."

# Remove local backups older than 7 days
DELETED_COUNT=$(find "$BACKUP_DIR" -name "ologywood_daily_*.sql.gz" -mtime +7 -delete -print | wc -l)
log "Deleted $DELETED_COUNT local backup(s) older than 7 days"

# Note: S3 lifecycle policy handles S3 cleanup automatically

# ============================================================================
# Summary
# ============================================================================

log "Daily backup completed successfully"
log "Backup file: $BACKUP_FILE"
log "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
log "S3 location: s3://$S3_BUCKET/daily/$(basename "$BACKUP_FILE")"

exit 0
