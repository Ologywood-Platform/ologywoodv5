# Ologywood - Backup System Test Plan & Validation

**Version:** 1.0  
**Last Updated:** February 19, 2026  
**Purpose:** Comprehensive testing procedures to validate backup system functionality  
**Estimated Time:** 4-6 hours

---

## Test Execution Summary

| Test Category | Tests | Duration | Priority |
|---------------|-------|----------|----------|
| **Configuration** | 8 tests | 30 min | CRITICAL |
| **Backup Functionality** | 6 tests | 90 min | CRITICAL |
| **Restore Procedures** | 5 tests | 120 min | CRITICAL |
| **Monitoring & Alerts** | 4 tests | 60 min | HIGH |
| **Performance** | 3 tests | 30 min | MEDIUM |
| **Total** | **26 tests** | **330 min** | — |

---

## Test 1: Configuration Verification

### Test 1.1: MySQL Backup User Verification

**Objective:** Verify backup user is properly configured with correct permissions

**Steps:**
```bash
# Connect to MySQL
mysql -u root -p

# Check backup user exists
SELECT user, host FROM mysql.user WHERE user='backup_user';

# Check permissions
SHOW GRANTS FOR 'backup_user'@'localhost';

# Test backup user connection
EXIT;
mysql -u backup_user -p -e "SELECT 1;"
```

**Expected Results:**
- Backup user exists with host='localhost'
- User has SELECT, LOCK TABLES, SHOW VIEW, RELOAD, REPLICATION CLIENT permissions
- Connection successful with correct password
- Query returns "1"

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Test 1.2: Directory Structure Verification

**Objective:** Verify backup directories exist with correct permissions

**Steps:**
```bash
# Check directories exist
ls -la /backups/

# Check permissions
stat /backups/daily
stat /backups/weekly
stat /backups/monthly

# Check disk space
df -h /backups/
```

**Expected Results:**
- All three directories exist
- Permissions are 700 (drwx------)
- Owner is root
- Available disk space > 500GB

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Test 1.3: Script Installation Verification

**Objective:** Verify all backup scripts are installed and executable

**Steps:**
```bash
# Check scripts exist
ls -la /usr/local/bin/backup-*.sh
ls -la /usr/local/bin/verify-backups.sh
ls -la /usr/local/bin/test-restore.sh

# Check permissions
stat /usr/local/bin/backup-daily.sh

# Check script syntax
bash -n /usr/local/bin/backup-daily.sh
bash -n /usr/local/bin/backup-weekly.sh
bash -n /usr/local/bin/backup-monthly.sh
bash -n /usr/local/bin/verify-backups.sh
bash -n /usr/local/bin/test-restore.sh
```

**Expected Results:**
- All 5 scripts exist
- All scripts have 755 permissions
- All scripts are executable
- No syntax errors detected

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Test 1.4: AWS Configuration Verification

**Objective:** Verify AWS credentials and S3 bucket are properly configured

**Steps:**
```bash
# Check AWS credentials
aws sts get-caller-identity

# List S3 buckets
aws s3 ls

# Check specific bucket
aws s3 ls s3://ologywood-backups/

# Check bucket encryption
aws s3api get-bucket-encryption --bucket ologywood-backups

# Check bucket versioning
aws s3api get-bucket-versioning --bucket ologywood-backups
```

**Expected Results:**
- AWS credentials are valid
- S3 bucket exists
- Bucket has encryption enabled
- Bucket has versioning enabled
- User can list bucket contents

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Test 1.5: Cron Job Verification

**Objective:** Verify all backup cron jobs are scheduled correctly

**Steps:**
```bash
# List all cron jobs
sudo crontab -l

# Check for backup jobs
sudo crontab -l | grep backup

# Verify cron daemon is running
sudo systemctl status cron
```

