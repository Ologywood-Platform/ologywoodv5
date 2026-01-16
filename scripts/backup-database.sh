#!/bin/bash

################################################################################
# Ologywood Database Backup Script
# 
# This script performs automated MySQL database backups with:
# - Incremental and full backup strategies
# - Compression for storage efficiency
# - Retention policies for automatic cleanup
# - Email notifications on success/failure
# - Backup verification
#
# Usage: ./backup-database.sh [full|incremental|verify|restore]
# 
# Setup cron job:
# 0 2 * * * /path/to/backup-database.sh incremental >> /var/log/ologywood-backup.log 2>&1
# 0 3 * * 0 /path/to/backup-database.sh full >> /var/log/ologywood-backup.log 2>&1
################################################################################

set -e

# Configuration
BACKUP_DIR="/backups/ologywood"
LOG_DIR="/var/log/ologywood"
DB_NAME="${DATABASE_NAME:-ologywood_prod}"
DB_USER="${DATABASE_USER:-ologywood_app}"
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-3306}"
RETENTION_DAYS=30
FULL_BACKUP_DAY=0  # Sunday
BACKUP_TYPE="${1:-incremental}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y-%m-%d)
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_TYPE}_${DATE}_${TIMESTAMP}.sql.gz"
LOG_FILE="${LOG_DIR}/backup_${DATE}.log"
EMAIL_TO="${BACKUP_EMAIL:-admin@ologywood.com}"

# Create directories if they don't exist
mkdir -p "$BACKUP_DIR" "$LOG_DIR"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    send_email "FAILED" "$1"
    exit 1
}

# Send email notification
send_email() {
    local status=$1
    local message=$2
    local subject="[${status}] Ologywood Database Backup - ${DATE}"
    
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" "$EMAIL_TO"
    fi
}

# Perform full backup
full_backup() {
    log "Starting full database backup..."
    
    if ! mysqldump \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DATABASE_PASSWORD" \
        --single-transaction \
        --quick \
        --lock-tables=false \
        --routines \
        --triggers \
        --events \
        "$DB_NAME" | gzip > "$BACKUP_FILE"; then
        error_exit "Failed to create database backup"
    fi
    
    log "Full backup completed: $BACKUP_FILE"
    log "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
}

# Perform incremental backup (using binary logs)
incremental_backup() {
    log "Starting incremental database backup..."
    
    # Check if binary logging is enabled
    if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DATABASE_PASSWORD" \
        -e "SHOW VARIABLES LIKE 'log_bin';" | grep -q ON; then
        log "Binary logging not enabled, performing full backup instead"
        full_backup
        return
    fi
    
    # Create incremental backup using mysqldump with binary log position
    if ! mysqldump \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DATABASE_PASSWORD" \
        --single-transaction \
        --quick \
        --lock-tables=false \
        --master-data=2 \
        "$DB_NAME" | gzip > "$BACKUP_FILE"; then
        error_exit "Failed to create incremental backup"
    fi
    
    log "Incremental backup completed: $BACKUP_FILE"
    log "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."
    
    if [ ! -f "$BACKUP_FILE" ]; then
        error_exit "Backup file not found: $BACKUP_FILE"
    fi
    
    # Check if file is valid gzip
    if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
        error_exit "Backup file is corrupted: $BACKUP_FILE"
    fi
    
    # Check if backup contains SQL statements
    if ! gunzip -c "$BACKUP_FILE" | head -100 | grep -q "CREATE TABLE\|INSERT INTO"; then
        error_exit "Backup file appears to be invalid (no SQL content found)"
    fi
    
    log "Backup verification passed"
}

# Clean up old backups based on retention policy
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local deleted_count=0
    local freed_space=0
    
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            local size=$(du -b "$file" | cut -f1)
            rm -f "$file"
            freed_space=$((freed_space + size))
            deleted_count=$((deleted_count + 1))
            log "Deleted old backup: $(basename "$file")"
        fi
    done < <(find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS)
    
    if [ $deleted_count -gt 0 ]; then
        log "Deleted $deleted_count old backups, freed $(numfmt --to=iec $freed_space 2>/dev/null || echo "$freed_space bytes")"
    fi
}

# Restore from backup
restore_backup() {
    local backup_file=$2
    
    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
        error_exit "Backup file not specified or not found"
    fi
    
    log "WARNING: Restoring from backup will overwrite existing data!"
    log "Backup file: $backup_file"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled"
        return
    fi
    
    log "Starting database restore from $backup_file..."
    
    if ! gunzip -c "$backup_file" | mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DATABASE_PASSWORD" \
        "$DB_NAME"; then
        error_exit "Failed to restore database"
    fi
    
    log "Database restore completed successfully"
    send_email "SUCCESS" "Database restore completed from $backup_file"
}

# Get backup statistics
get_statistics() {
    log "=== Backup Statistics ==="
    log "Backup directory: $BACKUP_DIR"
    log "Total backups: $(find "$BACKUP_DIR" -name "*.sql.gz" -type f | wc -l)"
    log "Total backup size: $(du -sh "$BACKUP_DIR" | cut -f1)"
    log "Oldest backup: $(find "$BACKUP_DIR" -name "*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | head -1 | cut -d' ' -f2-)"
    log "Latest backup: $(find "$BACKUP_DIR" -name "*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)"
    log "Retention policy: Keep backups for $RETENTION_DAYS days"
}

# Main execution
main() {
    log "=========================================="
    log "Ologywood Database Backup Script"
    log "Backup Type: $BACKUP_TYPE"
    log "Database: $DB_NAME"
    log "=========================================="
    
    case "$BACKUP_TYPE" in
        full)
            full_backup
            verify_backup
            cleanup_old_backups
            get_statistics
            send_email "SUCCESS" "Full backup completed successfully. Backup file: $BACKUP_FILE"
            ;;
        incremental)
            incremental_backup
            verify_backup
            cleanup_old_backups
            get_statistics
            send_email "SUCCESS" "Incremental backup completed successfully. Backup file: $BACKUP_FILE"
            ;;
        verify)
            if [ -z "$2" ]; then
                error_exit "Please specify backup file to verify"
            fi
            BACKUP_FILE="$2"
            verify_backup
            ;;
        restore)
            restore_backup "$@"
            ;;
        stats)
            get_statistics
            ;;
        *)
            echo "Usage: $0 [full|incremental|verify|restore|stats]"
            echo ""
            echo "Commands:"
            echo "  full        - Perform full database backup"
            echo "  incremental - Perform incremental backup (uses binary logs)"
            echo "  verify      - Verify backup integrity"
            echo "  restore     - Restore from backup"
            echo "  stats       - Show backup statistics"
            exit 1
            ;;
    esac
    
    log "=========================================="
    log "Backup script completed successfully"
    log "=========================================="
}

# Run main function
main "$@"
