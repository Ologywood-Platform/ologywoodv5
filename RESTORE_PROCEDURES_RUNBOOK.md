# Ologywood - Database Restore Procedures Runbook

**Version:** 1.0  
**Last Updated:** February 19, 2026  
**Purpose:** Step-by-step procedures for restoring database from backups  
**Criticality:** CRITICAL - Use during disaster recovery

---

## Quick Reference

| Scenario | RTO | Procedure |
|----------|-----|-----------|
| **Restore Latest Backup** | 15 min | Section 1 |
| **Point-in-Time Recovery** | 30 min | Section 2 |
| **Restore to New Server** | 45 min | Section 3 |
| **Restore Specific Table** | 20 min | Section 4 |
| **Restore Specific Database** | 15 min | Section 5 |

---

## Prerequisites

Before attempting any restore, verify:
- ✅ MySQL is installed and running
- ✅ You have root or backup_user credentials
- ✅ Sufficient disk space (at least 2x backup size)
- ✅ Network access to S3 (if downloading from cloud)
- ✅ SSH access to production server
- ✅ Backup file is available and verified

---

## Scenario 1: Restore Latest Daily Backup

**Use Case:** Quick recovery from recent data loss or corruption  
**RTO:** 15 minutes  
**Data Loss:** Up to 24 hours

### Step 1: Assess Situation
```bash
# Check current database status
mysql -u root -p -e "SELECT COUNT(*) as table_count FROM information_schema.TABLES WHERE TABLE_SCHEMA='ologywood_prod';"

# Check database size
mysql -u root -p -e "SELECT SUM(data_length + index_length) / 1024 / 1024 as size_mb FROM information_schema.TABLES WHERE TABLE_SCHEMA='ologywood_prod';"

# Check last backup
ls -lh /backups/daily/ | tail -5
```

### Step 2: Stop Application
```bash
# Stop the application to prevent writes during restore
sudo systemctl stop ologywood

# Verify it's stopped
sudo systemctl status ologywood
```

### Step 3: Download Backup (if needed)
```bash
# If backup is on S3, download it
aws s3 cp s3://ologywood-backups/daily/ologywood_daily_latest.sql.gz \
  /tmp/restore.sql.gz \
  --region us-east-1

# If backup is local, copy it
cp /backups/daily/ologywood_daily_YYYYMMDD_HHMMSS.sql.gz /tmp/restore.sql.gz
```

### Step 4: Backup Current Database (Safety)
```bash
# Create backup of current state (in case we need to rollback)
mysqldump -u root -p --all-databases | gzip > /tmp/backup_before_restore_$(date +%s).sql.gz

# Verify backup
gunzip -t /tmp/backup_before_restore_*.sql.gz
```

### Step 5: Decompress Backup
```bash
# Decompress the backup file
gunzip /tmp/restore.sql.gz

# Verify decompression
ls -lh /tmp/restore.sql
```

### Step 6: Restore Database
```bash
# Restore from backup
mysql -u root -p < /tmp/restore.sql

# This will take 5-10 minutes depending on backup size
# Monitor progress in another terminal:
# watch -n 5 'mysql -u root -p -e "SHOW PROCESSLIST;"'
```

### Step 7: Verify Restoration
```bash
# Check table count
mysql -u root -p -e "SELECT COUNT(*) as table_count FROM information_schema.TABLES WHERE TABLE_SCHEMA='ologywood_prod';"

# Check specific tables
mysql -u root -p ologywood_prod -e "SELECT COUNT(*) as users FROM users;"
mysql -u root -p ologywood_prod -e "SELECT COUNT(*) as bookings FROM bookings;"
mysql -u root -p ologywood_prod -e "SELECT COUNT(*) as artists FROM artistProfiles;"

# Check database size
mysql -u root -p -e "SELECT SUM(data_length + index_length) / 1024 / 1024 as size_mb FROM information_schema.TABLES WHERE TABLE_SCHEMA='ologywood_prod';"
```

