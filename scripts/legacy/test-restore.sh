#!/bin/bash

################################################################################
# Ologywood Restore Test Script
# Purpose: Test backup restore capability
# Schedule: First Sunday of each month at 6:00 AM UTC (via cron)
################################################################################

set -e

# Configuration
BACKUP_DIR="/backups/daily"
DB_USER="${DB_USER:-backup_user}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-localhost}"
TEST_DB="ologywood_test_$(date +%s)"
LOG_FILE="/var/log/ologywood-restore-test.log"
ALERT_EMAIL="${ALERT_EMAIL:-ops@ologywood.com}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE"
  # Cleanup test database on error
  mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "DROP DATABASE IF EXISTS $TEST_DB;" 2>/dev/null || true
  exit 1
}

alert() {
  echo "$1" | mail -s "Ologywood Restore Test Alert" "$ALERT_EMAIL"
  log "ALERT: $1"
}

log "Starting restore test..."

# ============================================================================
# Get Latest Backup
# ============================================================================

LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/ologywood_daily_*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  error "No backup found"
fi

log "Using backup: $LATEST_BACKUP"

# ============================================================================
# Create Test Database
# ============================================================================

log "Creating test database: $TEST_DB"

if ! mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE $TEST_DB;" 2>>"$LOG_FILE"; then
  error "Failed to create test database"
fi

# ============================================================================
# Restore Backup
# ============================================================================

log "Restoring backup to test database..."

if gunzip -c "$LATEST_BACKUP" | mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" $TEST_DB 2>>"$LOG_FILE"; then
  log "Restore completed successfully"
else
  error "Restore failed"
fi

# ============================================================================
# Verify Restoration
# ============================================================================

log "Verifying restoration..."

# Check table count
TABLE_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$TEST_DB';" 2>/dev/null | tail -1)

log "Tables restored: $TABLE_COUNT"

if [ "$TABLE_COUNT" -lt 10 ]; then
  error "Insufficient tables restored (expected > 10, got $TABLE_COUNT)"
fi

# Check record counts
log "Checking record counts..."

USERS=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM $TEST_DB.users;" 2>/dev/null | tail -1)
BOOKINGS=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM $TEST_DB.bookings;" 2>/dev/null | tail -1)
ARTISTS=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT COUNT(*) FROM $TEST_DB.artistProfiles;" 2>/dev/null | tail -1)

log "Record counts:"
log "  - Users: $USERS"
log "  - Bookings: $BOOKINGS"
log "  - Artists: $ARTISTS"

# ============================================================================
# Data Integrity Checks
# ============================================================================

log "Running data integrity checks..."

# Check for orphaned records
ORPHANED=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "
SELECT COUNT(*) FROM $TEST_DB.bookings b 
WHERE NOT EXISTS (SELECT 1 FROM $TEST_DB.users u WHERE u.id = b.artistId);" 2>/dev/null | tail -1)

if [ "$ORPHANED" -gt 0 ]; then
  alert "WARNING: Found $ORPHANED orphaned booking records"
fi

log "Data integrity checks passed"

# ============================================================================
# Cleanup
# ============================================================================

log "Cleaning up test database..."

if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "DROP DATABASE $TEST_DB;" 2>>"$LOG_FILE"; then
  log "Test database dropped"
else
  error "Failed to drop test database"
fi

# ============================================================================
# Summary
# ============================================================================

log "Restore test completed successfully"
log "Summary:"
log "  - Backup file: $(basename "$LATEST_BACKUP")"
log "  - Test database: $TEST_DB"
log "  - Tables restored: $TABLE_COUNT"
log "  - Users: $USERS"
log "  - Bookings: $BOOKINGS"
log "  - Artists: $ARTISTS"
log "  - Orphaned records: $ORPHANED"
log "  - Status: PASSED"

exit 0
