# GitHub Actions Deployment - Step-by-Step Execution Guide

## Prerequisites

Before starting, ensure you have:
- AWS CLI installed and configured
- GitHub CLI installed and authenticated
- Git installed and configured
- jq installed for JSON parsing
- Admin access to your GitHub repository
- AWS account with appropriate permissions

## Installation Commands

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Install jq
sudo apt-get install jq

# Authenticate with GitHub
gh auth login
# Follow prompts to authenticate

# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID and Secret Access Key
```

## Step 1: Set Environment Variables

```bash
# Set your configuration
export GITHUB_ORG="ologywood"
export GITHUB_REPO="platform"
export GITHUB_BRANCH="develop"
export AWS_REGION="us-east-1"
export STACK_NAME="ologywood-github-actions"

# Get AWS Account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $AWS_ACCOUNT_ID"

# Optional: Set Slack webhook for notifications
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

## Step 2: Verify Prerequisites

```bash
# Check AWS CLI
aws --version

# Check GitHub CLI
gh --version

# Check AWS authentication
aws sts get-caller-identity

# Check GitHub authentication
gh auth status

# Check jq
jq --version
```

## Step 3: Deploy CloudFormation Stack

### Option A: Using AWS CLI (Recommended)

```bash
# Deploy the stack
aws cloudformation create-stack \
  --stack-name $STACK_NAME \
  --template-body file://cloudformation/github-actions-iam.yaml \
  --parameters \
    ParameterKey=GitHubOrganization,ParameterValue=$GITHUB_ORG \
    ParameterKey=GitHubRepository,ParameterValue=$GITHUB_REPO \
    ParameterKey=GitHubBranch,ParameterValue=$GITHUB_BRANCH \
  --capabilities CAPABILITY_NAMED_IAM \
  --region $AWS_REGION

# Wait for stack creation to complete
aws cloudformation wait stack-create-complete \
  --stack-name $STACK_NAME \
  --region $AWS_REGION

# Verify stack creation
aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $AWS_REGION \
  --query 'Stacks[0].StackStatus' \
  --output text
```

### Option B: Using AWS Console

1. Go to CloudFormation console
2. Click "Create Stack"
3. Upload `cloudformation/github-actions-iam.yaml`
4. Fill in parameters:
   - GitHubOrganization: ologywood
   - GitHubRepository: platform
   - GitHubBranch: develop
5. Click "Create Stack"
6. Wait for stack creation to complete

## Step 4: Get Stack Outputs

```bash
# Get IAM Role ARN
export ROLE_ARN=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`GitHubActionsRoleArn`].OutputValue' \
  --output text \
  --region $AWS_REGION)

echo "Role ARN: $ROLE_ARN"

# Get CloudWatch Dashboard URL
export DASHBOARD_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`DashboardURL`].OutputValue' \
  --output text \
  --region $AWS_REGION)

echo "Dashboard URL: $DASHBOARD_URL"

# Get SNS Topic ARN
export SNS_TOPIC_ARN=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`SNSTopicArn`].OutputValue' \
  --output text \
  --region $AWS_REGION)

echo "SNS Topic ARN: $SNS_TOPIC_ARN"
```

## Step 5: Configure GitHub Secrets

### Option A: Using GitHub CLI (Recommended)

```bash
# Set AWS_ROLE_TO_ASSUME secret
gh secret set AWS_ROLE_TO_ASSUME \
  --body "$ROLE_ARN" \
  --repo "$GITHUB_ORG/$GITHUB_REPO"

echo "✅ AWS_ROLE_TO_ASSUME secret configured"

# Set SLACK_WEBHOOK_URL secret (optional)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
  gh secret set SLACK_WEBHOOK_URL \
    --body "$SLACK_WEBHOOK_URL" \
    --repo "$GITHUB_ORG/$GITHUB_REPO"
  echo "✅ SLACK_WEBHOOK_URL secret configured"
fi

# Verify secrets
gh secret list --repo "$GITHUB_ORG/$GITHUB_REPO"
```

### Option B: Using GitHub Web Interface

1. Go to your repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add `AWS_ROLE_TO_ASSUME` with value: `$ROLE_ARN`
5. Add `SLACK_WEBHOOK_URL` with your Slack webhook URL (optional)

## Step 6: Deploy Workflow Files

### Option A: Using Git Commands

```bash
# Clone repository (if not already cloned)
git clone https://github.com/$GITHUB_ORG/$GITHUB_REPO.git
cd $GITHUB_REPO

# Create workflow directory
mkdir -p .github/workflows

# Copy workflow files from the source
# Make sure you have the workflow files available
cp ../.github/workflows/deploy-staging.yml .github/workflows/
cp ../.github/workflows/deploy-production.yml .github/workflows/

# Add to git
git add .github/workflows/

# Commit
git commit -m "Add GitHub Actions CI/CD workflows"

# Push to develop branch
git push origin $GITHUB_BRANCH
```

### Option B: Using GitHub Web Interface

