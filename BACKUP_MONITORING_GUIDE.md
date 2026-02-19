# Ologywood - Backup Monitoring & Alerting Guide

**Version:** 1.0  
**Last Updated:** February 19, 2026  
**Purpose:** Setup monitoring and alerting for backup system

---

## Overview

This guide covers setting up comprehensive monitoring and alerting for the Ologywood backup system to ensure backups complete successfully and issues are detected immediately.

---

## 1. Cron Job Setup

### Schedule Backup Jobs

**Edit crontab:**
```bash
sudo crontab -e
```

**Add the following entries:**
```cron
# Daily backup at 2:00 AM UTC
0 2 * * * /usr/local/bin/backup-daily.sh >> /var/log/ologywood-backup.log 2>&1

# Weekly backup every Sunday at 3:00 AM UTC
0 3 * * 0 /usr/local/bin/backup-weekly.sh >> /var/log/ologywood-backup.log 2>&1

# Monthly backup on 1st at 4:00 AM UTC
0 4 1 * * /usr/local/bin/backup-monthly.sh >> /var/log/ologywood-backup.log 2>&1

# Backup verification daily at 5:00 AM UTC
0 5 * * * /usr/local/bin/verify-backups.sh >> /var/log/ologywood-backup-verify.log 2>&1

# Monthly restore test (first Sunday at 6:00 AM UTC)
0 6 1-7 * 0 /usr/local/bin/test-restore.sh >> /var/log/ologywood-restore-test.log 2>&1
```

**Make scripts executable:**
```bash
sudo chmod +x /usr/local/bin/backup-*.sh
sudo chmod +x /usr/local/bin/verify-backups.sh
sudo chmod +x /usr/local/bin/test-restore.sh
```

**Verify cron jobs:**
```bash
sudo crontab -l
```

---

## 2. Log Monitoring

### Setup Log Rotation

**Create logrotate configuration** (`/etc/logrotate.d/ologywood-backup`):
```
/var/log/ologywood-backup*.log
/var/log/ologywood-restore-test.log
{
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}
```

### Monitor Backup Logs

**View latest backup logs:**
```bash
# Daily backup log
tail -f /var/log/ologywood-backup.log

# Verification log
tail -f /var/log/ologywood-backup-verify.log

# Restore test log
tail -f /var/log/ologywood-restore-test.log
```

**Search for errors:**
```bash
# Find all errors
grep -i error /var/log/ologywood-backup.log

# Find recent errors (last 24 hours)
find /var/log -name "ologywood-backup*.log" -mtime -1 -exec grep -i error {} +

# Count errors by type
grep -i error /var/log/ologywood-backup.log | cut -d: -f3 | sort | uniq -c
```

---

## 3. Email Alerts

### Configure Email Notifications

**Install mail utilities:**
```bash
sudo apt update
sudo apt install mailutils ssmtp
```

**Configure SSMTP** (`/etc/ssmtp/ssmtp.conf`):
```
root=ops@ologywood.com
mailhub=smtp.gmail.com:587
AuthUser=your-email@gmail.com
AuthPass=your-app-password
UseSTARTTLS=YES
```

### Alert Script

**Create alert wrapper** (`/usr/local/bin/backup-with-alerts.sh`):
```bash
#!/bin/bash

BACKUP_SCRIPT="/usr/local/bin/backup-daily.sh"
ALERT_EMAIL="ops@ologywood.com"
LOG_FILE="/var/log/ologywood-backup.log"

# Run backup
$BACKUP_SCRIPT

# Check exit code
if [ $? -eq 0 ]; then
  echo "Daily backup completed successfully at $(date)" | \
    mail -s "Ologywood Backup Success" "$ALERT_EMAIL"
else
  # Get last 50 lines of log
  tail -50 "$LOG_FILE" | \
    mail -s "ALERT: Ologywood Backup Failed" "$ALERT_EMAIL"
fi
```

**Update crontab to use wrapper:**
```cron
0 2 * * * /usr/local/bin/backup-with-alerts.sh
```

---

## 4. CloudWatch Monitoring (AWS)

### Create CloudWatch Alarms

**Backup Age Alarm:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name ologywood-backup-age \
  --alarm-description "Alert if backup is older than 24 hours" \
  --metric-name BackupAge \
  --namespace Ologywood \
  --statistic Maximum \
  --period 3600 \
  --threshold 24 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:123456789:ologywood-alerts
```

**Backup Size Alarm:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name ologywood-backup-size \
  --alarm-description "Alert if backup size is too small" \
  --metric-name BackupSize \
  --namespace Ologywood \
  --statistic Minimum \
  --period 3600 \
  --threshold 52428800 \
  --comparison-operator LessThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:123456789:ologywood-alerts
```

