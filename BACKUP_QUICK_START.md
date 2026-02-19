# Ologywood - Backup Setup Quick Start Guide

**Version:** 1.0  
**Last Updated:** February 19, 2026  
**Time to Complete:** 30 minutes  
**Difficulty:** Intermediate

---

## Overview

This quick start guide will get your backup system up and running in 30 minutes. For detailed information, see the full `DATABASE_BACKUP_STRATEGY.md`.

---

## Step 1: Install Required Tools (5 minutes)

```bash
# Update package manager
sudo apt update

# Install MySQL tools (if not already installed)
sudo apt install mysql-server

# Install AWS CLI
sudo apt install awscli

# Verify installations
mysql --version
aws --version
```

---

## Step 2: Create Backup User (3 minutes)

```bash
# Connect to MySQL
mysql -u root -p

# Create backup user
CREATE USER 'backup_user'@'localhost' IDENTIFIED BY 'secure_backup_password';

# Grant permissions
GRANT SELECT, LOCK TABLES, SHOW VIEW, RELOAD, REPLICATION CLIENT ON *.* TO 'backup_user'@'localhost';

# Apply changes
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

---

## Step 3: Create Backup Directory (2 minutes)

```bash
# Create directories
sudo mkdir -p /backups/daily
sudo mkdir -p /backups/weekly
sudo mkdir -p /backups/monthly

# Set permissions
sudo chmod 700 /backups/daily
sudo chmod 700 /backups/weekly
sudo chmod 700 /backups/monthly

# Verify
ls -la /backups/
```

---

## Step 4: Copy Backup Scripts (3 minutes)

The backup scripts are already created in `/home/ubuntu/ologywood/scripts/`:

```bash
# Copy scripts to system location
sudo cp /home/ubuntu/ologywood/scripts/backup-daily.sh /usr/local/bin/
sudo cp /home/ubuntu/ologywood/scripts/backup-weekly.sh /usr/local/bin/
sudo cp /home/ubuntu/ologywood/scripts/backup-monthly.sh /usr/local/bin/
sudo cp /home/ubuntu/ologywood/scripts/verify-backups.sh /usr/local/bin/
sudo cp /home/ubuntu/ologywood/scripts/test-restore.sh /usr/local/bin/

# Make executable
sudo chmod +x /usr/local/bin/backup-*.sh
sudo chmod +x /usr/local/bin/verify-backups.sh
sudo chmod +x /usr/local/bin/test-restore.sh

# Verify
ls -la /usr/local/bin/backup-*.sh
```

---

## Step 5: Configure AWS S3 (5 minutes)

```bash
# Configure AWS credentials
aws configure
# Enter: AWS Access Key ID
# Enter: AWS Secret Access Key
# Enter: Default region (us-east-1)
# Enter: Default output format (json)

# Create S3 bucket
aws s3 mb s3://ologywood-backups --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket ologywood-backups \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket ologywood-backups \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Verify
aws s3 ls s3://ologywood-backups/
```

---

## Step 6: Test Backup Script (3 minutes)

```bash
# Run backup manually to test
sudo /usr/local/bin/backup-daily.sh

# Check backup was created
ls -lh /backups/daily/

# Check logs
tail -20 /var/log/ologywood-backup.log

# Verify S3 upload
aws s3 ls s3://ologywood-backups/daily/
```

---

## Step 7: Schedule Backup Jobs (3 minutes)

```bash
# Edit crontab
sudo crontab -e

# Add these lines:
0 2 * * * /usr/local/bin/backup-daily.sh >> /var/log/ologywood-backup.log 2>&1
0 3 * * 0 /usr/local/bin/backup-weekly.sh >> /var/log/ologywood-backup.log 2>&1
0 4 1 * * /usr/local/bin/backup-monthly.sh >> /var/log/ologywood-backup.log 2>&1
0 5 * * * /usr/local/bin/verify-backups.sh >> /var/log/ologywood-backup-verify.log 2>&1

