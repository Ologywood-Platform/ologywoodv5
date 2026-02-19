#!/bin/bash

################################################################################
# Ologywood Backup Verification Script
# Purpose: Verify backup integrity and health
# Schedule: Daily at 5:00 AM UTC (via cron)
################################################################################

set -e

# Configuration
BACKUP_DIR="/backups/daily"
S3_BUCKET="${S3_BUCKET:-ologywood-backups}"
S3_REGION="${S3_REGION:-us-east-1}"
LOG_FILE="/var/log/ologywood-backup-verify.log"
ALERT_EMAIL="${ALERT_EMAIL:-ops@ologywood.com}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

alert() {
  echo "$1" | mail -s "Ologywood Backup Alert" "$ALERT_EMAIL"
  log "ALERT: $1"
}

log "Starting backup verification..."

# ============================================================================
# Check Latest Backup Exists
# ============================================================================

LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/ologywood_daily_*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  alert "CRITICAL: No backup found in $BACKUP_DIR"
  exit 1
fi

log "Latest backup: $LATEST_BACKUP"

# ============================================================================
# Check Backup Size
# ============================================================================

SIZE=$(du -b "$LATEST_BACKUP" | cut -f1)
SIZE_MB=$((SIZE / 1048576))

if [ "$SIZE_MB" -lt 50 ]; then
  alert "WARNING: Backup size is only ${SIZE_MB}MB (expected > 50MB)"
fi

log "Backup size: ${SIZE_MB}MB"

# ============================================================================
# Check Backup Age
# ============================================================================

BACKUP_TIME=$(stat -c %Y "$LATEST_BACKUP")
CURRENT_TIME=$(date +%s)
AGE=$((($CURRENT_TIME - $BACKUP_TIME) / 3600))

if [ "$AGE" -gt 25 ]; then
  alert "WARNING: Backup is $AGE hours old (expected < 24 hours)"
fi

log "Backup age: $AGE hours"

# ============================================================================
# Verify Backup Integrity
# ============================================================================

log "Testing backup integrity..."

if gunzip -t "$LATEST_BACKUP" > /dev/null 2>&1; then
  log "Backup integrity: OK"
else
  alert "CRITICAL: Backup integrity check failed"
  exit 1
fi

# ============================================================================
# Check S3 Sync
# ============================================================================

log "Checking S3 backup sync..."

S3_COUNT=$(aws s3 ls "s3://$S3_BUCKET/daily/" --region "$S3_REGION" 2>/dev/null | wc -l)

if [ "$S3_COUNT" -eq 0 ]; then
  alert "CRITICAL: No backups found in S3"
  exit 1
fi

log "S3 backups found: $S3_COUNT"

# ============================================================================
# Check S3 Latest Backup Age
# ============================================================================

S3_LATEST=$(aws s3 ls "s3://$S3_BUCKET/daily/" --region "$S3_REGION" 2>/dev/null | tail -1 | awk '{print $4}')

if [ -z "$S3_LATEST" ]; then
  alert "WARNING: Could not determine S3 latest backup"
else
  log "S3 latest backup: $S3_LATEST"
fi

# ============================================================================
# Check Disk Space
# ============================================================================

AVAILABLE=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
AVAILABLE_MB=$((AVAILABLE / 1024))

if [ "$AVAILABLE_MB" -lt 500 ]; then
  alert "WARNING: Low disk space in $BACKUP_DIR (${AVAILABLE_MB}MB available)"
fi

log "Available disk space: ${AVAILABLE_MB}MB"

# ============================================================================
# Summary
# ============================================================================

log "Backup verification completed successfully"
log "Summary:"
log "  - Latest backup: $(basename "$LATEST_BACKUP")"
log "  - Size: ${SIZE_MB}MB"
log "  - Age: $AGE hours"
log "  - Integrity: OK"
log "  - S3 backups: $S3_COUNT"
log "  - Disk space: ${AVAILABLE_MB}MB"

exit 0
