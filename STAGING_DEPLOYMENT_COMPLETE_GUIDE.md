# Complete Staging Deployment Guide

## Overview

This comprehensive guide provides step-by-step instructions for deploying Ologywood to a staging environment with all security, performance, and monitoring features enabled.

## Pre-Deployment Checklist

- [ ] Staging infrastructure provisioned (server, database, storage)
- [ ] Domain/DNS configured for staging
- [ ] SSL/TLS certificates obtained
- [ ] Environment variables prepared
- [ ] Database backups configured
- [ ] Monitoring tools installed
- [ ] Team access configured
- [ ] Rollback plan documented

## Infrastructure Requirements

### Minimum Staging Setup

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                   (nginx/HAProxy)                        │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼───┐      ┌───▼───┐      ┌──▼────┐
    │ App 1 │      │ App 2 │      │ App 3 │
    │ Node  │      │ Node  │      │ Node  │
    └───┬───┘      └───┬───┘      └──┬────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼────────┐ ┌──▼─────┐ ┌─────▼──┐
    │ PostgreSQL │ │ Redis  │ │ S3/Min │
    │ Primary    │ │ Cache  │ │ io     │
    └────────────┘ └────────┘ └────────┘
```

### Recommended AWS Setup

```yaml
Compute:
  - EC2 t3.large (3 instances) for application
  - Auto Scaling Group with min=2, max=5
  - Application Load Balancer

Database:
  - RDS PostgreSQL 14+ (db.t3.medium)
  - Multi-AZ enabled
  - Automated backups (7 days retention)
  - Enhanced monitoring

Storage:
  - S3 bucket for PDFs and contracts
  - CloudFront CDN for distribution
  - Versioning and lifecycle policies enabled

Monitoring:
  - CloudWatch for metrics
  - CloudWatch Logs for application logs
  - SNS for alerts
  - X-Ray for tracing

Networking:
  - VPC with public/private subnets
  - Security groups for each tier
  - NAT Gateway for private subnet egress
  - Route 53 for DNS
```

## Step 1: Prepare Staging Environment

### 1.1 Create Environment Configuration

```bash
# Create staging environment file
cat > .env.staging << 'EOF'
# Application
NODE_ENV=staging
PORT=3000
LOG_LEVEL=info

# Database
DB_HOST=staging-db.ologywood.com
DB_PORT=5432
DB_NAME=ologywood_staging
DB_USER=ologywood_staging
DB_PASSWORD=$(openssl rand -base64 32)

# Redis
REDIS_URL=redis://staging-redis.ologywood.com:6379

# S3 Storage
AWS_REGION=us-east-1
AWS_S3_BUCKET=ologywood-staging-contracts
AWS_ACCESS_KEY_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_SECRET_ACCESS_KEY=$(aws secretsmanager get-random-password --query RandomPassword --output text)

# Authentication
JWT_SECRET=$(openssl rand -base64 32)
OAUTH_SERVER_URL=https://oauth.manus.im

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM=noreply@staging.ologywood.com

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Logging
EXTERNAL_LOGGING_ENABLED=true
EXTERNAL_LOGGING_SERVICE=datadog
DATADOG_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DATADOG_SITE=datadoghq.com

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://staging.ologywood.com

# Feature Flags
ENABLE_CONTRACTS=true
ENABLE_SIGNATURES=true
ENABLE_ANALYTICS=true
ENABLE_SUPPORT_TICKETS=true
ENABLE_PDF_EXPORT=true
EOF

# Secure the file
chmod 600 .env.staging
```

### 1.2 Verify Database Connectivity

```bash
# Test database connection
psql -h staging-db.ologywood.com \
     -U ologywood_staging \
     -d ologywood_staging \
     -c "SELECT version();"

# Expected output:
# PostgreSQL 14.x on x86_64-pc-linux-gnu...
```

### 1.3 Create Database Schema

```bash
# Run migrations
pnpm db:push --env staging

# Verify tables created
psql -h staging-db.ologywood.com \
     -U ologywood_staging \
     -d ologywood_staging \
     -c "\dt"

