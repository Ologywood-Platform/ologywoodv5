# Ologywood Disaster Recovery Plan

## Overview

This document outlines the disaster recovery procedures for the Ologywood platform, including backup strategies, recovery procedures, and business continuity measures.

## Backup Strategy

### Backup Types

**Full Backups**

Full backups capture the entire database state and are performed weekly on Sundays at 3:00 AM. These backups serve as the baseline for recovery operations and are retained for 30 days.

**Incremental Backups**

Incremental backups capture only changes since the last backup and are performed daily at 2:00 AM. These backups are more efficient in terms of storage and network bandwidth but require the full backup for complete recovery.

### Backup Retention Policy

The platform maintains the following retention schedule:

| Backup Type | Frequency | Retention | Purpose |
|---|---|---|---|
| Full Backup | Weekly (Sunday 3 AM) | 30 days | Complete recovery baseline |
| Incremental | Daily (2 AM) | 30 days | Point-in-time recovery |
| Archive | Monthly | 1 year | Long-term compliance and audit |
| Off-site | Weekly | 90 days | Disaster recovery site |

### Backup Verification

Automated backup verification occurs every Monday at 4:00 AM to ensure backup integrity:

```bash
# Manual verification
/home/ubuntu/ologywood/scripts/backup-database.sh verify /backups/ologywood/backup_file.sql.gz

# View backup statistics
/home/ubuntu/ologywood/scripts/backup-database.sh stats
```

## Recovery Procedures

### Point-in-Time Recovery

To recover the database to a specific point in time:

```bash
# 1. Restore the most recent full backup
/home/ubuntu/ologywood/scripts/backup-database.sh restore /backups/ologywood/full_2026-01-12_030000.sql.gz

# 2. Apply incremental backups in order
/home/ubuntu/ologywood/scripts/backup-database.sh restore /backups/ologywood/incremental_2026-01-13_020000.sql.gz
/home/ubuntu/ologywood/scripts/backup-database.sh restore /backups/ologywood/incremental_2026-01-14_020000.sql.gz
```

### Complete Database Recovery

For complete database recovery from a full backup:

```bash
# 1. Stop the application
pm2 stop ologywood

# 2. Create a backup of current database (for analysis)
mysqldump -u ologywood_app -p ologywood_prod > /backups/current_state_$(date +%s).sql

# 3. Restore from backup
/home/ubuntu/ologywood/scripts/backup-database.sh restore /backups/ologywood/full_2026-01-12_030000.sql.gz

# 4. Verify database integrity
mysql -u ologywood_app -p ologywood_prod -e "CHECK TABLE \`bookings\`, \`messages\`, \`reviews\`;"

# 5. Restart application
pm2 start ologywood
```

### Partial Recovery

To recover specific tables:

```bash
# 1. Extract specific table from backup
gunzip -c /backups/ologywood/full_2026-01-12_030000.sql.gz | grep "^CREATE TABLE \`bookings\`" -A 100 > bookings_table.sql

# 2. Drop corrupted table
mysql -u ologywood_app -p ologywood_prod -e "DROP TABLE bookings;"

# 3. Restore table from backup
mysql -u ologywood_app -p ologywood_prod < bookings_table.sql

# 4. Verify table
mysql -u ologywood_app -p ologywood_prod -e "SELECT COUNT(*) FROM bookings;"
```

## Disaster Scenarios

### Scenario 1: Database Corruption

**Symptoms**: Application errors, data inconsistencies, failed queries

**Recovery Steps**:

1. Identify the corruption time window
2. Restore from the most recent backup before corruption
3. Verify data integrity with checksums
4. Monitor application for errors
5. If successful, retain corrupted backup for forensics

**Recovery Time**: 15-30 minutes

### Scenario 2: Data Loss

**Symptoms**: Missing records, deleted tables, incomplete data

**Recovery Steps**:

1. Identify when data was lost
2. Restore from backup before loss occurred
3. Compare recovered data with current state
4. Merge recovered data if needed
5. Notify affected users

**Recovery Time**: 30-60 minutes

### Scenario 3: Server Failure

**Symptoms**: Application offline, database unreachable

**Recovery Steps**:

1. Provision new server with same specifications
2. Install MySQL and dependencies
3. Restore latest backup to new server
4. Update application configuration
5. Verify connectivity and data
6. Failover DNS/load balancer
7. Monitor for issues

**Recovery Time**: 1-2 hours

### Scenario 4: Ransomware/Malicious Activity

**Symptoms**: Encrypted files, unauthorized access, suspicious queries

**Recovery Steps**:

1. Immediately isolate affected systems
2. Preserve evidence for forensics
3. Restore from clean backup (before infection)
4. Verify backup integrity
5. Scan all systems for malware
6. Update security policies
7. Monitor for re-infection

**Recovery Time**: 2-4 hours

## Business Continuity

### Recovery Time Objective (RTO)

The target recovery time for different scenarios:

- **Critical Data Loss**: 30 minutes
- **Database Corruption**: 1 hour
- **Server Failure**: 2 hours
- **Complete Disaster**: 4 hours

### Recovery Point Objective (RPO)

The maximum acceptable data loss:

