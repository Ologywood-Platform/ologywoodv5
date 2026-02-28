#!/bin/bash
set -e

# Ologywood Staging Deployment Script
# Usage: ./scripts/deploy-staging.sh [version]

VERSION=${1:-latest}
ENVIRONMENT="staging"
REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
IMAGE_NAME="ologywood"
CLUSTER_NAME="ologywood-$ENVIRONMENT"
SERVICE_NAME="ologywood-app"

echo "🚀 Deploying Ologywood to $ENVIRONMENT"
echo "Version: $VERSION"
echo "Region: $REGION"
echo "Cluster: $CLUSTER_NAME"
echo ""

# Step 1: Build Docker image
echo "📦 Step 1: Building Docker image..."
docker build -t $IMAGE_NAME:$VERSION -f docker/Dockerfile .
echo "✅ Docker image built: $IMAGE_NAME:$VERSION"
echo ""

# Step 2: Login to ECR
echo "🔐 Step 2: Logging in to ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
echo "✅ Logged in to ECR"
echo ""

# Step 3: Tag and push image
echo "📤 Step 3: Tagging and pushing image to ECR..."
docker tag $IMAGE_NAME:$VERSION $ECR_REGISTRY/$IMAGE_NAME:$VERSION
docker tag $IMAGE_NAME:$VERSION $ECR_REGISTRY/$IMAGE_NAME:latest
docker push $ECR_REGISTRY/$IMAGE_NAME:$VERSION
docker push $ECR_REGISTRY/$IMAGE_NAME:latest
echo "✅ Image pushed to ECR"
echo ""

# Step 4: Update ECS service
echo "🔄 Step 4: Updating ECS service..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --force-new-deployment \
  --region $REGION > /dev/null
echo "✅ ECS service update initiated"
echo ""

# Step 5: Wait for deployment
echo "⏳ Step 5: Waiting for deployment to stabilize..."
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $REGION
echo "✅ Deployment stabilized"
echo ""

# Step 6: Run health checks
echo "🏥 Step 6: Running health checks..."
API_URL="https://$ENVIRONMENT-api.ologywood.com"

# Check API health
HEALTH=$(curl -s $API_URL/health | jq '.status' 2>/dev/null || echo '"error"')
if [ "$HEALTH" = '"ok"' ]; then
  echo "✅ API health: OK"
else
  echo "❌ API health: FAILED"
  echo "Rolling back deployment..."
  ./scripts/rollback-staging.sh
  exit 1
fi

# Check database connectivity
DB_STATUS=$(curl -s -X POST $API_URL/trpc/health.checkDatabase | jq '.ok' 2>/dev/null || echo 'false')
if [ "$DB_STATUS" = 'true' ]; then
  echo "✅ Database: OK"
else
  echo "⚠️  Database: WARNING (may be initializing)"
fi

echo ""
echo "✨ Deployment complete!"
echo ""
echo "📊 Deployment Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  Version: $VERSION"
echo "  Cluster: $CLUSTER_NAME"
echo "  Service: $SERVICE_NAME"
echo "  API URL: $API_URL"
echo ""
echo "Next steps:"
echo "  1. Monitor deployment: aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME"
echo "  2. View logs: aws logs tail /ecs/$SERVICE_NAME --follow"
echo "  3. Run load tests: k6 run tests/load-testing.js --env STAGING_API=$API_URL"
