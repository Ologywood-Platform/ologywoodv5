#!/bin/bash
set -e

# Ologywood GitHub Actions Automated Deployment Script
# This script automates:
# 1. CloudFormation stack deployment for IAM roles and monitoring
# 2. GitHub secrets configuration
# 3. Workflow files deployment to GitHub

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GITHUB_ORG="${GITHUB_ORG:-ologywood}"
GITHUB_REPO="${GITHUB_REPO:-platform}"
GITHUB_BRANCH="${GITHUB_BRANCH:-develop}"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"
STACK_NAME="ologywood-github-actions"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

# Functions
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

check_prerequisites() {
  log_info "Checking prerequisites..."
  
  # Check AWS CLI
  if ! command -v aws &> /dev/null; then
    log_error "AWS CLI not found. Please install it: https://aws.amazon.com/cli/"
    exit 1
  fi
  
  # Check GitHub CLI
  if ! command -v gh &> /dev/null; then
    log_error "GitHub CLI not found. Please install it: https://cli.github.com/"
    exit 1
  fi
  
  # Check jq
  if ! command -v jq &> /dev/null; then
    log_error "jq not found. Please install it: https://stedolan.github.io/jq/"
    exit 1
  fi
  
  # Check git
  if ! command -v git &> /dev/null; then
    log_error "Git not found. Please install it: https://git-scm.com/"
    exit 1
  fi
  
  log_success "All prerequisites installed"
}

get_aws_account_id() {
  log_info "Getting AWS account ID..."
  
  if [ -z "$AWS_ACCOUNT_ID" ]; then
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  fi
  
  log_success "AWS Account ID: $AWS_ACCOUNT_ID"
}

check_github_auth() {
  log_info "Checking GitHub authentication..."
  
  if ! gh auth status &> /dev/null; then
    log_error "Not authenticated with GitHub. Please run: gh auth login"
    exit 1
  fi
  
  log_success "GitHub authentication verified"
}

deploy_cloudformation_stack() {
  log_info "Deploying CloudFormation stack..."
  
  # Check if stack already exists
  if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION &> /dev/null; then
    log_warning "Stack $STACK_NAME already exists. Updating..."
    aws cloudformation update-stack \
      --stack-name $STACK_NAME \
      --template-body file://cloudformation/github-actions-iam.yaml \
      --parameters \
        ParameterKey=GitHubOrganization,ParameterValue=$GITHUB_ORG \
        ParameterKey=GitHubRepository,ParameterValue=$GITHUB_REPO \
        ParameterKey=GitHubBranch,ParameterValue=$GITHUB_BRANCH \
      --capabilities CAPABILITY_NAMED_IAM \
      --region $AWS_REGION
    
    log_info "Waiting for stack update to complete..."
    aws cloudformation wait stack-update-complete \
      --stack-name $STACK_NAME \
      --region $AWS_REGION
  else
    log_info "Creating new CloudFormation stack..."
    aws cloudformation create-stack \
      --stack-name $STACK_NAME \
      --template-body file://cloudformation/github-actions-iam.yaml \
      --parameters \
        ParameterKey=GitHubOrganization,ParameterValue=$GITHUB_ORG \
        ParameterKey=GitHubRepository,ParameterValue=$GITHUB_REPO \
        ParameterKey=GitHubBranch,ParameterValue=$GITHUB_BRANCH \
      --capabilities CAPABILITY_NAMED_IAM \
      --region $AWS_REGION
    
    log_info "Waiting for stack creation to complete..."
    aws cloudformation wait stack-create-complete \
      --stack-name $STACK_NAME \
      --region $AWS_REGION
  fi
  
  log_success "CloudFormation stack deployed successfully"
}

get_stack_outputs() {
  log_info "Retrieving stack outputs..."
  
  ROLE_ARN=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`GitHubActionsRoleArn`].OutputValue' \
    --output text \
    --region $AWS_REGION)
  
  DASHBOARD_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`DashboardURL`].OutputValue' \
    --output text \
    --region $AWS_REGION)
  
  SNS_TOPIC_ARN=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`SNSTopicArn`].OutputValue' \
    --output text \
    --region $AWS_REGION)
  
  log_success "Stack outputs retrieved"
  log_info "Role ARN: $ROLE_ARN"
  log_info "Dashboard URL: $DASHBOARD_URL"
  log_info "SNS Topic ARN: $SNS_TOPIC_ARN"
}

configure_github_secrets() {
  log_info "Configuring GitHub secrets..."
  
  # Set AWS_ROLE_TO_ASSUME
  log_info "Setting AWS_ROLE_TO_ASSUME secret..."
  gh secret set AWS_ROLE_TO_ASSUME \
    --body "$ROLE_ARN" \
    --repo "$GITHUB_ORG/$GITHUB_REPO"
  log_success "AWS_ROLE_TO_ASSUME secret configured"
  
  # Set SLACK_WEBHOOK_URL if provided
  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    log_info "Setting SLACK_WEBHOOK_URL secret..."
    gh secret set SLACK_WEBHOOK_URL \
      --body "$SLACK_WEBHOOK_URL" \
      --repo "$GITHUB_ORG/$GITHUB_REPO"
    log_success "SLACK_WEBHOOK_URL secret configured"
  else
    log_warning "SLACK_WEBHOOK_URL not provided. Skipping Slack integration."
  fi
  
  log_success "GitHub secrets configured"
}

