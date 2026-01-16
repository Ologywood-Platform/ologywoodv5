# CloudWatch Monitoring Setup Guide

## Overview

Complete guide for setting up CloudWatch monitoring dashboards, alarms, and log insights for the Ologywood platform.

## Dashboard Metrics

### Application Metrics

**Key Performance Indicators (KPIs):**
- API Response Time (target: < 1 second)
- Error Rate (target: < 1%)
- Request Throughput (requests/second)
- Database Query Time (target: < 100ms)
- Contract Signing Success Rate (target: > 95%)
- Support Ticket Resolution Time (target: < 24 hours)

### Infrastructure Metrics

**ECS Cluster:**
- CPU Utilization (alert: > 80%)
- Memory Utilization (alert: > 85%)
- Task Count (running vs desired)
- Service Deployment Status

**RDS Database:**
- CPU Utilization (alert: > 80%)
- Database Connections (alert: > 80% of max)
- Read/Write Latency (alert: > 100ms)
- Storage Used (alert: > 80% of allocated)
- IOPS Used (alert: > 80% of provisioned)

**Application Load Balancer:**
- Target Response Time (alert: > 1 second)
- HTTP 2XX Count (successful requests)
- HTTP 4XX Count (client errors)
- HTTP 5XX Count (server errors)
- Active Connection Count

## CloudWatch Logs Insights Queries

### Application Performance

```sql
# Average response time by endpoint
fields @timestamp, @duration, @path
| stats avg(@duration) as avg_duration by @path
| sort avg_duration desc

# Error rate by status code
fields @timestamp, @statusCode
| stats count() as total_requests, 
        sum(if(@statusCode >= 500, 1, 0)) as server_errors,
        sum(if(@statusCode >= 400 and @statusCode < 500, 1, 0)) as client_errors
| fields total_requests, server_errors, client_errors,
         (server_errors / total_requests * 100) as error_rate_percent

# Slow requests
fields @timestamp, @duration, @path, @statusCode
| filter @duration > 1000
| stats count() as slow_requests by @path
| sort slow_requests desc

# Database query performance
fields @timestamp, @queryTime, @query
| filter @queryTime > 100
| stats avg(@queryTime) as avg_time, max(@queryTime) as max_time by @query
| sort max_time desc
```

### Security Monitoring

```sql
# Failed authentication attempts
fields @timestamp, @userId, @event
| filter @event = "AUTH_FAILED"
| stats count() as failed_attempts by @userId
| filter failed_attempts > 5

# Rate limit violations
fields @timestamp, @ip, @endpoint
| filter @event = "RATE_LIMIT_EXCEEDED"
| stats count() as violations by @ip
| sort violations desc

# Suspicious file uploads
fields @timestamp, @userId, @fileName, @fileSize
| filter @fileSize > 100000000
| stats count() as large_uploads by @userId

# Certificate verification failures
fields @timestamp, @certificateId, @error
| filter @event = "CERT_VERIFICATION_FAILED"
| stats count() as failures by @error
```

### Business Metrics

```sql
# Contract signing completion rate
fields @timestamp, @contractId, @status
| stats count() as total_contracts,
        sum(if(@status = "SIGNED", 1, 0)) as signed_contracts
| fields total_contracts, signed_contracts,
         (signed_contracts / total_contracts * 100) as completion_rate

# Support ticket metrics
fields @timestamp, @ticketId, @status, @priority
| stats count() as total_tickets,
        sum(if(@status = "RESOLVED", 1, 0)) as resolved,
        avg(@resolutionTime) as avg_resolution_time
| fields total_tickets, resolved, avg_resolution_time

# Booking conversion funnel
fields @timestamp, @event, @userId
| filter @event in ["BOOKING_STARTED", "CONTRACT_SIGNED", "PAYMENT_COMPLETED"]
| stats count() as event_count by @event
| sort @event desc

# Revenue tracking
fields @timestamp, @paymentId, @amount, @status
| filter @status = "COMPLETED"
| stats sum(@amount) as total_revenue, count() as transaction_count
```

## Setting Up Custom Metrics

### 1. Create Custom Metric for Contract Signing

```bash
# Put custom metric
aws cloudwatch put-metric-data \
  --namespace "Ologywood/Contracts" \
  --metric-name "ContractSigningRate" \
  --value 95.5 \
  --unit Percent \
  --timestamp $(date -u +%Y-%m-%dT%H:%M:%S.000Z)
```

### 2. Create Custom Metric for Support Tickets

```bash
# Put custom metric
aws cloudwatch put-metric-data \
  --namespace "Ologywood/Support" \
  --metric-name "AverageResolutionTime" \
  --value 480 \
  --unit Minutes \
  --timestamp $(date -u +%Y-%m-%dT%H:%M:%S.000Z)
```

### 3. Create Custom Metric for API Performance

```bash
# Put custom metric
aws cloudwatch put-metric-data \
  --namespace "Ologywood/API" \
  --metric-name "AverageResponseTime" \
  --value 250 \
  --unit Milliseconds \
  --timestamp $(date -u +%Y-%m-%dT%H:%M:%S.000Z)
```

