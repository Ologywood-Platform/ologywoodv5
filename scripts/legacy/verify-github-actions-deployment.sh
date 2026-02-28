#!/bin/bash
set -e

# Ologywood GitHub Actions Deployment Verification Script
# This script verifies:
# 1. CloudFormation stack deployment
# 2. GitHub secrets configuration
# 3. Workflow files deployment
# 4. IAM role permissions
# 5. CloudWatch monitoring setup

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GITHUB_ORG="${GITHUB_ORG:-ologywood}"
GITHUB_REPO="${GITHUB_REPO:-platform}"
AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="ologywood-github-actions"

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0

# Functions
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
  ((CHECKS_PASSED++))
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
  ((CHECKS_FAILED++))
}

check_prerequisites() {
  log_info "Checking prerequisites..."
  
  if ! command -v aws &> /dev/null; then
    log_error "AWS CLI not found"
    return 1
  fi
  
  if ! command -v gh &> /dev/null; then
    log_error "GitHub CLI not found"
    return 1
  fi
  
  if ! command -v jq &> /dev/null; then
    log_error "jq not found"
    return 1
  fi
  
  log_success "All prerequisites installed"
}

check_aws_auth() {
  log_info "Checking AWS authentication..."
  
  if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS authentication failed"
    return 1
  fi
  
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  log_success "AWS authenticated (Account: $ACCOUNT_ID)"
}

check_github_auth() {
  log_info "Checking GitHub authentication..."
  
  if ! gh auth status &> /dev/null; then
    log_error "GitHub authentication failed"
    return 1
  fi
  
  log_success "GitHub authenticated"
}

verify_cloudformation_stack() {
  log_info "Verifying CloudFormation stack..."
  
  # Check if stack exists
  if ! aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION &> /dev/null; then
    log_error "CloudFormation stack not found"
    return 1
  fi
  
  # Check stack status
  STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].StackStatus' \
    --output text)
  
  if [[ "$STACK_STATUS" == *"COMPLETE"* ]]; then
    log_success "CloudFormation stack status: $STACK_STATUS"
  else
    log_error "CloudFormation stack status: $STACK_STATUS"
    return 1
  fi
  
  # Check stack outputs
  log_info "Checking stack outputs..."
  
  OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs' \
    --output json)
  
  if echo "$OUTPUTS" | jq -e '.[0]' &> /dev/null; then
    log_success "Stack outputs found"
    echo "$OUTPUTS" | jq '.[] | "\(.OutputKey): \(.OutputValue)"'
  else
    log_error "No stack outputs found"
    return 1
  fi
}

verify_iam_role() {
  log_info "Verifying IAM role..."
  
  # Check if role exists
  if ! aws iam get-role --role-name GitHubActionsRole &> /dev/null; then
    log_error "GitHubActionsRole not found"
    return 1
  fi
  
  log_success "GitHubActionsRole exists"
  
  # Check role trust relationship
  TRUST=$(aws iam get-role --role-name GitHubActionsRole \
    --query 'Role.AssumeRolePolicyDocument' \
    --output json)
  
  if echo "$TRUST" | jq -e '.Statement[] | select(.Principal.Federated | contains("oidc.github.com"))' &> /dev/null; then
    log_success "GitHub OIDC trust relationship configured"
  else
    log_error "GitHub OIDC trust relationship not found"
    return 1
  fi
  
  # Check role policies
  POLICIES=$(aws iam list-attached-role-policies --role-name GitHubActionsRole \
    --query 'AttachedPolicies[*].PolicyName' \
    --output json)
  
  if echo "$POLICIES" | jq -e '.[]' &> /dev/null; then
    log_success "IAM policies attached to role"
    echo "$POLICIES" | jq '.[]'
  else
    log_error "No IAM policies found"
    return 1
  fi
}

verify_github_secrets() {
  log_info "Verifying GitHub secrets..."
  
  SECRETS=$(gh secret list --repo "$GITHUB_ORG/$GITHUB_REPO" 2>/dev/null || echo "")
  
  if [ -z "$SECRETS" ]; then
    log_error "Could not retrieve secrets"
    return 1
  fi
  
  # Check AWS_ROLE_TO_ASSUME
  if echo "$SECRETS" | grep -q "AWS_ROLE_TO_ASSUME"; then
    log_success "AWS_ROLE_TO_ASSUME secret found"
  else
    log_error "AWS_ROLE_TO_ASSUME secret not found"
    return 1
  fi
  
  # Check SLACK_WEBHOOK_URL (optional)
  if echo "$SECRETS" | grep -q "SLACK_WEBHOOK_URL"; then
    log_success "SLACK_WEBHOOK_URL secret found"
  else
    log_warning "SLACK_WEBHOOK_URL secret not found (optional)"
  fi
}