**Expected Results:**
- Daily backup scheduled at 2:00 AM UTC
- Weekly backup scheduled at 3:00 AM UTC on Sunday
- Monthly backup scheduled at 4:00 AM UTC on 1st
- Verification scheduled at 5:00 AM UTC daily
- Restore test scheduled at 6:00 AM UTC on 1st Sunday
- Cron daemon is running

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Test 1.6: Log Rotation Verification

**Objective:** Verify log rotation is configured correctly

**Steps:**
```bash
# Check logrotate config
sudo cat /etc/logrotate.d/ologywood-backup

# Test logrotate
sudo logrotate -d /etc/logrotate.d/ologywood-backup

# Check log files
ls -la /var/log/ologywood-backup*.log
```

**Expected Results:**
- Logrotate config file exists
- Daily rotation configured
- 30-day retention configured
- Compression enabled
- Log files exist

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Test 1.7: Email Configuration Verification

**Objective:** Verify email alerts are configured

**Steps:**
```bash
# Check mail utility
which mail
mail --version

# Check SSMTP config (if using)
sudo cat /etc/ssmtp/ssmtp.conf

# Send test email
echo "Test email from backup system" | mail -s "Test Subject" ops@ologywood.com
```

**Expected Results:**
- Mail utility installed
- Email configuration exists
- Test email sent successfully
- Email received within 5 minutes

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Test 1.8: Binary Logging Verification

**Objective:** Verify MySQL binary logging is enabled

**Steps:**
```bash
# Check binary logging status
mysql -u root -p -e "SHOW VARIABLES LIKE 'log_bin%';"

# Check binary logs exist
ls -la /var/log/mysql/mysql-bin.*

# Check binary log format
mysql -u root -p -e "SHOW VARIABLES LIKE 'binlog_format';"
```

**Expected Results:**
- log_bin is ON
- Binary log files exist
- binlog_format is ROW
- Binary logs are being created

**Pass/Fail:** [ ] Pass [ ] Fail

---

## Test 2: Backup Functionality

### Test 2.1: Manual Daily Backup Test

**Objective:** Verify daily backup script works correctly

**Steps:**
```bash
# Run backup script
sudo /usr/local/bin/backup-daily.sh

# Check backup created
ls -lh /backups/daily/ | tail -1

# Check backup size
du -h /backups/daily/ologywood_daily_*.sql.gz | tail -1

# Check backup integrity
gunzip -t /backups/daily/ologywood_daily_*.sql.gz

# Check logs
tail -20 /var/log/ologywood-backup.log
```

**Expected Results:**
- Script completes without errors
- Backup file created in /backups/daily/
- Backup size > 50MB
- Backup integrity check passes
- Log shows successful completion
- S3 upload confirmed in logs

**Pass/Fail:** [ ] Pass [ ] Fail

**Backup File:** _________________ Size: _________

---

### Test 2.2: Backup Verification Test

**Objective:** Verify backup verification script works correctly

**Steps:**
```bash
# Run verification script
sudo /usr/local/bin/verify-backups.sh

# Check logs
tail -30 /var/log/ologywood-backup-verify.log

# Verify output
grep -i "backup verification completed" /var/log/ologywood-backup-verify.log
```

**Expected Results:**
- Script completes without errors
- Latest backup detected
- Backup age < 24 hours
- Backup size > 50MB
- Backup integrity verified
- S3 sync verified
- All checks pass

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Test 2.3: S3 Upload Verification

**Objective:** Verify backups are successfully uploaded to S3

**Steps:**
```bash
# List S3 daily backups
aws s3 ls s3://ologywood-backups/daily/ --region us-east-1

# Check latest backup
aws s3 ls s3://ologywood-backups/daily/ --region us-east-1 | tail -5

# Download and verify
aws s3 cp s3://ologywood-backups/daily/ologywood_daily_latest.sql.gz /tmp/test-restore.sql.gz

# Check integrity
gunzip -t /tmp/test-restore.sql.gz
```

**Expected Results:**
- S3 bucket contains backup files
- Latest backup is recent (< 24 hours old)
- Backup can be downloaded
- Downloaded backup integrity verified
- File size matches local backup

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Test 2.4: Backup Compression Verification