# Expected output:
# Schema |              Name              | Type  |     Owner
# --------+--------------------------------+-------+----------------
# public | users                          | table | ologywood_staging
# public | contracts                      | table | ologywood_staging
# public | bookings                       | table | ologywood_staging
# public | signatures                     | table | ologywood_staging
# ...
```

### 1.4 Deploy Database Indexes

```bash
# Execute index creation script
psql -h staging-db.ologywood.com \
     -U ologywood_staging \
     -d ologywood_staging \
     -f scripts/deploy-indexes.sql

# Verify indexes created
psql -h staging-db.ologywood.com \
     -U ologywood_staging \
     -d ologywood_staging \
     -c "SELECT indexname FROM pg_indexes WHERE tablename='contracts';"
```

## Step 2: Build & Deploy Application

### 2.1 Build Production Bundle

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build application
pnpm build

# Verify build output
ls -la dist/
# Expected files:
# - client/ (React app)
# - server/ (Node.js server)
# - public/ (static assets)
```

### 2.2 Deploy to Staging Server

```bash
# Option A: Docker Deployment (Recommended)

# Build Docker image
docker build -t ologywood:staging .

# Tag for registry
docker tag ologywood:staging registry.ologywood.com/ologywood:staging

# Push to registry
docker push registry.ologywood.com/ologywood:staging

# Deploy to staging
docker run -d \
  --name ologywood-staging \
  --env-file .env.staging \
  -p 3000:3000 \
  -v /data/logs:/app/logs \
  -v /data/uploads:/app/uploads \
  registry.ologywood.com/ologywood:staging

# Option B: Direct Node.js Deployment

# Copy files to staging server
scp -r dist/ staging-server:/opt/ologywood/

# SSH into staging server
ssh staging-server

# Install dependencies on server
cd /opt/ologywood
npm install --production

# Start application with PM2
pm2 start server/index.js --name ologywood --env staging

# Configure PM2 auto-restart
pm2 startup
pm2 save
```

### 2.3 Verify Deployment

```bash
# Check application health
curl -I https://staging-api.ologywood.com/health

# Expected output:
# HTTP/2 200
# Content-Type: application/json

# Check API endpoints
curl https://staging-api.ologywood.com/trpc/contracts.list

# Check logs
docker logs ologywood-staging | tail -50
# or
pm2 logs ologywood
```

## Step 3: Configure Security & Monitoring

### 3.1 Enable Security Middleware

```bash
# Verify security headers are enabled
curl -I https://staging-api.ologywood.com/ | grep -E "Strict-Transport|Content-Security|X-Frame"

# Expected output:
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# Content-Security-Policy: default-src 'self'
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
```

### 3.2 Configure Rate Limiting

```bash
# Test rate limiting
for i in {1..150}; do
  curl -s https://staging-api.ologywood.com/trpc/contracts.list \
    -H "X-Forwarded-For: 127.0.0.1" > /dev/null
done

# After 100 requests, should receive 429 Too Many Requests
curl -v https://staging-api.ologywood.com/trpc/contracts.list \
  -H "X-Forwarded-For: 127.0.0.1"

# Expected output:
# HTTP/2 429
# Retry-After: 60
```

### 3.3 Configure External Logging

```bash
# For Datadog
export DD_AGENT_HOST=staging-datadog.ologywood.com
export DD_AGENT_PORT=8125
export DD_TRACE_ENABLED=true

# For ELK Stack
export ELASTICSEARCH_HOST=staging-elasticsearch.ologywood.com
export ELASTICSEARCH_PORT=9200
export ELASTICSEARCH_INDEX=ologywood-staging

# Verify logging
curl -X GET "https://staging-api.ologywood.com/trpc/contracts.list"

# Check logs in Datadog/ELK
# Datadog: https://app.datadoghq.com/logs
# ELK: https://staging-kibana.ologywood.com
```

### 3.4 Configure SSL/TLS