## Alarm Configuration

### Critical Alarms

```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name ologywood-high-error-rate \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 60 \
  --evaluation-periods 2 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:ologywood-alerts

# Database connection pool exhausted
aws cloudwatch put-metric-alarm \
  --alarm-name ologywood-db-connections-high \
  --alarm-description "Alert when database connections exceed 80%" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:ologywood-alerts

# Disk space running low
aws cloudwatch put-metric-alarm \
  --alarm-name ologywood-disk-space-low \
  --alarm-description "Alert when disk space is below 10%" \
  --metric-name FreeStorageSpace \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator LessThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:ologywood-alerts
```

### Warning Alarms

```bash
# Slow response time
aws cloudwatch put-metric-alarm \
  --alarm-name ologywood-slow-response-time \
  --alarm-description "Alert when response time exceeds 1 second" \
  --metric-name TargetResponseTime \
  --namespace AWS/ApplicationELB \
  --statistic Average \
  --period 60 \
  --evaluation-periods 3 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:ologywood-alerts

# High CPU utilization
aws cloudwatch put-metric-alarm \
  --alarm-name ologywood-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:ologywood-alerts
```

## Log Group Configuration

### Create Log Groups

```bash
# ECS logs
aws logs create-log-group --log-group-name /ecs/ologywood-staging
aws logs put-retention-policy --log-group-name /ecs/ologywood-staging --retention-in-days 30

# Application logs
aws logs create-log-group --log-group-name /ologywood/application
aws logs put-retention-policy --log-group-name /ologywood/application --retention-in-days 30

# Security logs
aws logs create-log-group --log-group-name /ologywood/security
aws logs put-retention-policy --log-group-name /ologywood/security --retention-in-days 90

# Database logs
aws logs create-log-group --log-group-name /ologywood/database
aws logs put-retention-policy --log-group-name /ologywood/database --retention-in-days 30
```

### Create Log Filters

```bash
# Error filter
aws logs put-metric-filter \
  --log-group-name /ologywood/application \
  --filter-name ErrorCount \
  --filter-pattern "[ERROR]" \
  --metric-transformations metricName=ErrorCount,metricNamespace=Ologywood/Application,metricValue=1

# Warning filter
aws logs put-metric-filter \
  --log-group-name /ologywood/application \
  --filter-name WarningCount \
  --filter-pattern "[WARN]" \
  --metric-transformations metricName=WarningCount,metricNamespace=Ologywood/Application,metricValue=1
```

## Monitoring Dashboard Template

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ "AWS/ApplicationELB", "TargetResponseTime", { "stat": "Average" } ],
          [ ".", "HTTPCode_Target_2XX_Count", { "stat": "Sum" } ],
          [ ".", "HTTPCode_Target_5XX_Count", { "stat": "Sum" } ]
        ],
        "period": 60,
        "stat": "Average",
        "region": "us-east-1",
        "title": "API Performance"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ "AWS/ECS", "CPUUtilization", { "stat": "Average" } ],
          [ ".", "MemoryUtilization", { "stat": "Average" } ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "ECS Cluster Health"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ "AWS/RDS", "CPUUtilization", { "stat": "Average" } ],
          [ ".", "DatabaseConnections", { "stat": "Average" } ],
          [ ".", "ReadLatency", { "stat": "Average" } ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Database Performance"
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "fields @timestamp, @duration | stats avg(@duration) as avg_response_time",
        "region": "us-east-1",
        "title": "Average Response Time"
      }
    }
  ]
}
```

## Monitoring Best Practices

1. **Set Appropriate Thresholds** - Base thresholds on baseline metrics, not arbitrary values
2. **Use Multiple Metrics** - Don't rely on single metric; use composite alarms
3. **Regular Review** - Review alarms monthly to adjust thresholds based on trends
4. **Document Runbooks** - Create runbooks for each alarm type
5. **Test Alarms** - Regularly test alarms to ensure they work correctly
6. **Aggregate Metrics** - Use CloudWatch Insights to correlate metrics across services
7. **Archive Logs** - Archive old logs to S3 for long-term storage and compliance

## Troubleshooting

### Metrics Not Appearing

```bash
# Check metric exists
aws cloudwatch list-metrics --namespace "Ologywood/API"

# Check log group exists
aws logs describe-log-groups --log-group-name-prefix "/ologywood"

# Check metric filter
aws logs describe-metric-filters --log-group-name "/ologywood/application"
```

### Alarms Not Triggering

```bash
# Check alarm state
aws cloudwatch describe-alarms --alarm-names ologywood-high-error-rate

# Check alarm history
aws cloudwatch describe-alarm-history --alarm-name ologywood-high-error-rate

# Test alarm manually
aws cloudwatch set-alarm-state \
  --alarm-name ologywood-high-error-rate \
  --state-value ALARM \
  --state-reason "Testing alarm"
```

---

**Version:** 1.0  
**Last Updated:** January 16, 2026  
**Status:** Ready for Production ✅