**S3 Upload Alarm:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name ologywood-s3-upload \
  --alarm-description "Alert if S3 upload fails" \
  --metric-name S3UploadFailures \
  --namespace Ologywood \
  --statistic Sum \
  --period 3600 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --alarm-actions arn:aws:sns:us-east-1:123456789:ologywood-alerts
```

### Create SNS Topic for Alerts

```bash
# Create SNS topic
aws sns create-topic --name ologywood-alerts --region us-east-1

# Subscribe email to topic
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789:ologywood-alerts \
  --protocol email \
  --notification-endpoint ops@ologywood.com
```

---

## 5. Datadog Monitoring

### Install Datadog Agent

```bash
DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=your-api-key \
DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_agent.sh)"
```

### Configure Custom Metrics

**Create Datadog configuration** (`/etc/datadog-agent/conf.d/ologywood.d/conf.yaml`):
```yaml
logs:
  - type: file
    path: /var/log/ologywood-backup.log
    service: ologywood
    source: backup
    tags:
      - env:production
      - service:backup

  - type: file
    path: /var/log/ologywood-backup-verify.log
    service: ologywood
    source: verification
    tags:
      - env:production
      - service:backup

custom_metrics:
  - name: ologywood.backup.age
    type: gauge
    unit: hours
    
  - name: ologywood.backup.size
    type: gauge
    unit: bytes
    
  - name: ologywood.backup.success
    type: count
    unit: 1
```

### Create Datadog Monitors

**Monitor for backup failures:**
```
Metric: ologywood.backup.success
Alert if: count < 1 in the last 24 hours
Severity: Critical
```

**Monitor for backup age:**
```
Metric: ologywood.backup.age
Alert if: > 24 hours
Severity: Warning
```

---

## 6. Grafana Dashboards

### Install Grafana

```bash
sudo apt update
sudo apt install grafana-server

sudo systemctl start grafana-server
sudo systemctl enable grafana-server
```

### Create Dashboard

**Access Grafana:** http://localhost:3000 (default: admin/admin)

**Create panels:**

1. **Backup Success Rate**
   - Query: `rate(ologywood_backup_success[24h])`
   - Type: Gauge

2. **Backup Age**
   - Query: `ologywood_backup_age`
   - Type: Graph

3. **Backup Size Trend**
   - Query: `ologywood_backup_size`
   - Type: Graph

4. **S3 Upload Status**
   - Query: `ologywood_s3_upload_failures`
   - Type: Stat

---

## 7. Health Check Script

**Create health check** (`/usr/local/bin/backup-health-check.sh`):
```bash
#!/bin/bash

BACKUP_DIR="/backups/daily"
ALERT_EMAIL="ops@ologywood.com"
ISSUES=0

echo "=== Ologywood Backup Health Check ===" > /tmp/health-check.txt
echo "Timestamp: $(date)" >> /tmp/health-check.txt
echo "" >> /tmp/health-check.txt

# Check 1: Latest backup exists
LATEST=$(ls -t "$BACKUP_DIR"/ologywood_daily_*.sql.gz 2>/dev/null | head -1)
if [ -z "$LATEST" ]; then
  echo "❌ CRITICAL: No backup found" >> /tmp/health-check.txt
  ISSUES=$((ISSUES + 1))
else
  echo "✅ Latest backup: $(basename "$LATEST")" >> /tmp/health-check.txt
fi

# Check 2: Backup age
if [ ! -z "$LATEST" ]; then
  AGE=$(($(date +%s) - $(stat -c %Y "$LATEST")) / 3600))
  if [ $AGE -gt 25 ]; then
    echo "❌ WARNING: Backup is $AGE hours old" >> /tmp/health-check.txt
    ISSUES=$((ISSUES + 1))
  else
    echo "✅ Backup age: $AGE hours" >> /tmp/health-check.txt
  fi
fi

# Check 3: Backup size
if [ ! -z "$LATEST" ]; then
  SIZE=$(du -b "$LATEST" | cut -f1)
  SIZE_MB=$((SIZE / 1048576))
  if [ $SIZE_MB -lt 50 ]; then
    echo "❌ WARNING: Backup size is ${SIZE_MB}MB (expected > 50MB)" >> /tmp/health-check.txt
    ISSUES=$((ISSUES + 1))
  else
    echo "✅ Backup size: ${SIZE_MB}MB" >> /tmp/health-check.txt
  fi
fi

# Check 4: Disk space
AVAILABLE=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
AVAILABLE_MB=$((AVAILABLE / 1024))
if [ $AVAILABLE_MB -lt 500 ]; then
  echo "❌ WARNING: Low disk space (${AVAILABLE_MB}MB available)" >> /tmp/health-check.txt
  ISSUES=$((ISSUES + 1))
else
  echo "✅ Disk space: ${AVAILABLE_MB}MB available" >> /tmp/health-check.txt
fi