```bash
# Obtain SSL certificate (Let's Encrypt)
certbot certonly --dns-route53 \
  -d staging-api.ologywood.com \
  -d staging.ologywood.com

# Configure nginx
cat > /etc/nginx/sites-available/ologywood-staging << 'EOF'
server {
    listen 443 ssl http2;
    server_name staging-api.ologywood.com;

    ssl_certificate /etc/letsencrypt/live/staging-api.ologywood.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging-api.ologywood.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name staging-api.ologywood.com;
    return 301 https://$server_name$request_uri;
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/ologywood-staging /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

## Step 4: Database Setup & Seeding

### 4.1 Create Test Data

```bash
# Create test users
psql -h staging-db.ologywood.com \
     -U ologywood_staging \
     -d ologywood_staging << 'EOF'
INSERT INTO users (email, name, role, created_at) VALUES
  ('artist1@test.com', 'Test Artist 1', 'artist', NOW()),
  ('artist2@test.com', 'Test Artist 2', 'artist', NOW()),
  ('venue1@test.com', 'Test Venue 1', 'venue', NOW()),
  ('venue2@test.com', 'Test Venue 2', 'venue', NOW()),
  ('admin@test.com', 'Admin User', 'admin', NOW());
EOF

# Create test contracts
psql -h staging-db.ologywood.com \
     -U ologywood_staging \
     -d ologywood_staging << 'EOF'
INSERT INTO contracts (artist_id, venue_id, contract_data, status, created_at) VALUES
  (1, 3, '{}', 'draft', NOW()),
  (2, 4, '{}', 'signed', NOW());
EOF

# Create test bookings
psql -h staging-db.ologywood.com \
     -U ologywood_staging \
     -d ologywood_staging << 'EOF'
INSERT INTO bookings (artist_id, venue_id, event_date, fee, status, created_at) VALUES
  (1, 3, NOW() + INTERVAL '30 days', 500.00, 'confirmed', NOW()),
  (2, 4, NOW() + INTERVAL '45 days', 750.00, 'pending', NOW());
EOF
```

### 4.2 Verify Data

```bash
# Count records
psql -h staging-db.ologywood.com \
     -U ologywood_staging \
     -d ologywood_staging << 'EOF'
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM contracts) as contracts,
  (SELECT COUNT(*) FROM bookings) as bookings;
EOF

# Expected output:
# users | contracts | bookings
# ------+-----------+----------
#     5 |         2 |        2
```

## Step 5: Monitoring & Alerts

### 5.1 Configure Monitoring Dashboard

```bash
# Create Datadog dashboard
cat > datadog-dashboard.json << 'EOF'
{
  "title": "Ologywood Staging Dashboard",
  "widgets": [
    {
      "type": "timeseries",
      "queries": [
        {
          "query": "avg:system.cpu{env:staging}",
          "display_type": "line"
        }
      ]
    },
    {
      "type": "timeseries",
      "queries": [
        {
          "query": "avg:system.mem{env:staging}",
          "display_type": "line"
        }
      ]
    },
    {
      "type": "timeseries",
      "queries": [
        {
          "query": "avg:http.requests{env:staging}",
          "display_type": "line"
        }
      ]
    }
  ]
}
EOF

# Import dashboard
curl -X POST https://api.datadoghq.com/api/v1/dashboard \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  -d @datadog-dashboard.json
```

### 5.2 Configure Alerts

```bash
# CPU Alert
curl -X POST https://api.datadoghq.com/api/v1/monitor \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  -d '{
    "type": "metric alert",
    "query": "avg(last_5m):avg:system.cpu{env:staging} > 0.8",
    "name": "High CPU on Staging",
    "message": "CPU usage is high on staging environment"
  }'

# Error Rate Alert
curl -X POST https://api.datadoghq.com/api/v1/monitor \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  -d '{
    "type": "metric alert",
    "query": "avg(last_5m):avg:http.requests.errors{env:staging} > 0.05",
    "name": "High Error Rate on Staging",
    "message": "Error rate is high on staging environment"
  }'

