# Complete GitHub Actions Setup Guide

## Overview

This guide walks you through setting up GitHub Actions for automated deployments to AWS ECS with CloudWatch monitoring and Slack notifications.

## Prerequisites

- GitHub repository with admin access
- AWS account with appropriate permissions
- Slack workspace (optional, for notifications)

## Step 1: Deploy CloudFormation Stack

### 1.1 Deploy IAM Role and Monitoring

```bash
# Set your variables
GITHUB_ORG="ologywood"
GITHUB_REPO="platform"
GITHUB_BRANCH="develop"
AWS_REGION="us-east-1"

# Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name ologywood-github-actions \
  --template-body file://cloudformation/github-actions-iam.yaml \
  --parameters \
    ParameterKey=GitHubOrganization,ParameterValue=$GITHUB_ORG \
    ParameterKey=GitHubRepository,ParameterValue=$GITHUB_REPO \
    ParameterKey=GitHubBranch,ParameterValue=$GITHUB_BRANCH \
  --capabilities CAPABILITY_NAMED_IAM \
  --region $AWS_REGION

# Wait for stack creation
aws cloudformation wait stack-create-complete \
  --stack-name ologywood-github-actions \
  --region $AWS_REGION

# Get the IAM role ARN
ROLE_ARN=$(aws cloudformation describe-stacks \
  --stack-name ologywood-github-actions \
  --query 'Stacks[0].Outputs[?OutputKey==`GitHubActionsRoleArn`].OutputValue' \
  --output text \
  --region $AWS_REGION)

echo "GitHub Actions Role ARN: $ROLE_ARN"
```

### 1.2 Verify Stack Creation

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name ologywood-github-actions \
  --region $AWS_REGION

# Verify IAM role was created
aws iam get-role --role-name GitHubActionsRole

# Verify CloudWatch dashboard was created
aws cloudwatch list-dashboards --region $AWS_REGION | grep ologywood
```

## Step 2: Configure GitHub Secrets

### 2.1 Add AWS Role ARN

1. Go to your GitHub repository
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Add the following secrets:

```
Name: AWS_ROLE_TO_ASSUME
Value: arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole
```

### 2.2 Add Slack Webhook (Optional)

1. Create a Slack App at https://api.slack.com/apps
2. Enable Incoming Webhooks
3. Create a new webhook for your channel
4. Add to GitHub Secrets:

```
Name: SLACK_WEBHOOK_URL
Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 2.3 Verify Secrets

```bash
# List secrets (names only, values are hidden)
gh secret list --repo ologywood/platform
```

## Step 3: Add Workflow Files to Repository

### 3.1 Create Workflow Directory

```bash
# Clone your repository
git clone https://github.com/ologywood/platform.git
cd platform

# Create workflow directory
mkdir -p .github/workflows

# Copy workflow files
cp ../ologywood/.github/workflows/deploy-staging.yml .github/workflows/
cp ../ologywood/.github/workflows/deploy-production.yml .github/workflows/
```

### 3.2 Commit and Push

```bash
# Add workflow files
git add .github/workflows/

# Commit
git commit -m "Add GitHub Actions CI/CD workflows"

# Push to develop branch
git push origin develop
```

### 3.3 Verify Workflow

1. Go to your GitHub repository
2. Click **Actions** tab
3. You should see **Deploy to Staging** workflow
4. Click on it to view details

## Step 4: Configure Health Check Script

### 4.1 Create Health Check Script

Create `scripts/health-check.sh`:

```bash
#!/bin/bash
set -e

ENVIRONMENT=$1
API_URL="https://${ENVIRONMENT}-api.ologywood.com"

echo "🏥 Running health checks for $ENVIRONMENT..."

# Check API health
echo "Checking API health..."
HEALTH=$(curl -s -m 10 $API_URL/health | jq '.status' 2>/dev/null || echo '"error"')

if [ "$HEALTH" = '"ok"' ]; then
  echo "✅ API health: OK"
else
  echo "❌ API health: FAILED"
  exit 1
fi

# Check database connectivity
echo "Checking database connectivity..."
DB_STATUS=$(curl -s -m 10 -X POST $API_URL/trpc/health.checkDatabase | jq '.ok' 2>/dev/null || echo 'false')

if [ "$DB_STATUS" = 'true' ]; then
  echo "✅ Database: OK"
else
  echo "⚠️  Database: WARNING (may be initializing)"
fi

# Check response time
echo "Checking response time..."
RESPONSE_TIME=$(curl -s -w '%{time_total}' -o /dev/null $API_URL/health)
RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc)

if (( $(echo "$RESPONSE_TIME < 1" | bc -l) )); then
  echo "✅ Response time: ${RESPONSE_TIME_MS}ms (OK)"
else
  echo "⚠️  Response time: ${RESPONSE_TIME_MS}ms (SLOW)"
fi

echo ""
echo "✨ Health checks passed!"
```