# Verify cron jobs
sudo crontab -l
```

---

## Step 8: Setup Log Rotation (2 minutes)

```bash
# Create logrotate config
sudo tee /etc/logrotate.d/ologywood-backup > /dev/null << 'EOF'
/var/log/ologywood-backup*.log
/var/log/ologywood-restore-test.log
{
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 root root
}
EOF

# Test logrotate
sudo logrotate -d /etc/logrotate.d/ologywood-backup
```

---

## Step 9: Setup Email Alerts (3 minutes)

```bash
# Install mail utility
sudo apt install mailutils

# Test email
echo "Test email" | mail -s "Test Subject" your-email@example.com

# Update scripts with your email
# Edit: /usr/local/bin/verify-backups.sh
# Change: ALERT_EMAIL="ops@ologywood.com"
```

---

## Step 10: Verify Setup (2 minutes)

```bash
# Check all components
echo "=== Backup System Status ==="

# 1. Check backup directory
echo "1. Backup directory:"
ls -lh /backups/daily/ | head -5

# 2. Check backup scripts
echo "2. Backup scripts:"
ls -la /usr/local/bin/backup-*.sh

# 3. Check cron jobs
echo "3. Cron jobs:"
sudo crontab -l | grep backup

# 4. Check S3 bucket
echo "4. S3 backups:"
aws s3 ls s3://ologywood-backups/daily/ | head -5

# 5. Check backup user
echo "5. Backup user:"
mysql -u root -p -e "SELECT user, host FROM mysql.user WHERE user='backup_user';"

echo "=== Setup Complete ==="
```

---

## Quick Commands Reference

```bash
# Manual backup
sudo /usr/local/bin/backup-daily.sh

# View backup logs
tail -f /var/log/ologywood-backup.log

# List backups
ls -lh /backups/daily/

# Check backup size
du -sh /backups/daily/

# List S3 backups
aws s3 ls s3://ologywood-backups/daily/

# Verify backup integrity
gunzip -t /backups/daily/ologywood_daily_*.sql.gz

# Download backup from S3
aws s3 cp s3://ologywood-backups/daily/backup.sql.gz .

# Restore backup
gunzip -c backup.sql.gz | mysql -u root -p

# Check cron jobs
sudo crontab -l

# View backup logs
sudo tail -100 /var/log/ologywood-backup.log
```

---

## Troubleshooting

### Backup fails with "Permission denied"
```bash
# Check directory permissions
ls -la /backups/

# Fix permissions
sudo chmod 755 /backups/daily
sudo chown root:root /backups/daily
```

### AWS CLI not found
```bash
# Reinstall AWS CLI
sudo apt remove awscli
sudo apt install awscli

# Or use pip
sudo pip3 install awscli
```

### MySQL connection fails
```bash
# Verify MySQL is running
sudo systemctl status mysql

# Check backup user
mysql -u root -p -e "SELECT user FROM mysql.user WHERE user='backup_user';"

# Test backup user connection
mysql -u backup_user -p -e "SELECT 1;"
```

### S3 upload fails
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check S3 bucket exists
aws s3 ls s3://ologywood-backups/

# Check IAM permissions
aws iam get-user-policy --user-name your-user --policy-name S3BackupPolicy
```

---

## Next Steps

After completing this quick start:

1. **Wait for first backup** - Scheduled for 2:00 AM UTC
2. **Monitor logs** - Check `/var/log/ologywood-backup.log`
3. **Test restore** - Run `sudo /usr/local/bin/test-restore.sh`
4. **Setup monitoring** - Follow `BACKUP_MONITORING_GUIDE.md`
5. **Read full documentation** - See `DATABASE_BACKUP_STRATEGY.md`

---

## Support

For detailed information:
- **Backup Strategy:** `DATABASE_BACKUP_STRATEGY.md`
- **Restore Procedures:** `RESTORE_PROCEDURES_RUNBOOK.md`
- **Monitoring:** `BACKUP_MONITORING_GUIDE.md`

---

**Last Updated:** February 19, 2026  
**Version:** 1.0  
**Status:** Ready for Implementation