### Step 8: Start Application
```bash
# Start the application
sudo systemctl start ologywood

# Verify it started
sudo systemctl status ologywood

# Check application logs
tail -f /var/log/ologywood/app.log
```

### Step 9: Post-Restore Verification
```bash
# Test critical API endpoints
curl -X GET http://localhost:3000/api/trpc/auth.me

# Check for errors in logs
grep -i error /var/log/ologywood/app.log | tail -20

# Monitor application metrics
# Check CPU, memory, and database connections
```

### Step 10: Cleanup
```bash
# Remove temporary files
rm -f /tmp/restore.sql
rm -f /tmp/restore.sql.gz

# Archive backup of current state
mv /tmp/backup_before_restore_*.sql.gz /backups/restore_backups/
```

---

## Scenario 2: Point-in-Time Recovery (PITR)

**Use Case:** Recover to specific point in time before data loss  
**RTO:** 30 minutes  
**Data Loss:** Minimal (to specific timestamp)

### Prerequisites
- Binary logs must be enabled (check: `SHOW BINARY LOGS;`)
- Binary logs must be available for the time period
- Know the exact time of data loss

### Step 1: Identify Recovery Point
```bash
# Determine the exact time you want to recover to
# Example: 2026-02-19 10:30:00 (before data loss)
RECOVERY_TIME="2026-02-19 10:30:00"

# Check available binary logs
mysql -u root -p -e "SHOW BINARY LOGS;"
```

### Step 2: Restore from Latest Backup Before Recovery Time
```bash
# Download appropriate backup
# Use the most recent backup before the recovery time
aws s3 cp s3://ologywood-backups/daily/ologywood_daily_20260219_020000.sql.gz \
  /tmp/restore.sql.gz

gunzip /tmp/restore.sql.gz
```

### Step 3: Stop Application
```bash
sudo systemctl stop ologywood
```

### Step 4: Restore Base Backup
```bash
# Restore the base backup
mysql -u root -p < /tmp/restore.sql

# Note the binary log position from the backup
# This will be needed for applying binary logs
```

### Step 5: Apply Binary Logs Up to Recovery Time
```bash
# Get binary log files
BINARY_LOG_DIR="/var/log/mysql"

# Apply binary logs up to specific time
mysqlbinlog \
  --start-datetime="2026-02-19 02:00:00" \
  --stop-datetime="2026-02-19 10:30:00" \
  $BINARY_LOG_DIR/mysql-bin.000001 \
  $BINARY_LOG_DIR/mysql-bin.000002 \
  | mysql -u root -p

# This applies all changes up to the recovery time
```

### Step 6: Verify Recovery
```bash
# Check data as of recovery time
mysql -u root -p ologywood_prod -e "SELECT * FROM bookings ORDER BY createdAt DESC LIMIT 5;"

# Verify no data after recovery time
mysql -u root -p ologywood_prod -e "SELECT * FROM bookings WHERE createdAt > '2026-02-19 10:30:00';"
```

### Step 7: Start Application
```bash
sudo systemctl start ologywood
sudo systemctl status ologywood
```

---

## Scenario 3: Restore to New Server

**Use Case:** Complete server failure, need to restore to new hardware  
**RTO:** 45 minutes  
**Data Loss:** Up to 24 hours

### Step 1: Prepare New Server
```bash
# Install MySQL
sudo apt update
sudo apt install mysql-server

# Start MySQL
sudo systemctl start mysql

# Verify installation
mysql --version
```

### Step 2: Configure MySQL
```bash
# Copy MySQL configuration from old server (if available)
scp user@old-server:/etc/mysql/mysql.conf.d/mysqld.cnf /tmp/mysqld.cnf
sudo cp /tmp/mysqld.cnf /etc/mysql/mysql.conf.d/mysqld.cnf

# Or use default configuration
sudo systemctl restart mysql
```