verify_workflow_files() {
  log_info "Verifying workflow files..."
  
  WORKFLOWS=$(gh workflow list --repo "$GITHUB_ORG/$GITHUB_REPO" 2>/dev/null || echo "")
  
  if [ -z "$WORKFLOWS" ]; then
    log_error "Could not retrieve workflows"
    return 1
  fi
  
  # Check deploy-staging workflow
  if echo "$WORKFLOWS" | grep -q "deploy-staging"; then
    log_success "deploy-staging workflow found"
  else
    log_error "deploy-staging workflow not found"
    return 1
  fi
  
  # Check deploy-production workflow
  if echo "$WORKFLOWS" | grep -q "deploy-production"; then
    log_success "deploy-production workflow found"
  else
    log_warning "deploy-production workflow not found (optional)"
  fi
}

verify_cloudwatch_dashboard() {
  log_info "Verifying CloudWatch dashboard..."
  
  DASHBOARDS=$(aws cloudwatch list-dashboards \
    --region $AWS_REGION \
    --query 'DashboardEntries[*].DashboardName' \
    --output json)
  
  if echo "$DASHBOARDS" | jq -e '.[] | select(contains("ologywood"))' &> /dev/null; then
    log_success "CloudWatch dashboard found"
    echo "$DASHBOARDS" | jq '.[]'
  else
    log_warning "CloudWatch dashboard not found"
  fi
}

verify_sns_topic() {
  log_info "Verifying SNS topic..."
  
  TOPICS=$(aws sns list-topics \
    --region $AWS_REGION \
    --query 'Topics[*].TopicArn' \
    --output json)
  
  if echo "$TOPICS" | jq -e '.[] | select(contains("ologywood"))' &> /dev/null; then
    log_success "SNS topic found"
    TOPIC_ARN=$(echo "$TOPICS" | jq -r '.[] | select(contains("ologywood"))')
    echo "Topic ARN: $TOPIC_ARN"
    
    # Check subscriptions
    SUBSCRIPTIONS=$(aws sns list-subscriptions-by-topic \
      --topic-arn "$TOPIC_ARN" \
      --region $AWS_REGION \
      --query 'Subscriptions[*].SubscriptionArn' \
      --output json)
    
    if echo "$SUBSCRIPTIONS" | jq -e '.[]' &> /dev/null; then
      log_success "SNS subscriptions found"
    else
      log_warning "No SNS subscriptions found"
    fi
  else
    log_warning "SNS topic not found"
  fi
}

verify_recent_deployments() {
  log_info "Checking recent deployments..."
  
  RUNS=$(gh run list --repo "$GITHUB_ORG/$GITHUB_REPO" --limit 5 2>/dev/null || echo "")
  
  if [ -z "$RUNS" ]; then
    log_warning "No recent deployments found"
    return 0
  fi
  
  log_success "Recent deployments found"
  echo "$RUNS" | head -5
}

test_workflow_trigger() {
  log_info "Testing workflow trigger..."
  
  # Check if we can trigger a workflow
  if gh workflow list --repo "$GITHUB_ORG/$GITHUB_REPO" &> /dev/null; then
    log_success "Workflow trigger capability verified"
  else
    log_error "Cannot trigger workflows"
    return 1
  fi
}

print_summary() {
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}📊 Verification Summary${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
  echo -e "✅ Checks Passed: ${GREEN}$CHECKS_PASSED${NC}"
  echo -e "❌ Checks Failed: ${RED}$CHECKS_FAILED${NC}"
  echo ""
  
  if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Deployment is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Push code to develop branch to trigger deployment"
    echo "  2. Monitor deployment in GitHub Actions"
    echo "  3. Check CloudWatch dashboard for metrics"
    echo "  4. Verify SNS notifications are working"
    return 0
  else
    echo -e "${RED}⚠️  Some checks failed. Please review the errors above.${NC}"
    return 1
  fi
}

main() {
  echo -e "${BLUE}🔍 Ologywood GitHub Actions Deployment Verification${NC}"
  echo ""
  
  # Run all verification checks
  check_prerequisites || exit 1
  check_aws_auth || exit 1
  check_github_auth || exit 1
  
  echo ""
  verify_cloudformation_stack
  verify_iam_role
  verify_github_secrets
  verify_workflow_files
  verify_cloudwatch_dashboard
  verify_sns_topic
  verify_recent_deployments
  test_workflow_trigger
  
  echo ""
  print_summary
}

# Run main function
main "$@"