# Response Time Alert
curl -X POST https://api.datadoghq.com/api/v1/monitor \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  -d '{
    "type": "metric alert",
    "query": "avg(last_5m):avg:http.requests.duration{env:staging} > 1000",
    "name": "High Response Time on Staging",
    "message": "Response time is high on staging environment"
  }'
```

### 5.3 Configure Health Checks

```bash
# Create health check endpoint
curl -X POST https://api.datadoghq.com/api/v1/synthetics/tests \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  -d '{
    "type": "api",
    "name": "Ologywood Staging Health Check",
    "request": {
      "method": "GET",
      "url": "https://staging-api.ologywood.com/health"
    },
    "locations": ["aws:us-east-1"],
    "frequency": 300,
    "status": "live"
  }'
```

## Step 6: Testing & Validation

### 6.1 Smoke Tests

```bash
# Test API endpoints
echo "Testing API endpoints..."

# Health check
curl -s https://staging-api.ologywood.com/health | jq .

# User registration
curl -s -X POST https://staging-api.ologywood.com/trpc/auth.register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@staging.ologywood.com",
    "password": "Test123!@#",
    "name": "Test User",
    "role": "artist"
  }' | jq .

# Contract list
curl -s https://staging-api.ologywood.com/trpc/contracts.list \
  -H "Authorization: Bearer $TOKEN" | jq .

# PDF generation
curl -s -X POST https://staging-api.ologywood.com/trpc/contractPdf.generatePdf \
  -H "Content-Type: application/json" \
  -d '{"contractId": 1}' | jq .
```

### 6.2 Security Tests

```bash
# Test rate limiting
echo "Testing rate limiting..."
for i in {1..150}; do
  curl -s https://staging-api.ologywood.com/trpc/contracts.list > /dev/null
done
curl -v https://staging-api.ologywood.com/trpc/contracts.list

# Test security headers
echo "Testing security headers..."
curl -I https://staging-api.ologywood.com/ | grep -E "Strict-Transport|Content-Security|X-Frame"

# Test CORS
echo "Testing CORS..."
curl -H "Origin: https://staging.ologywood.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS https://staging-api.ologywood.com/trpc/contracts.list

# Test SQL injection protection
echo "Testing SQL injection protection..."
curl -s "https://staging-api.ologywood.com/trpc/contracts.list?id=1' OR '1'='1"
```

### 6.3 Performance Tests

```bash
# Run baseline load test
echo "Running baseline load test..."
k6 run \
  --vus 10 \
  --duration 1m \
  --env STAGING_API="https://staging-api.ologywood.com" \
  tests/load-testing.js

# Expected results:
# - P95 response time < 200ms
# - Error rate < 0.1%
# - Throughput > 100 req/s
```

## Step 7: Backup & Disaster Recovery

### 7.1 Configure Database Backups

```bash
# AWS RDS automated backups
aws rds modify-db-instance \
  --db-instance-identifier ologywood-staging \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --apply-immediately

# Manual backup
aws rds create-db-snapshot \
  --db-instance-identifier ologywood-staging \
  --db-snapshot-identifier ologywood-staging-$(date +%Y%m%d-%H%M%S)

# Verify backups
aws rds describe-db-snapshots \
  --db-instance-identifier ologywood-staging
```

### 7.2 Configure S3 Backups

```bash
# Enable versioning
aws s3api put-bucket-versioning \
  --bucket ologywood-staging-contracts \
  --versioning-configuration Status=Enabled

# Enable lifecycle policies
aws s3api put-bucket-lifecycle-configuration \
  --bucket ologywood-staging-contracts \
  --lifecycle-configuration file://lifecycle-policy.json