deploy_workflow_files() {
  log_info "Deploying workflow files to GitHub..."
  
  # Check if we're in a git repository
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not in a git repository. Please run this script from your repository root."
    exit 1
  fi
  
  # Create workflow directory if it doesn't exist
  mkdir -p .github/workflows
  
  # Copy workflow files
  log_info "Copying workflow files..."
  if [ -f ".github/workflows/deploy-staging.yml" ]; then
    log_warning "deploy-staging.yml already exists. Backing up..."
    mv .github/workflows/deploy-staging.yml .github/workflows/deploy-staging.yml.bak
  fi
  
  cp cloudformation/../.github/workflows/deploy-staging.yml .github/workflows/ 2>/dev/null || \
    log_warning "Could not copy deploy-staging.yml. Make sure it exists in the source directory."
  
  # Commit and push
  log_info "Committing and pushing workflow files..."
  git add .github/workflows/
  git commit -m "Add GitHub Actions CI/CD workflows" || log_warning "No changes to commit"
  git push origin $GITHUB_BRANCH
  
  log_success "Workflow files deployed to GitHub"
}

verify_deployment() {
  log_info "Verifying deployment..."
  
  # Verify CloudFormation stack
  log_info "Verifying CloudFormation stack..."
  STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].StackStatus' \
    --output text \
    --region $AWS_REGION)
  
  if [[ "$STACK_STATUS" == *"COMPLETE"* ]]; then
    log_success "CloudFormation stack status: $STACK_STATUS"
  else
    log_error "CloudFormation stack status: $STACK_STATUS"
    return 1
  fi
  
  # Verify GitHub secrets
  log_info "Verifying GitHub secrets..."
  if gh secret list --repo "$GITHUB_ORG/$GITHUB_REPO" | grep -q "AWS_ROLE_TO_ASSUME"; then
    log_success "AWS_ROLE_TO_ASSUME secret verified"
  else
    log_error "AWS_ROLE_TO_ASSUME secret not found"
    return 1
  fi
  
  # Verify workflow files
  log_info "Verifying workflow files..."
  if gh workflow list --repo "$GITHUB_ORG/$GITHUB_REPO" | grep -q "deploy-staging"; then
    log_success "Workflow files verified"
  else
    log_error "Workflow files not found"
    return 1
  fi
  
  log_success "Deployment verification complete"
}

print_summary() {
  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}✨ Deployment Complete!${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""
  echo "📊 Deployment Summary:"
  echo "  Organization: $GITHUB_ORG"
  echo "  Repository: $GITHUB_REPO"
  echo "  Branch: $GITHUB_BRANCH"
  echo "  AWS Region: $AWS_REGION"
  echo "  AWS Account: $AWS_ACCOUNT_ID"
  echo ""
  echo "🔐 Resources Created:"
  echo "  IAM Role: GitHubActionsRole"
  echo "  CloudWatch Dashboard: ologywood-staging-dashboard"
  echo "  SNS Topic: ologywood-staging-alerts"
  echo ""
  echo "📈 Monitoring:"
  echo "  Dashboard: $DASHBOARD_URL"
  echo "  SNS Topic: $SNS_TOPIC_ARN"
  echo ""
  echo "🚀 Next Steps:"
  echo "  1. Verify workflow in GitHub Actions tab"
  echo "  2. Check CloudWatch dashboard for metrics"
  echo "  3. Configure SNS email subscriptions"
  echo "  4. Test deployment by pushing to develop branch"
  echo ""
}

main() {
  echo -e "${BLUE}🚀 Ologywood GitHub Actions Deployment${NC}"
  echo ""
  
  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case $1 in
      --github-org)
        GITHUB_ORG="$2"
        shift 2
        ;;
      --github-repo)
        GITHUB_REPO="$2"
        shift 2
        ;;
      --github-branch)
        GITHUB_BRANCH="$2"
        shift 2
        ;;
      --aws-region)
        AWS_REGION="$2"
        shift 2
        ;;
      --slack-webhook)
        SLACK_WEBHOOK_URL="$2"
        shift 2
        ;;
      *)
        log_error "Unknown option: $1"
        echo "Usage: $0 [OPTIONS]"
        echo "Options:"
        echo "  --github-org ORG          GitHub organization (default: ologywood)"
        echo "  --github-repo REPO        GitHub repository (default: platform)"
        echo "  --github-branch BRANCH    GitHub branch (default: develop)"
        echo "  --aws-region REGION       AWS region (default: us-east-1)"
        echo "  --slack-webhook URL       Slack webhook URL (optional)"
        exit 1
        ;;
    esac
  done
  
  # Execute deployment steps
  check_prerequisites
  get_aws_account_id
  check_github_auth
  deploy_cloudformation_stack
  get_stack_outputs
  configure_github_secrets
  deploy_workflow_files
  verify_deployment
  print_summary
}

# Run main function
main "$@"