# Check 5: S3 sync
S3_COUNT=$(aws s3 ls s3://ologywood-backups/daily/ --region us-east-1 2>/dev/null | wc -l)
if [ $S3_COUNT -eq 0 ]; then
  echo "❌ CRITICAL: No backups in S3" >> /tmp/health-check.txt
  ISSUES=$((ISSUES + 1))
else
  echo "✅ S3 backups: $S3_COUNT files" >> /tmp/health-check.txt
fi

echo "" >> /tmp/health-check.txt
echo "=== Summary ===" >> /tmp/health-check.txt
echo "Total Issues: $ISSUES" >> /tmp/health-check.txt

# Send email if issues found
if [ $ISSUES -gt 0 ]; then
  cat /tmp/health-check.txt | \
    mail -s "⚠️ Ologywood Backup Health Check - $ISSUES Issues" "$ALERT_EMAIL"
fi

cat /tmp/health-check.txt
```

**Schedule health check:**
```bash
# Run every 6 hours
0 */6 * * * /usr/local/bin/backup-health-check.sh
```

---

## 8. Slack Integration

### Setup Slack Webhook

**Create Slack webhook:**
1. Go to https://api.slack.com/apps
2. Create new app
3. Enable Incoming Webhooks
4. Create new webhook URL
5. Copy webhook URL

**Create Slack alert script** (`/usr/local/bin/backup-slack-alert.sh`):
```bash
#!/bin/bash

WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
BACKUP_DIR="/backups/daily"
LATEST=$(ls -t "$BACKUP_DIR"/ologywood_daily_*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST" ]; then
  MESSAGE="🚨 *Backup Alert*: No backup found"
  COLOR="danger"
else
  AGE=$(($(date +%s) - $(stat -c %Y "$LATEST")) / 3600))
  SIZE=$(du -h "$LATEST" | cut -f1)
  
  if [ $AGE -gt 25 ]; then
    MESSAGE="⚠️ *Backup Alert*: Backup is $AGE hours old"
    COLOR="warning"
  else
    MESSAGE="✅ *Backup Status*: OK ($SIZE, $AGE hours old)"
    COLOR="good"
  fi
fi

# Send to Slack
curl -X POST -H 'Content-type: application/json' \
  --data "{
    \"attachments\": [{
      \"color\": \"$COLOR\",
      \"title\": \"Ologywood Backup Status\",
      \"text\": \"$MESSAGE\",
      \"ts\": $(date +%s)
    }]
  }" \
  "$WEBHOOK_URL"
```

---

## 9. Monitoring Dashboard Summary

### Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **Backup Completion** | Daily | > 24 hours without backup |
| **Backup Size** | > 50MB | < 50MB |
| **Backup Age** | < 24 hours | > 25 hours |
| **Disk Space** | > 500MB | < 500MB |
| **S3 Sync** | 100% | 0 backups in S3 |
| **Restore Test** | Monthly | Failed restore test |
| **Backup Integrity** | 100% | Failed integrity check |

### Alert Severity Levels

| Level | Condition | Action |
|-------|-----------|--------|
| **CRITICAL** | No backup exists | Page on-call engineer |
| **CRITICAL** | S3 upload failed | Page on-call engineer |
| **WARNING** | Backup > 24 hours old | Email ops team |
| **WARNING** | Backup < 50MB | Email ops team |
| **WARNING** | Disk space < 500MB | Email ops team |
| **INFO** | Backup successful | Log only |

---

## 10. Troubleshooting Alerts

### Alert: "No backup found"
**Check:**
```bash
# Verify backup directory exists
ls -la /backups/daily/

# Check cron job
sudo crontab -l

# Check backup logs
tail -100 /var/log/ologywood-backup.log

# Run backup manually
sudo /usr/local/bin/backup-daily.sh
```

### Alert: "Backup size too small"
**Check:**
```bash
# Verify database size
mysql -u root -p -e "SELECT SUM(data_length + index_length) / 1024 / 1024 as size_mb FROM information_schema.TABLES WHERE TABLE_SCHEMA='ologywood_prod';"

# Check backup compression
gunzip -l /backups/daily/ologywood_daily_*.sql.gz | tail -1
```

### Alert: "S3 upload failed"
**Check:**
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check S3 bucket
aws s3 ls s3://ologywood-backups/

# Check IAM permissions
aws iam get-user-policy --user-name backup-user --policy-name S3BackupPolicy
```

---

## Maintenance Schedule

### Daily
- [ ] Review backup logs
- [ ] Check backup completion
- [ ] Verify S3 uploads

### Weekly
- [ ] Review all alerts
- [ ] Check disk space
- [ ] Verify backup integrity

### Monthly
- [ ] Run restore test
- [ ] Review monitoring configuration
- [ ] Update alert thresholds if needed

### Quarterly
- [ ] Review and update monitoring strategy
- [ ] Test alert notifications
- [ ] Conduct disaster recovery drill

---

**Last Updated:** February 19, 2026  
**Version:** 1.0  
**Status:** Ready for Implementation