**Objective:** Verify backup compression is working correctly

**Steps:**
```bash
# Get backup file info
BACKUP_FILE=$(ls -t /backups/daily/ologywood_daily_*.sql.gz | head -1)

# Check file size
ls -lh $BACKUP_FILE

# Check compression ratio
gunzip -l $BACKUP_FILE | tail -1

# Calculate compression ratio
COMPRESSED=$(du -b $BACKUP_FILE | cut -f1)
UNCOMPRESSED=$(gunzip -l $BACKUP_FILE | tail -1 | awk '{print $2}')
RATIO=$((UNCOMPRESSED / COMPRESSED))
echo "Compression ratio: $RATIO:1"
```

**Expected Results:**
- Backup file is compressed (.sql.gz)
- Compression ratio > 2:1
- Uncompressed size reasonable
- File integrity maintained

**Pass/Fail:** [ ] Pass [ ] Fail

**Compression Ratio:** _________:1

---

### Test 2.5: Backup Retention Verification

**Objective:** Verify old backups are properly cleaned up

**Steps:**
```bash
# List all backups
ls -la /backups/daily/ | wc -l

# Check backup ages
ls -lh /backups/daily/ | awk '{print $6, $7, $8, $9}'

# Verify no backups older than 7 days
find /backups/daily -name "*.sql.gz" -mtime +7
```

**Expected Results:**
- Daily backups directory contains recent backups only
- No backups older than 7 days
- Approximately 7 backups (one per day)
- Old backups automatically deleted

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Test 2.6: Backup Database Consistency

**Objective:** Verify backup contains consistent data

**Steps:**
```bash
# Get latest backup
BACKUP=$(ls -t /backups/daily/ologywood_daily_*.sql.gz | head -1)

# Extract and check
gunzip -c $BACKUP | head -100 | grep -i "create table"

# Count tables in backup
gunzip -c $BACKUP | grep -c "CREATE TABLE"

# Verify database structure
gunzip -c $BACKUP | grep "USE \`ologywood_prod\`"
```

**Expected Results:**
- Backup contains CREATE TABLE statements
- Backup contains correct database name
- Table count > 10
- Backup structure is valid SQL

**Pass/Fail:** [ ] Pass [ ] Fail

**Table Count:** _________

---

## Test 3: Restore Procedures

### Test 3.1: Full Database Restore Test

**Objective:** Verify full database restore from backup works correctly

**Steps:**
```bash
# Stop application
sudo systemctl stop ologywood

# Get latest backup
BACKUP=$(ls -t /backups/daily/ologywood_daily_*.sql.gz | head -1)

# Create backup of current state
mysqldump -u root -p --all-databases | gzip > /tmp/pre_restore_$(date +%s).sql.gz

# Decompress backup
gunzip -c $BACKUP > /tmp/restore.sql

# Restore database
mysql -u root -p < /tmp/restore.sql

# Verify restoration
mysql -u root -p -e "SELECT COUNT(*) as table_count FROM information_schema.TABLES WHERE TABLE_SCHEMA='ologywood_prod';"

# Start application
sudo systemctl start ologywood

# Verify application
curl -X GET http://localhost:3000/api/trpc/auth.me
```

**Expected Results:**
- Backup decompressed successfully
- Restore completes without errors
- All tables present in database
- Table count > 10
- Application starts successfully
- API endpoints respond

**Pass/Fail:** [ ] Pass [ ] Fail

**Restore Time:** _________ minutes

---

### Test 3.2: Restore Test Script Validation

**Objective:** Verify automated restore test script works

**Steps:**
```bash
# Run restore test
sudo /usr/local/bin/test-restore.sh

# Check logs
tail -50 /var/log/ologywood-restore-test.log

# Verify test database was cleaned up
mysql -u root -p -e "SHOW DATABASES LIKE 'ologywood_test_%';"
```

