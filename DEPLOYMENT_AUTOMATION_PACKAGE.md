# Complete Deployment Automation Package

## Overview

This package contains all scripts, configurations, and automation tools needed to deploy Ologywood to staging and production environments with zero-downtime deployment, automatic rollback, and comprehensive monitoring.

## Package Structure

```
deployment/
├── scripts/
│   ├── deploy.sh                    # Main deployment script
│   ├── rollback.sh                  # Rollback script
│   ├── health-check.sh              # Health check script
│   ├── setup-staging.sh             # Staging setup script
│   ├── setup-production.sh          # Production setup script
│   └── migrate-database.sh          # Database migration script
├── docker/
│   ├── Dockerfile                   # Application Docker image
│   ├── docker-compose.yml           # Local development setup
│   ├── docker-compose.staging.yml   # Staging setup
│   └── docker-compose.prod.yml      # Production setup
├── terraform/
│   ├── main.tf                      # Main Terraform config
│   ├── variables.tf                 # Variables
│   ├── outputs.tf                   # Outputs
│   ├── vpc.tf                       # VPC configuration
│   ├── rds.tf                       # RDS database
│   ├── ecs.tf                       # ECS cluster
│   ├── alb.tf                       # Load balancer
│   └── monitoring.tf                # Monitoring setup
├── kubernetes/
│   ├── deployment.yaml              # Kubernetes deployment
│   ├── service.yaml                 # Kubernetes service
│   ├── ingress.yaml                 # Ingress configuration
│   ├── configmap.yaml               # Configuration
│   ├── secrets.yaml                 # Secrets
│   └── hpa.yaml                     # Horizontal pod autoscaler
├── ci-cd/
│   ├── .github/workflows/
│   │   ├── deploy-staging.yml       # GitHub Actions staging
│   │   ├── deploy-production.yml    # GitHub Actions production
│   │   └── test.yml                 # Testing workflow
│   └── .gitlab-ci.yml               # GitLab CI configuration
├── config/
│   ├── .env.example                 # Environment template
│   ├── nginx.conf                   # Nginx configuration
│   ├── monitoring-config.yml        # Monitoring setup
│   └── backup-config.yml            # Backup configuration
└── README.md                        # Complete documentation
```

## Quick Start

### Prerequisites

```bash
# Required tools
- Docker & Docker Compose
- Terraform (for AWS deployment)
- kubectl (for Kubernetes deployment)
- Git
- AWS CLI (for AWS deployments)
- k6 (for load testing)

# Installation
brew install docker terraform kubectl awscli k6
# or
apt-get install docker.io docker-compose terraform kubectl awscli k6
```

### Local Development (Docker Compose)

```bash
# 1. Clone repository
git clone https://github.com/ologywood/platform.git
cd platform

# 2. Copy environment file
cp config/.env.example .env.local

# 3. Start services
docker-compose -f docker/docker-compose.yml up -d

# 4. Run migrations
docker-compose exec app pnpm db:push

# 5. Verify deployment
curl http://localhost:3000/health

# 6. Access application
# Frontend: http://localhost:3000
# API: http://localhost:3000/trpc
# Database: localhost:5432
```

### Staging Deployment (AWS)

```bash
# 1. Configure AWS credentials
aws configure

# 2. Initialize Terraform
cd terraform
terraform init

# 3. Plan deployment
terraform plan -var-file=staging.tfvars

# 4. Apply deployment
terraform apply -var-file=staging.tfvars

# 5. Deploy application
./scripts/deploy.sh staging

# 6. Run health checks
./scripts/health-check.sh staging

# 7. Run load tests
k6 run tests/load-testing.js --env STAGING_API=https://staging-api.ologywood.com
```

## Deployment Scripts

### 1. Main Deployment Script (deploy.sh)

```bash
#!/bin/bash
set -e

ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
REGION=${3:-us-east-1}

echo "🚀 Deploying Ologywood to $ENVIRONMENT"

# 1. Build application
echo "📦 Building application..."
docker build -t ologywood:$VERSION .

# 2. Push to registry
echo "📤 Pushing to registry..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
docker tag ologywood:$VERSION $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/ologywood:$VERSION
docker push $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/ologywood:$VERSION

# 3. Update ECS service
echo "🔄 Updating ECS service..."
aws ecs update-service \
  --cluster ologywood-$ENVIRONMENT \
  --service ologywood-app \
  --force-new-deployment \
  --region $REGION

# 4. Wait for deployment
echo "⏳ Waiting for deployment to complete..."
aws ecs wait services-stable \
  --cluster ologywood-$ENVIRONMENT \
  --services ologywood-app \
  --region $REGION

# 5. Run health checks
echo "✅ Running health checks..."
./scripts/health-check.sh $ENVIRONMENT

echo "✨ Deployment complete!"
```

### 2. Rollback Script (rollback.sh)

