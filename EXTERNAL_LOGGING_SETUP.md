# External Logging Setup Guide

## Overview

This guide covers setting up external logging services (ELK Stack, Splunk, Datadog, CloudWatch, Stackdriver) to persist logs and enable real-time monitoring for the Ologywood platform.

## 1. ELK Stack Setup

### Prerequisites

- Docker and Docker Compose installed
- 4GB RAM minimum
- Port 9200 (Elasticsearch), 5601 (Kibana) available

### Installation

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

Start services:

```bash
docker-compose up -d
```

### Configure Ologywood

Set environment variables:

```env
LOGGING_PROVIDER=elk
EXTERNAL_LOGGING_ENABLED=true
LOGGING_ENDPOINT=http://localhost:9200
LOGGING_INDEX=ologywood-logs
LOGGING_BATCH_SIZE=100
LOGGING_FLUSH_INTERVAL=30
```

### Verify Connection

```bash
curl http://localhost:9200/_cluster/health
```

Expected response:

```json
{
  "cluster_name": "docker-cluster",
  "status": "green",
  "timed_out": false,
  "number_of_nodes": 1,
  "number_of_data_nodes": 1,
  "active_primary_shards": 0,
  "active_shards": 0,
  "relocating_shards": 0,
  "initializing_shards": 0,
  "unassigned_shards": 0
}
```

### View Logs in Kibana

1. Open http://localhost:5601
2. Go to Management → Index Patterns
3. Create index pattern: `ologywood-logs*`
4. Go to Discover to view logs

### Create Alerts

In Kibana:

1. Go to Alerting → Create Rule
2. Set condition: `level: CRITICAL`
3. Configure notification (email, Slack, etc.)

## 2. Splunk Setup

### Prerequisites

- Splunk Enterprise or Cloud account
- HEC (HTTP Event Collector) token

### Get HEC Token

1. Log in to Splunk
2. Go to Settings → Data Inputs → HTTP Event Collector
3. Create new HEC token
4. Copy the token value

### Configure Ologywood

```env
LOGGING_PROVIDER=splunk
EXTERNAL_LOGGING_ENABLED=true
LOGGING_ENDPOINT=https://your-splunk-instance.splunkcloud.com
LOGGING_API_KEY=your-hec-token
LOGGING_BATCH_SIZE=100
LOGGING_FLUSH_INTERVAL=30
```

### Verify Connection

```bash
curl -k https://your-splunk-instance.splunkcloud.com/services/collector \
  -H "Authorization: Splunk your-hec-token" \
  -d '{"event": "test"}'
```

### View Logs in Splunk

```
index=main source=ologywood
```

### Create Alerts

1. Go to Alerts → Create Alert
2. Set search: `index=main source=ologywood level=CRITICAL`
3. Configure trigger and notification

## 3. Datadog Setup

### Prerequisites

- Datadog account (free tier available)
- API key

### Get API Key

1. Log in to Datadog
2. Go to Organization Settings → API Keys
3. Create new API key
4. Copy the key value

### Configure Ologywood

```env
LOGGING_PROVIDER=datadog
EXTERNAL_LOGGING_ENABLED=true
LOGGING_ENDPOINT=https://http-intake.logs.datadoghq.com
LOGGING_API_KEY=your-datadog-api-key
LOGGING_BATCH_SIZE=100
LOGGING_FLUSH_INTERVAL=30
```

### Verify Connection

```bash
curl -X POST https://http-intake.logs.datadoghq.com/v1/input/your-datadog-api-key \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "level": "info"}'
```

### View Logs in Datadog

1. Go to Logs → Live Tail
2. Filter: `service:ologywood`

### Create Monitors

1. Go to Monitors → New Monitor
2. Select Log Alert
3. Set query: `service:ologywood status:error`
4. Configure notification

## 4. AWS CloudWatch Setup

### Prerequisites

- AWS account
- IAM user with CloudWatch permissions

### Create IAM User

```bash
aws iam create-user --user-name ologywood-logs
aws iam attach-user-policy --user-name ologywood-logs \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
aws iam create-access-key --user-name ologywood-logs
```

### Configure Ologywood