# Lifecycle policy content:
cat > lifecycle-policy.json << 'EOF'
{
  "Rules": [
    {
      "Id": "Archive old versions",
      "Status": "Enabled",
      "NoncurrentVersionTransitions": [
        {
          "NoncurrentDays": 30,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
EOF
```

### 7.3 Test Disaster Recovery

```bash
# Simulate database failure
# 1. Create backup
aws rds create-db-snapshot \
  --db-instance-identifier ologywood-staging \
  --db-snapshot-identifier ologywood-staging-dr-test

# 2. Restore from backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ologywood-staging-restored \
  --db-snapshot-identifier ologywood-staging-dr-test

# 3. Verify restored database
psql -h ologywood-staging-restored.xxxxx.rds.amazonaws.com \
     -U ologywood_staging \
     -d ologywood_staging \
     -c "SELECT COUNT(*) FROM users;"

# 4. Delete test instance
aws rds delete-db-instance \
  --db-instance-identifier ologywood-staging-restored \
  --skip-final-snapshot
```

## Step 8: Rollback Procedures

### 8.1 Application Rollback

```bash
# Docker rollback
docker stop ologywood-staging
docker rm ologywood-staging
docker run -d \
  --name ologywood-staging \
  --env-file .env.staging \
  -p 3000:3000 \
  registry.ologywood.com/ologywood:previous-stable

# PM2 rollback
pm2 restart ologywood --env previous-stable

# Verify rollback
curl -I https://staging-api.ologywood.com/health
```

### 8.2 Database Rollback

```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ologywood-staging-restored \
  --db-snapshot-identifier ologywood-staging-backup-20240116

# Update connection string
export DB_HOST=ologywood-staging-restored.xxxxx.rds.amazonaws.com

# Restart application
docker restart ologywood-staging
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database schema created
- [ ] Database indexes deployed
- [ ] Application built successfully
- [ ] Application deployed to staging
- [ ] Health checks passing
- [ ] Security middleware enabled
- [ ] Rate limiting configured
- [ ] SSL/TLS certificates installed
- [ ] External logging configured
- [ ] Monitoring dashboards created
- [ ] Alerts configured
- [ ] Test data seeded
- [ ] Smoke tests passing
- [ ] Security tests passing
- [ ] Performance baseline established
- [ ] Backups configured
- [ ] Disaster recovery tested
- [ ] Team access verified
- [ ] Documentation updated

## Post-Deployment Verification

```bash
# Run comprehensive verification script
cat > verify-staging.sh << 'EOF'
#!/bin/bash

echo "=== Ologywood Staging Deployment Verification ==="

# 1. Health Check
echo "1. Health Check..."
curl -s https://staging-api.ologywood.com/health | jq .

# 2. Database Connection
echo "2. Database Connection..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT version();"

# 3. Security Headers
echo "3. Security Headers..."
curl -I https://staging-api.ologywood.com/ | grep -E "Strict-Transport|Content-Security"

# 4. Rate Limiting
echo "4. Rate Limiting..."
curl -s -H "X-Forwarded-For: 127.0.0.1" https://staging-api.ologywood.com/trpc/contracts.list

# 5. Logging
echo "5. Logging..."
docker logs ologywood-staging | tail -10

# 6. Monitoring
echo "6. Monitoring..."
curl -s https://api.datadoghq.com/api/v1/validate \
  -H "DD-API-KEY: $DD_API_KEY"

echo "=== Verification Complete ==="
EOF

chmod +x verify-staging.sh
./verify-staging.sh
```

## Support & Troubleshooting

### Common Issues

**Issue: Database connection failed**
```bash
# Check database status
aws rds describe-db-instances --db-instance-identifier ologywood-staging

# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Test connection
psql -h staging-db.ologywood.com -U ologywood_staging -d ologywood_staging -c "SELECT 1;"
```

**Issue: Application won't start**
```bash
# Check logs
docker logs ologywood-staging

# Check environment variables
docker exec ologywood-staging env | grep DB_

# Restart application
docker restart ologywood-staging
```

**Issue: High response times**
```bash
# Check database performance
psql -h staging-db.ologywood.com -U ologywood_staging -d ologywood_staging -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check server resources
free -h
df -h
top -bn1 | head -20
```

---

**Deployment Guide Version:** 1.0  
**Last Updated:** January 16, 2026  
**Ready for Deployment:** ✅ Yes