**Expected Results:**
- Script completes without errors
- Test database created
- Backup restored to test database
- All tables present
- Record counts verified
- Test database cleaned up
- Log shows PASSED status

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Test 3.3: Point-in-Time Recovery Test

**Objective:** Verify point-in-time recovery capability

**Steps:**
```bash
# Get current time
CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')
echo "Current time: $CURRENT_TIME"

# Create test data
mysql -u root -p ologywood_prod -e "INSERT INTO bookings (artistId, venueId, bookingDate) VALUES (1, 1, NOW());"

# Get binary log position
mysql -u root -p -e "SHOW MASTER STATUS;"

# List binary logs
mysql -u root -p -e "SHOW BINARY LOGS;"

# Extract binary logs
BINARY_LOG_DIR="/var/log/mysql"
ls -la $BINARY_LOG_DIR/mysql-bin.*
```

**Expected Results:**
- Binary logs are being created
- Can identify binary log files
- Can extract binary log information
- Binary log position available
- Test data inserted successfully

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Test 3.4: Restore Specific Table Test

**Objective:** Verify single table restore works

**Steps:**
```bash
# Get latest backup
BACKUP=$(ls -t /backups/daily/ologywood_daily_*.sql.gz | head -1)

# Decompress
gunzip -c $BACKUP > /tmp/full_backup.sql

# Extract specific table (example: bookings)
sed -n '/^CREATE TABLE.*bookings/,/^CREATE TABLE/p' /tmp/full_backup.sql > /tmp/bookings_table.sql

# Backup current table
mysqldump -u root -p ologywood_prod bookings > /tmp/bookings_current_backup.sql

# Drop table
mysql -u root -p ologywood_prod -e "DROP TABLE bookings;"

# Restore table
mysql -u root -p ologywood_prod < /tmp/bookings_table.sql

# Verify restoration
mysql -u root -p ologywood_prod -e "SELECT COUNT(*) as bookings FROM bookings;"

# Restore current state
mysql -u root -p ologywood_prod < /tmp/bookings_current_backup.sql
```

**Expected Results:**
- Table extracted from backup
- Table dropped successfully
- Table restored from backup
- Record count matches
- Table structure correct
- Current state restored

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Test 3.5: Restore to New Server Simulation

**Objective:** Verify restore to new server works (using test database)

**Steps:**
```bash
# Get latest backup
BACKUP=$(ls -t /backups/daily/ologywood_daily_*.sql.gz | head -1)

# Create test database
TEST_DB="ologywood_new_server_test"
mysql -u root -p -e "CREATE DATABASE $TEST_DB;"

# Decompress and restore
gunzip -c $BACKUP | mysql -u root -p $TEST_DB

# Verify restoration
mysql -u root -p -e "SELECT COUNT(*) as table_count FROM information_schema.TABLES WHERE TABLE_SCHEMA='$TEST_DB';"

# Check record counts
mysql -u root -p $TEST_DB -e "SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES ORDER BY TABLE_ROWS DESC LIMIT 10;"

# Cleanup
mysql -u root -p -e "DROP DATABASE $TEST_DB;"
```

**Expected Results:**
- Test database created
- Backup restored successfully
- All tables present
- Record counts reasonable
- Database structure intact
- Test database cleaned up

**Pass/Fail:** [ ] Pass [ ] Fail

---

## Test 4: Monitoring & Alerts

### Test 4.1: Email Alert Test

**Objective:** Verify email alerts are working

**Steps:**
```bash
# Send test email
echo "This is a test alert from Ologywood backup system" | \
  mail -s "Test Alert: Ologywood Backup" ops@ologywood.com

# Check email received
# (Check email inbox within 5 minutes)
```

**Expected Results:**
- Email sent successfully
- Email received within 5 minutes
- Subject line correct
- Message content correct
- Email from correct sender

**Pass/Fail:** [ ] Pass [ ] Fail

**Email Received:** [ ] Yes [ ] No