```env
LOGGING_PROVIDER=cloudwatch
EXTERNAL_LOGGING_ENABLED=true
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

### Create Log Group

```bash
aws logs create-log-group --log-group-name /ologywood/application
aws logs create-log-stream --log-group-name /ologywood/application \
  --log-stream-name app-logs
```

### View Logs in CloudWatch

1. Go to CloudWatch → Logs → Log Groups
2. Select `/ologywood/application`
3. View log streams

### Create Alarms

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name ologywood-errors \
  --alarm-description "Alert on error logs" \
  --metric-name ErrorCount \
  --namespace Ologywood \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

## 5. Google Cloud Logging Setup

### Prerequisites

- Google Cloud account
- Service account with Logging permissions

### Create Service Account

```bash
gcloud iam service-accounts create ologywood-logs
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member=serviceAccount:ologywood-logs@PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/logging.logWriter
gcloud iam service-accounts keys create key.json \
  --iam-account=ologywood-logs@PROJECT_ID.iam.gserviceaccount.com
```

### Configure Ologywood

```env
LOGGING_PROVIDER=stackdriver
EXTERNAL_LOGGING_ENABLED=true
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
GOOGLE_CLOUD_PROJECT=your-project-id
```

### View Logs in Cloud Logging

1. Go to Cloud Logging → Logs
2. Filter: `resource.type="gae_app"`

### Create Alerts

1. Go to Alerting → Create Policy
2. Set condition: `severity="ERROR"`
3. Configure notification

## 6. Monitoring Best Practices

### Set Up Dashboards

Create dashboards to track:

- **Error Rate**: Percentage of requests with errors
- **Slow Queries**: Queries taking > 1 second
- **Authentication Failures**: Failed login attempts
- **Rate Limit Hits**: API calls exceeding limits
- **Contract Signing Rate**: Percentage of signed contracts
- **Support Ticket SLA**: Compliance with response times

### Configure Alerts

Set up alerts for:

- **Critical Errors**: Immediate notification
- **High Error Rate**: > 5% of requests
- **Rate Limit Exceeded**: > 10 times per hour
- **Slow Queries**: Average > 500ms
- **Failed Backups**: Backup job failures

### Log Retention

Set retention policies:

- **Critical Events**: 1 year
- **Error Logs**: 90 days
- **Info Logs**: 30 days
- **Debug Logs**: 7 days

### Performance Optimization

- Use log sampling for high-volume events
- Filter unnecessary logs
- Compress archived logs
- Archive old logs to cheaper storage

## 7. Troubleshooting

### Logs Not Appearing

1. Verify endpoint URL is correct
2. Check API key/credentials
3. Review network connectivity
4. Check firewall rules
5. Verify log format matches service requirements

### High Costs

1. Reduce log batch size
2. Increase flush interval
3. Enable log sampling
4. Filter unnecessary logs
5. Archive old logs

### Performance Impact

1. Use async logging
2. Increase batch size
3. Decrease flush frequency
4. Use dedicated logging thread
5. Monitor CPU/memory usage

## 8. Testing

### Send Test Log

```typescript
import { logEvent, LogLevel, LogEventType } from './server/middleware/logging';

logEvent({
  level: LogLevel.INFO,
  eventType: LogEventType.TEST,
  message: 'Test log from Ologywood',
  timestamp: new Date().toISOString(),
});
```

### Verify in External Service

Check that log appears in your logging service within 30-60 seconds.

## 9. Production Deployment

### Pre-Deployment Checklist

- [ ] External logging service is running and accessible
- [ ] API credentials are correct
- [ ] Network connectivity is verified
- [ ] Log retention policies are configured
- [ ] Alerts are set up
- [ ] Dashboards are created
- [ ] Team is trained on monitoring

### Deployment Steps

1. Set environment variables
2. Initialize external logging service
3. Verify connection
4. Deploy application
5. Monitor logs for errors
6. Adjust settings as needed

### Post-Deployment

- Monitor logs for 24 hours
- Verify alerts are working
- Check log volume and costs
- Adjust retention policies
- Document any issues

## Support

For issues with external logging services:

- **ELK Stack**: https://www.elastic.co/support
- **Splunk**: https://www.splunk.com/en_us/support.html
- **Datadog**: https://docs.datadoghq.com/
- **AWS CloudWatch**: https://aws.amazon.com/support/
- **Google Cloud Logging**: https://cloud.google.com/support