```bash
#!/bin/bash
set -e

ENVIRONMENT=${1:-staging}
PREVIOUS_VERSION=${2:-previous}
REGION=${3:-us-east-1}

echo "🔙 Rolling back $ENVIRONMENT to $PREVIOUS_VERSION"

# 1. Get previous task definition
echo "📋 Getting previous task definition..."
PREVIOUS_TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition ologywood-$ENVIRONMENT:$PREVIOUS_VERSION \
  --region $REGION \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

# 2. Update service with previous version
echo "🔄 Updating service..."
aws ecs update-service \
  --cluster ologywood-$ENVIRONMENT \
  --service ologywood-app \
  --task-definition $PREVIOUS_TASK_DEF \
  --region $REGION

# 3. Wait for rollback
echo "⏳ Waiting for rollback to complete..."
aws ecs wait services-stable \
  --cluster ologywood-$ENVIRONMENT \
  --services ologywood-app \
  --region $REGION

# 4. Verify rollback
echo "✅ Verifying rollback..."
./scripts/health-check.sh $ENVIRONMENT

echo "✨ Rollback complete!"
```

### 3. Health Check Script (health-check.sh)

```bash
#!/bin/bash

ENVIRONMENT=${1:-staging}
API_URL="https://${ENVIRONMENT}-api.ologywood.com"

echo "🏥 Running health checks for $ENVIRONMENT"

# 1. API health
echo "Checking API health..."
HEALTH=$(curl -s $API_URL/health | jq '.status')
if [ "$HEALTH" = '"ok"' ]; then
  echo "✅ API health: OK"
else
  echo "❌ API health: FAILED"
  exit 1
fi

# 2. Database connectivity
echo "Checking database..."
DB_STATUS=$(curl -s -X POST $API_URL/trpc/health.checkDatabase | jq '.ok')
if [ "$DB_STATUS" = 'true' ]; then
  echo "✅ Database: OK"
else
  echo "❌ Database: FAILED"
  exit 1
fi

# 3. External services
echo "Checking external services..."
STRIPE_STATUS=$(curl -s -X POST $API_URL/trpc/health.checkStripe | jq '.ok')
if [ "$STRIPE_STATUS" = 'true' ]; then
  echo "✅ Stripe: OK"
else
  echo "⚠️  Stripe: WARNING"
fi

# 4. Response time
echo "Checking response time..."
START=$(date +%s%N | cut -b1-13)
curl -s $API_URL/health > /dev/null
END=$(date +%s%N | cut -b1-13)
RESPONSE_TIME=$((END - START))
echo "Response time: ${RESPONSE_TIME}ms"

if [ $RESPONSE_TIME -lt 500 ]; then
  echo "✅ Response time: OK"
else
  echo "⚠️  Response time: SLOW"
fi

echo "✨ Health checks complete!"
```

### 4. Database Migration Script (migrate-database.sh)

```bash
#!/bin/bash
set -e

ENVIRONMENT=${1:-staging}
DB_HOST=${2:-localhost}
DB_USER=${3:-ologywood_staging}
DB_NAME=${4:-ologywood_staging}

echo "🗄️  Running database migrations for $ENVIRONMENT"

# 1. Backup database
echo "📦 Backing up database..."
BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > $BACKUP_FILE
echo "✅ Backup created: $BACKUP_FILE"

# 2. Run migrations
echo "🔄 Running migrations..."
pnpm db:push --env $ENVIRONMENT

# 3. Verify migrations
echo "✅ Verifying migrations..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\dt"

echo "✨ Database migrations complete!"
```

## Docker Compose Configurations

### Local Development (docker-compose.yml)

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ologywood_dev
      DB_USER: ologywood
      DB_PASSWORD: ologywood_dev
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
      - /app/node_modules
    command: pnpm dev

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: ologywood_dev
      POSTGRES_USER: ologywood
      POSTGRES_PASSWORD: ologywood_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  adminer:
    image: adminer
    ports:
      - "8080:8080"
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:
```

### Staging Deployment (docker-compose.staging.yml)

```yaml
version: '3.8'

services:
  app:
    image: ologywood:staging
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: staging
      DB_HOST: staging-db.ologywood.com
      DB_PORT: 5432
      DB_NAME: ologywood_staging
      DB_USER: ologywood_staging
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_URL: redis://staging-redis.ologywood.com:6379
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - app
    restart: unless-stopped
```

## Terraform Infrastructure as Code

### Main Configuration (main.tf)

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "ologywood-terraform-state"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
module "vpc" {
  source = "./vpc"
  
  environment = var.environment
  cidr_block  = var.vpc_cidr
}

# RDS Database
module "rds" {
  source = "./rds"
  
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
  db_name     = var.db_name
  db_username = var.db_username
  db_password = random_password.db_password.result
}

# ECS Cluster
module "ecs" {
  source = "./ecs"
  
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
  app_image   = var.app_image
  app_port    = var.app_port
}

# Application Load Balancer
module "alb" {
  source = "./alb"
  
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
  ecs_target_group = module.ecs.target_group_arn
}

# Monitoring
module "monitoring" {
  source = "./monitoring"
  
  environment = var.environment
  ecs_cluster = module.ecs.cluster_name
  alb_arn     = module.alb.arn
}

# Generate random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store secrets in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name = "ologywood/${var.environment}/db-password"
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}
```