### 4.2 Make Script Executable

```bash
chmod +x scripts/health-check.sh
git add scripts/health-check.sh
git commit -m "Add health check script"
git push origin develop
```

## Step 5: Test Workflow

### 5.1 Trigger Manual Workflow

```bash
# Trigger workflow manually
gh workflow run deploy-staging.yml --repo ologywood/platform

# Watch workflow progress
gh run watch --repo ologywood/platform
```

### 5.2 Monitor Workflow

1. Go to **Actions** tab in GitHub
2. Click on the running workflow
3. View real-time logs for each step
4. Check Slack for notifications (if configured)

## Step 6: Configure CloudWatch Monitoring

### 6.1 Access CloudWatch Dashboard

```bash
# Get dashboard URL
aws cloudformation describe-stacks \
  --stack-name ologywood-github-actions \
  --query 'Stacks[0].Outputs[?OutputKey==`DashboardURL`].OutputValue' \
  --output text
```

### 6.2 View Metrics

1. Open the CloudWatch dashboard URL
2. Monitor these key metrics:
   - **CPU Utilization** - Should stay below 80%
   - **Memory Utilization** - Should stay below 85%
   - **Response Time** - Should be < 1 second
   - **Error Rate** - Should be < 1% of requests

### 6.3 Configure Slack Notifications

```bash
# Get SNS Topic ARN
SNS_ARN=$(aws cloudformation describe-stacks \
  --stack-name ologywood-github-actions \
  --query 'Stacks[0].Outputs[?OutputKey==`SNSTopicArn`].OutputValue' \
  --output text)

# Subscribe to SNS topic
aws sns subscribe \
  --topic-arn $SNS_ARN \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Step 7: Troubleshooting

### Issue: Workflow fails with "AssumeRole failed"

**Solution:**
```bash
# Verify OIDC provider exists
aws iam list-open-id-connect-providers

# If not found, create it
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### Issue: ECR login fails

**Solution:**
```bash
# Verify ECR repository exists
aws ecr describe-repositories --repository-names ologywood

# If not found, create it
aws ecr create-repository --repository-name ologywood
```

### Issue: ECS update fails

**Solution:**
```bash
# Check service exists
aws ecs describe-services \
  --cluster ologywood-staging \
  --services ologywood-app

# Check task definition
aws ecs describe-task-definition \
  --task-definition ologywood-staging
```

### Issue: Health check fails

**Solution:**
```bash
# Check API endpoint is accessible
curl -v https://staging-api.ologywood.com/health

# Check security group allows traffic
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=ologywood-staging-sg"

# Check ALB is healthy
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:REGION:ACCOUNT:targetgroup/ologywood-staging/ID
```

## Step 8: Advanced Configuration

### 8.1 Add Approval Gate for Production

Edit `.github/workflows/deploy-production.yml`:

```yaml
deploy-production:
  needs: build-and-deploy
  environment:
    name: production
    reviewers:
      - your-github-username
  runs-on: ubuntu-latest
  # ... rest of job
```

### 8.2 Add Slack Channel Notifications

```yaml
- name: Notify Slack channel
  uses: slackapi/slack-github-action@v1
  with:
    channel-id: C123456789  # Your Slack channel ID
    slack-message: "Deployment to ${{ matrix.environment }} completed"
```

### 8.3 Add Deployment Metrics

```yaml
- name: Report deployment metrics
  run: |
    echo "Deployment Duration: ${{ job.duration }}"
    echo "Deployment Status: ${{ job.status }}"
    echo "Commit: ${{ github.sha }}"
    echo "Author: ${{ github.actor }}"
```

## Monitoring Checklist

- [ ] CloudFormation stack created successfully
- [ ] GitHub secrets configured (AWS_ROLE_TO_ASSUME, SLACK_WEBHOOK_URL)
- [ ] Workflow files committed to repository
- [ ] Health check script is executable
- [ ] Manual workflow trigger successful
- [ ] CloudWatch dashboard displays metrics
- [ ] SNS alerts configured
- [ ] Slack notifications working (if enabled)
- [ ] Production approval gate configured (if needed)

## Next Steps

1. **Automate Staging Deployments** - Workflow will automatically deploy on every push to develop branch
2. **Set Up Production Deployments** - Create releases to trigger production deployments
3. **Monitor Metrics** - Check CloudWatch dashboard daily for performance issues
4. **Optimize Performance** - Use metrics to identify and fix bottlenecks

---

**Version:** 1.0  
**Last Updated:** January 16, 2026  
**Status:** Ready for Production ✅