1. Go to your repository
2. Click "Add file" → "Create new file"
3. Enter path: `.github/workflows/deploy-staging.yml`
4. Paste the content from `.github/workflows/deploy-staging.yml`
5. Click "Commit changes"
6. Repeat for `deploy-production.yml`

## Step 7: Verify Deployment

```bash
# Check CloudFormation stack status
aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $AWS_REGION \
  --query 'Stacks[0].StackStatus' \
  --output text

# Verify IAM role was created
aws iam get-role --role-name GitHubActionsRole

# Verify CloudWatch dashboard
aws cloudwatch list-dashboards \
  --region $AWS_REGION \
  | grep ologywood

# Verify GitHub secrets
gh secret list --repo "$GITHUB_ORG/$GITHUB_REPO"

# Verify workflow files
gh workflow list --repo "$GITHUB_ORG/$GITHUB_REPO"

# Check workflow status
gh run list --repo "$GITHUB_ORG/$GITHUB_REPO"
```

## Step 8: Test Deployment

```bash
# Trigger workflow manually
gh workflow run deploy-staging.yml \
  --repo "$GITHUB_ORG/$GITHUB_REPO" \
  --ref $GITHUB_BRANCH

# Watch workflow progress
gh run watch --repo "$GITHUB_ORG/$GITHUB_REPO"

# View workflow logs
gh run view --log --repo "$GITHUB_ORG/$GITHUB_REPO"
```

## Step 9: Configure SNS Notifications

```bash
# Subscribe to SNS topic for email notifications
aws sns subscribe \
  --topic-arn $SNS_TOPIC_ARN \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region $AWS_REGION

# Confirm subscription (check your email)
```

## Step 10: Monitor Deployment

```bash
# View CloudWatch dashboard
echo "Dashboard URL: $DASHBOARD_URL"

# Check recent deployments
gh run list --repo "$GITHUB_ORG/$GITHUB_REPO" --limit 10

# View deployment logs
gh run view LATEST --log --repo "$GITHUB_ORG/$GITHUB_REPO"

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region $AWS_REGION
```

## Troubleshooting

### CloudFormation Stack Creation Failed

```bash
# Check stack events
aws cloudformation describe-stack-events \
  --stack-name $STACK_NAME \
  --region $AWS_REGION \
  --query 'StackEvents[*].[Timestamp,ResourceStatus,ResourceStatusReason]' \
  --output table

# Delete failed stack
aws cloudformation delete-stack \
  --stack-name $STACK_NAME \
  --region $AWS_REGION

# Retry deployment
aws cloudformation create-stack \
  --stack-name $STACK_NAME \
  --template-body file://cloudformation/github-actions-iam.yaml \
  --parameters \
    ParameterKey=GitHubOrganization,ParameterValue=$GITHUB_ORG \
    ParameterKey=GitHubRepository,ParameterValue=$GITHUB_REPO \
    ParameterKey=GitHubBranch,ParameterValue=$GITHUB_BRANCH \
  --capabilities CAPABILITY_NAMED_IAM \
  --region $AWS_REGION
```

### GitHub Secrets Not Found

```bash
# List all secrets
gh secret list --repo "$GITHUB_ORG/$GITHUB_REPO"

# Remove and recreate secret
gh secret delete AWS_ROLE_TO_ASSUME --repo "$GITHUB_ORG/$GITHUB_REPO"
gh secret set AWS_ROLE_TO_ASSUME --body "$ROLE_ARN" --repo "$GITHUB_ORG/$GITHUB_REPO"
```

### Workflow Not Triggering

```bash
# Check workflow file syntax
gh workflow view deploy-staging.yml --repo "$GITHUB_ORG/$GITHUB_REPO"

# Check branch protection rules
# Settings → Branches → Branch protection rules

# Verify workflow is enabled
gh workflow enable deploy-staging.yml --repo "$GITHUB_ORG/$GITHUB_REPO"

# Trigger manually
gh workflow run deploy-staging.yml --repo "$GITHUB_ORG/$GITHUB_REPO"
```

## Quick Reference Commands

```bash
# View all deployments
gh run list --repo "$GITHUB_ORG/$GITHUB_REPO"

# View specific deployment
gh run view RUN_ID --repo "$GITHUB_ORG/$GITHUB_REPO"

# View deployment logs
gh run view RUN_ID --log --repo "$GITHUB_ORG/$GITHUB_REPO"

# Cancel deployment
gh run cancel RUN_ID --repo "$GITHUB_ORG/$GITHUB_REPO"

# Rerun deployment
gh run rerun RUN_ID --repo "$GITHUB_ORG/$GITHUB_REPO"

# View CloudWatch dashboard
open "$DASHBOARD_URL"

# Check ECS service status
aws ecs describe-services \
  --cluster ologywood-staging \
  --services ologywood-app \
  --region $AWS_REGION

# View ECS logs
aws logs tail /ecs/ologywood-staging --follow --region $AWS_REGION
```

---

**Version:** 1.0  
**Last Updated:** January 16, 2026  
**Status:** Ready for Production ✅