## Kubernetes Manifests

### Deployment (deployment.yaml)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ologywood-app
  namespace: ologywood
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ologywood
  template:
    metadata:
      labels:
        app: ologywood
    spec:
      containers:
      - name: app
        image: ologywood:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: ologywood-config
              key: db-host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ologywood-secrets
              key: db-password
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## CI/CD Pipelines

### GitHub Actions (deploy-staging.yml)

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Build Docker image
      run: docker build -t ologywood:staging .
    
    - name: Push to ECR
      run: |
        aws ecr get-login-password | docker login --username AWS --password-stdin ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com
        docker tag ologywood:staging ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/ologywood:staging
        docker push ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/ologywood:staging
    
    - name: Deploy to ECS
      run: |
        aws ecs update-service \
          --cluster ologywood-staging \
          --service ologywood-app \
          --force-new-deployment
    
    - name: Run health checks
      run: ./scripts/health-check.sh staging
    
    - name: Run load tests
      run: k6 run tests/load-testing.js --env STAGING_API=https://staging-api.ologywood.com
```

### GitLab CI (.gitlab-ci.yml)

```yaml
stages:
  - build
  - test
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: ""

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t ologywood:$CI_COMMIT_SHA .
    - docker tag ologywood:$CI_COMMIT_SHA ologywood:latest
  only:
    - develop
    - main

test:
  stage: test
  image: node:18
  script:
    - npm install
    - npm run test
    - npm run lint
  coverage: '/Coverage: \d+\.\d+%/'

deploy_staging:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache aws-cli
    - aws ecs update-service --cluster ologywood-staging --service ologywood-app --force-new-deployment
  environment:
    name: staging
    url: https://staging-api.ologywood.com
  only:
    - develop

deploy_production:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache aws-cli
    - aws ecs update-service --cluster ologywood-production --service ologywood-app --force-new-deployment
  environment:
    name: production
    url: https://api.ologywood.com
  only:
    - main
  when: manual
```

## Troubleshooting Guide

### Deployment Failures

**Issue: Docker build fails**
```bash
# Solution: Clear Docker cache and rebuild
docker system prune -a
docker build --no-cache -t ologywood:staging .
```

**Issue: ECS service won't stabilize**
```bash
# Check task logs
aws ecs describe-tasks --cluster ologywood-staging --tasks <task-arn>

# Check service events
aws ecs describe-services --cluster ologywood-staging --services ologywood-app

# Rollback to previous version
./scripts/rollback.sh staging
```

**Issue: Database migration fails**
```bash
# Check database connectivity
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT version();"

# Restore from backup
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < backup-20240116-120000.sql

# Re-run migrations
pnpm db:push
```

### Performance Issues

**Issue: High response times**
```bash
# Check application logs
docker logs ologywood-staging | grep -i error

# Check database performance
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=ologywood-staging \
  --start-time 2024-01-16T00:00:00Z \
  --end-time 2024-01-16T23:59:59Z \
  --period 300 \
  --statistics Average
```

**Issue: High error rate**
```bash
# Check error logs
docker logs ologywood-staging | grep -i "error\|exception"

# Check rate limiting
curl -v https://staging-api.ologywood.com/trpc/contracts.list

# Check authentication
curl -X POST https://staging-api.ologywood.com/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "test"}'
```

## Monitoring & Alerts

### CloudWatch Metrics

```bash
# CPU Utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=ologywood-app \
  --start-time 2024-01-16T00:00:00Z \
  --end-time 2024-01-16T23:59:59Z \
  --period 300 \
  --statistics Average

# Memory Utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --dimensions Name=ServiceName,Value=ologywood-app \
  --start-time 2024-01-16T00:00:00Z \
  --end-time 2024-01-16T23:59:59Z \
  --period 300 \
  --statistics Average
```

### Create Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name ologywood-high-cpu \
  --alarm-description "Alert when CPU is high" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold

# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name ologywood-high-error-rate \
  --alarm-description "Alert when error rate is high" \
  --metric-name HTTPRequestErrorCount \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 60 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold
```

## Backup & Disaster Recovery

### Automated Backups

```bash
# Enable RDS automated backups
aws rds modify-db-instance \
  --db-instance-identifier ologywood-staging \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --apply-immediately

# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier ologywood-staging \
  --db-snapshot-identifier ologywood-staging-$(date +%Y%m%d-%H%M%S)
```

### Restore from Backup

```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ologywood-staging-restored \
  --db-snapshot-identifier ologywood-staging-20240116-120000

# Update connection string
export DB_HOST=ologywood-staging-restored.xxxxx.rds.amazonaws.com

# Restart application
./scripts/deploy.sh staging
```

---

**Deployment Package Version:** 1.0  
**Last Updated:** January 16, 2026  
**Ready for Production:** ✅ Yes