---

### Test 4.2: Health Check Script Test

**Objective:** Verify health check script works correctly

**Steps:**
```bash
# Run health check
sudo /usr/local/bin/backup-health-check.sh

# Check output
cat /tmp/health-check.txt

# Verify all checks pass
grep "✅" /tmp/health-check.txt | wc -l
```

**Expected Results:**
- Script completes without errors
- All health checks pass
- No critical issues
- No warnings
- Summary shows 0 issues

**Pass/Fail:** [ ] Pass [ ] Fail

**Issues Found:** _________

---

### Test 4.3: Log Monitoring Test

**Objective:** Verify backup logs are being created and monitored

**Steps:**
```bash
# Check log files exist
ls -la /var/log/ologywood-backup*.log

# Check log content
tail -20 /var/log/ologywood-backup.log

# Check for errors
grep -i error /var/log/ologywood-backup.log | wc -l

# Check log rotation
ls -la /var/log/ologywood-backup*.log.* 2>/dev/null | head -5
```

**Expected Results:**
- Log files exist and are being written
- Recent entries show successful backups
- No error messages
- Log rotation configured
- Old logs compressed

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Test 4.4: Monitoring Dashboard Test

**Objective:** Verify monitoring dashboard displays correctly (if configured)

**Steps:**
```bash
# Check Grafana (if installed)
curl -s http://localhost:3000/api/health | jq .

# Check metrics
# Navigate to Grafana dashboard
# Verify panels display correctly
# Verify data is current
```

**Expected Results:**
- Dashboard accessible
- Panels display correctly
- Metrics are current
- No data gaps
- Alerts configured

**Pass/Fail:** [ ] Pass [ ] Fail

---

## Test 5: Performance Tests

### Test 5.1: Backup Performance Test

**Objective:** Verify backup completes within acceptable time

**Steps:**
```bash
# Measure backup time
START=$(date +%s)
sudo /usr/local/bin/backup-daily.sh
END=$(date +%s)
DURATION=$((END - START))

echo "Backup duration: $DURATION seconds ($(($DURATION / 60)) minutes)"

# Check backup size
du -h /backups/daily/ologywood_daily_*.sql.gz | tail -1

# Calculate throughput
BACKUP_SIZE=$(du -b /backups/daily/ologywood_daily_*.sql.gz | tail -1 | cut -f1)
THROUGHPUT=$((BACKUP_SIZE / DURATION / 1024 / 1024))
echo "Throughput: ${THROUGHPUT}MB/s"
```

**Expected Results:**
- Backup completes in < 15 minutes
- Backup size > 50MB
- Throughput > 5MB/s
- No performance issues

**Pass/Fail:** [ ] Pass [ ] Fail

**Backup Duration:** _________ minutes

**Throughput:** _________MB/s

---

### Test 5.2: Restore Performance Test

**Objective:** Verify restore completes within acceptable time

**Steps:**
```bash
# Measure restore time
BACKUP=$(ls -t /backups/daily/ologywood_daily_*.sql.gz | head -1)

# Create test database
TEST_DB="ologywood_perf_test"
mysql -u root -p -e "CREATE DATABASE $TEST_DB;"

# Measure restore
START=$(date +%s)
gunzip -c $BACKUP | mysql -u root -p $TEST_DB
END=$(date +%s)
DURATION=$((END - START))

echo "Restore duration: $DURATION seconds ($(($DURATION / 60)) minutes)"

# Cleanup
mysql -u root -p -e "DROP DATABASE $TEST_DB;"
```

**Expected Results:**
- Restore completes in < 20 minutes
- No errors during restore
- Database integrity maintained
- Acceptable performance

**Pass/Fail:** [ ] Pass [ ] Fail

**Restore Duration:** _________ minutes

---

### Test 5.3: Disk I/O Performance Test

**Objective:** Verify disk I/O performance is acceptable