### Step 3: Download Backup
```bash
# Download from S3
aws s3 cp s3://ologywood-backups/weekly/ologywood_weekly_latest.sql.gz \
  /tmp/restore.sql.gz \
  --region us-east-1

# Or copy from backup server
scp user@backup-server:/backups/daily/ologywood_daily_latest.sql.gz /tmp/restore.sql.gz
```

### Step 4: Restore Database
```bash
# Decompress
gunzip /tmp/restore.sql.gz

# Restore
mysql -u root -p < /tmp/restore.sql

# Monitor progress
watch -n 5 'mysql -u root -p -e "SHOW PROCESSLIST;"'
```

### Step 5: Create Backup User
```bash
# Create backup user for future backups
mysql -u root -p << 'EOF'
CREATE USER 'backup_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT, LOCK TABLES, SHOW VIEW, RELOAD, REPLICATION CLIENT ON *.* TO 'backup_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

### Step 6: Verify Restoration
```bash
# Check databases
mysql -u root -p -e "SHOW DATABASES;"

# Check tables
mysql -u root -p ologywood_prod -e "SHOW TABLES;"

# Check record counts
mysql -u root -p ologywood_prod -e "SELECT COUNT(*) as total_users FROM users;"
```

### Step 7: Configure Replication (Optional)
```bash
# If setting up as replica of primary server
mysql -u root -p << 'EOF'
CHANGE MASTER TO
  MASTER_HOST='primary-db.example.com',
  MASTER_USER='replication_user',
  MASTER_PASSWORD='replication_password',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=12345;

START SLAVE;
SHOW SLAVE STATUS\G
EOF
```

### Step 8: Update Application Configuration
```bash
# Update application to point to new database server
# Edit .env or configuration file
DB_HOST=new-server-ip
DB_USER=backup_user
DB_PASSWORD=secure_password

# Restart application
sudo systemctl restart ologywood
```

---

## Scenario 4: Restore Specific Table

**Use Case:** Single table corruption or accidental deletion  
**RTO:** 20 minutes  
**Data Loss:** Only affected table

### Step 1: Extract Table from Backup
```bash
# Decompress backup
gunzip -c /backups/daily/ologywood_daily_latest.sql.gz > /tmp/full_backup.sql

# Extract specific table (example: bookings)
grep -A 10000 "CREATE TABLE.*bookings" /tmp/full_backup.sql > /tmp/bookings_table.sql

# Or use sed to extract
sed -n '/^CREATE TABLE.*bookings/,/^CREATE TABLE/p' /tmp/full_backup.sql > /tmp/bookings_table.sql
```

### Step 2: Backup Current Table
```bash
# Backup current table before restore
mysqldump -u root -p ologywood_prod bookings > /tmp/bookings_backup_$(date +%s).sql
```

### Step 3: Drop and Restore Table
```bash
# Drop corrupted table
mysql -u root -p ologywood_prod -e "DROP TABLE bookings;"

# Restore table from backup
mysql -u root -p ologywood_prod < /tmp/bookings_table.sql
```

### Step 4: Verify Restoration
```bash
# Check table structure
mysql -u root -p ologywood_prod -e "DESCRIBE bookings;"

# Check record count
mysql -u root -p ologywood_prod -e "SELECT COUNT(*) as bookings FROM bookings;"

# Check sample data
mysql -u root -p ologywood_prod -e "SELECT * FROM bookings LIMIT 5;"
```

---

## Scenario 5: Restore Specific Database

**Use Case:** Restore single database while keeping others intact  
**RTO:** 15 minutes  
**Data Loss:** Only affected database

### Step 1: Extract Database from Backup
```bash
# Decompress backup
gunzip -c /backups/daily/ologywood_daily_latest.sql.gz > /tmp/full_backup.sql

# Extract specific database (example: ologywood_prod)
mysqldump --no-create-db --no-data < /tmp/full_backup.sql | \
  sed -n '/^-- Database: `ologywood_prod`/,/^-- Database:/p' > /tmp/ologywood_prod.sql