- **Daily Operations**: 24 hours (incremental backups)
- **Financial Transactions**: 1 hour (hourly backups during business hours)
- **User Data**: 24 hours

### High Availability Setup

For production environments, implement:

1. **Database Replication**: Master-slave replication for automatic failover
2. **Load Balancing**: Distribute traffic across multiple servers
3. **Automated Failover**: Automatic detection and failover on failure
4. **Monitoring & Alerts**: Real-time monitoring with alerting

```bash
# Check replication status
mysql -u root -p -e "SHOW SLAVE STATUS\G"

# Monitor replication lag
mysql -u root -p -e "SHOW PROCESSLIST;"
```

## Testing & Validation

### Regular Backup Testing

Perform monthly backup tests to ensure recovery procedures work:

```bash
# 1. Create test environment
docker run -d --name mysql-test -e MYSQL_ROOT_PASSWORD=test mysql:8.0

# 2. Restore backup to test environment
gunzip -c /backups/ologywood/full_latest.sql.gz | mysql -u root -p test_ologywood

# 3. Run data validation queries
mysql -u root -p test_ologywood < /home/ubuntu/ologywood/scripts/validate-data.sql

# 4. Verify application connectivity
npm test -- --testNamePattern="database-connection"

# 5. Clean up
docker stop mysql-test
docker rm mysql-test
```

### Disaster Recovery Drills

Conduct quarterly disaster recovery drills:

1. **Announcement**: Notify team of drill
2. **Simulation**: Simulate specific disaster scenario
3. **Execution**: Execute recovery procedures
4. **Validation**: Verify system functionality
5. **Documentation**: Record results and lessons learned
6. **Debrief**: Team discussion and improvements

## Monitoring & Alerting

### Backup Monitoring

Monitor backup health with these metrics:

| Metric | Threshold | Action |
|---|---|---|
| Backup Duration | > 30 minutes | Investigate performance |
| Backup Size Change | > 50% increase | Investigate data growth |
| Backup Verification | Failed | Alert administrator |
| Backup Age | > 24 hours | Alert administrator |
| Storage Usage | > 80% | Cleanup old backups |

### Alert Configuration

```bash
# Email alerts on backup failure
# Configure in /etc/cron.d/ologywood-backup
MAILTO=admin@ologywood.com

# Slack alerts
# Use backup script hooks to send Slack messages
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Backup failed"}' \
  $SLACK_WEBHOOK_URL
```

## Off-site Backup

### Cloud Backup Strategy

Maintain off-site backups for disaster recovery:

```bash
# Upload backup to AWS S3
aws s3 cp /backups/ologywood/full_latest.sql.gz \
  s3://ologywood-backups/prod/full_latest.sql.gz \
  --sse AES256 \
  --storage-class GLACIER

# Upload to Google Cloud Storage
gsutil -m cp /backups/ologywood/full_latest.sql.gz \
  gs://ologywood-backups/prod/full_latest.sql.gz
```

### Backup Encryption

Encrypt backups before uploading:

```bash
# Encrypt backup with GPG
gpg --symmetric --cipher-algo AES256 /backups/ologywood/full_latest.sql.gz

# Upload encrypted backup
aws s3 cp /backups/ologywood/full_latest.sql.gz.gpg \
  s3://ologywood-backups/prod/
```

## Documentation & Communication

### Runbooks

Maintain updated runbooks for:

- Backup procedures
- Recovery procedures
- Failover procedures
- Escalation procedures
- Contact information

### Communication Plan

In case of disaster:

1. **Immediate**: Notify incident commander
2. **5 minutes**: Notify management
3. **15 minutes**: Update status page
4. **30 minutes**: Notify customers
5. **Hourly**: Provide status updates

## Compliance & Audit

### Backup Compliance

Ensure backups meet compliance requirements:

- [ ] GDPR: Data retention policies
- [ ] HIPAA: Encryption and access controls
- [ ] SOC 2: Backup verification and testing
- [ ] ISO 27001: Information security

### Audit Trail

Maintain audit logs for:

- Backup creation and verification
- Backup access and restoration
- Backup deletion
- Configuration changes

## Maintenance Schedule

| Task | Frequency | Owner |
|---|---|---|
| Backup verification | Weekly | DevOps |
| Backup testing | Monthly | QA |
| Disaster recovery drill | Quarterly | DevOps |
| Documentation review | Quarterly | Technical Lead |
| Compliance audit | Annually | Security |

## Emergency Contacts

- **On-call Engineer**: [Contact Info]
- **Database Administrator**: [Contact Info]
- **System Administrator**: [Contact Info]
- **Management**: [Contact Info]
- **Vendor Support**: [Contact Info]

## Additional Resources

- [MySQL Backup and Recovery](https://dev.mysql.com/doc/refman/8.0/en/backup-and-recovery.html)
- [AWS Disaster Recovery](https://aws.amazon.com/disaster-recovery/)
- [Google Cloud Backup and Disaster Recovery](https://cloud.google.com/solutions/backup-dr)
- [NIST Disaster Recovery Guide](https://csrc.nist.gov/publications/detail/sp/800-34/rev-1/final)

---

**Last Updated**: January 2026
**Next Review**: April 2026
**Owner**: DevOps Team