**Steps:**
```bash
# Check disk usage
df -h /backups/

# Check I/O stats
iostat -x 1 5

# Monitor during backup
iotop -b -n 1 -o
```

**Expected Results:**
- Disk space available > 500GB
- I/O utilization reasonable
- No disk errors
- Performance acceptable

**Pass/Fail:** [ ] Pass [ ] Fail

---

## Test Summary

### Configuration Tests
| Test | Result | Notes |
|------|--------|-------|
| 1.1 MySQL User | [ ] Pass [ ] Fail | __________ |
| 1.2 Directories | [ ] Pass [ ] Fail | __________ |
| 1.3 Scripts | [ ] Pass [ ] Fail | __________ |
| 1.4 AWS Config | [ ] Pass [ ] Fail | __________ |
| 1.5 Cron Jobs | [ ] Pass [ ] Fail | __________ |
| 1.6 Log Rotation | [ ] Pass [ ] Fail | __________ |
| 1.7 Email Config | [ ] Pass [ ] Fail | __________ |
| 1.8 Binary Logging | [ ] Pass [ ] Fail | __________ |

### Backup Tests
| Test | Result | Notes |
|------|--------|-------|
| 2.1 Daily Backup | [ ] Pass [ ] Fail | __________ |
| 2.2 Verification | [ ] Pass [ ] Fail | __________ |
| 2.3 S3 Upload | [ ] Pass [ ] Fail | __________ |
| 2.4 Compression | [ ] Pass [ ] Fail | __________ |
| 2.5 Retention | [ ] Pass [ ] Fail | __________ |
| 2.6 Consistency | [ ] Pass [ ] Fail | __________ |

### Restore Tests
| Test | Result | Notes |
|------|--------|-------|
| 3.1 Full Restore | [ ] Pass [ ] Fail | __________ |
| 3.2 Test Script | [ ] Pass [ ] Fail | __________ |
| 3.3 PITR | [ ] Pass [ ] Fail | __________ |
| 3.4 Table Restore | [ ] Pass [ ] Fail | __________ |
| 3.5 New Server | [ ] Pass [ ] Fail | __________ |

### Monitoring Tests
| Test | Result | Notes |
|------|--------|-------|
| 4.1 Email Alerts | [ ] Pass [ ] Fail | __________ |
| 4.2 Health Check | [ ] Pass [ ] Fail | __________ |
| 4.3 Log Monitoring | [ ] Pass [ ] Fail | __________ |
| 4.4 Dashboard | [ ] Pass [ ] Fail | __________ |

### Performance Tests
| Test | Result | Notes |
|------|--------|-------|
| 5.1 Backup Perf | [ ] Pass [ ] Fail | __________ |
| 5.2 Restore Perf | [ ] Pass [ ] Fail | __________ |
| 5.3 Disk I/O | [ ] Pass [ ] Fail | __________ |

---

## Overall Test Results

**Total Tests:** 26  
**Tests Passed:** _____ / 26  
**Tests Failed:** _____ / 26  
**Pass Rate:** _____%

**Status:** [ ] READY FOR PRODUCTION [ ] NEEDS FIXES [ ] BLOCKED

---

## Issues Found

| Issue # | Description | Severity | Status | Notes |
|---------|-------------|----------|--------|-------|
| 1 | _________________ | [ ] Critical [ ] High [ ] Medium [ ] Low | [ ] Open [ ] Fixed | __________ |
| 2 | _________________ | [ ] Critical [ ] High [ ] Medium [ ] Low | [ ] Open [ ] Fixed | __________ |
| 3 | _________________ | [ ] Critical [ ] High [ ] Medium [ ] Low | [ ] Open [ ] Fixed | __________ |

---

## Sign-Off

**Test Executed By:** _________________ Date: _______

**Test Reviewed By:** _________________ Date: _______

**Approved For Production:** [ ] Yes [ ] No

**Comments:**
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

**Last Updated:** February 19, 2026  
**Version:** 1.0  
**Status:** Ready for Execution