```

### Step 2: Backup Current Database
```bash
# Backup current database
mysqldump -u root -p ologywood_prod > /tmp/ologywood_prod_backup_$(date +%s).sql
```

### Step 3: Drop and Restore Database
```bash
# Drop database
mysql -u root -p -e "DROP DATABASE ologywood_prod;"

# Create fresh database
mysql -u root -p -e "CREATE DATABASE ologywood_prod;"

# Restore database
mysql -u root -p ologywood_prod < /tmp/ologywood_prod.sql
```

### Step 4: Verify Restoration
```bash
# Check tables
mysql -u root -p ologywood_prod -e "SHOW TABLES;"

# Check record counts
mysql -u root -p ologywood_prod -e "
SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES 
WHERE TABLE_SCHEMA='ologywood_prod' 
ORDER BY TABLE_ROWS DESC;
"
```

---

## Troubleshooting

### Issue: "ERROR 1064: Syntax error in SQL"
**Cause:** Corrupted backup file  
**Solution:**
```bash
# Verify backup integrity
gunzip -t /backups/daily/ologywood_daily_*.sql.gz

# Download fresh backup from S3
aws s3 cp s3://ologywood-backups/daily/ologywood_daily_latest.sql.gz /tmp/restore.sql.gz
```

### Issue: "ERROR 1040: Too many connections"
**Cause:** Too many restore processes  
**Solution:**
```bash
# Check active connections
mysql -u root -p -e "SHOW PROCESSLIST;"

# Kill long-running queries
mysql -u root -p -e "KILL QUERY <process_id>;"

# Increase max_connections temporarily
mysql -u root -p -e "SET GLOBAL max_connections=1000;"
```

### Issue: "ERROR 1030: Got error 28 from storage engine"
**Cause:** Disk space full  
**Solution:**
```bash
# Check disk space
df -h

# Free up space
rm -f /tmp/*.sql /tmp/*.gz

# Check backup size
du -h /backups/daily/
```

### Issue: "ERROR 1205: Lock wait timeout exceeded"
**Cause:** Long-running queries blocking restore  
**Solution:**
```bash
# Check locks
mysql -u root -p -e "SHOW OPEN TABLES WHERE In_use > 0;"

# Kill blocking queries
mysql -u root -p -e "KILL <process_id>;"

# Restart MySQL if necessary
sudo systemctl restart mysql
```

---

## Post-Restore Checklist

After any restore, verify:

- [ ] All tables present: `SHOW TABLES;`
- [ ] Record counts reasonable: `SELECT COUNT(*) FROM <table>;`
- [ ] No orphaned records: Check foreign key relationships
- [ ] Application starts successfully: `sudo systemctl start ologywood`
- [ ] API endpoints responding: `curl http://localhost:3000/api/trpc/auth.me`
- [ ] No errors in logs: `grep -i error /var/log/ologywood/app.log`
- [ ] Database performance acceptable: Monitor CPU, memory, I/O
- [ ] Backups resume normally: Check cron jobs
- [ ] Monitoring alerts cleared: Check CloudWatch/monitoring system

---

## Emergency Contacts

- **Database Administrator:** [Name] - [Phone] - [Email]
- **System Administrator:** [Name] - [Phone] - [Email]
- **On-Call Engineer:** [Name] - [Phone] - [Email]
- **AWS Support:** [Support Plan ID]

---

## Additional Resources

- **Backup Strategy:** See `DATABASE_BACKUP_STRATEGY.md`
- **MySQL Documentation:** https://dev.mysql.com/doc/
- **AWS S3 Documentation:** https://docs.aws.amazon.com/s3/
- **Disaster Recovery Plan:** See `DISASTER_RECOVERY_PLAN.md`

---

**Last Updated:** February 19, 2026  
**Version:** 1.0  
**Status:** Ready for Production Use

