#!/bin/bash
set -e

# Ologywood Staging Rollback Script
# Usage: ./scripts/rollback-staging.sh

ENVIRONMENT="staging"
REGION="us-east-1"
CLUSTER_NAME="ologywood-$ENVIRONMENT"
SERVICE_NAME="ologywood-app"

echo "🔙 Rolling back $ENVIRONMENT deployment"
echo ""

# Step 1: Get current task definition
echo "📋 Step 1: Getting current task definition..."
CURRENT_TASK_DEF=$(aws ecs describe-services \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $REGION \
  --query 'services[0].taskDefinition' \
  --output text)

echo "Current task definition: $CURRENT_TASK_DEF"

# Step 2: Get previous task definition revision
echo ""
echo "📋 Step 2: Getting previous task definition..."
TASK_FAMILY=$(echo $CURRENT_TASK_DEF | cut -d':' -f6 | cut -d'/' -f2)
CURRENT_REVISION=$(echo $CURRENT_TASK_DEF | cut -d':' -f7)
PREVIOUS_REVISION=$((CURRENT_REVISION - 1))

if [ $PREVIOUS_REVISION -lt 1 ]; then
  echo "❌ No previous revision available"
  exit 1
fi

PREVIOUS_TASK_DEF="$TASK_FAMILY:$PREVIOUS_REVISION"
echo "Previous task definition: $PREVIOUS_TASK_DEF"

# Step 3: Verify previous task definition exists
echo ""
echo "✅ Step 3: Verifying previous task definition..."
aws ecs describe-task-definition \
  --task-definition $PREVIOUS_TASK_DEF \
  --region $REGION > /dev/null

# Step 4: Update service with previous version
echo ""
echo "🔄 Step 4: Rolling back to previous version..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --task-definition $PREVIOUS_TASK_DEF \
  --region $REGION > /dev/null

# Step 5: Wait for rollback
echo ""
echo "⏳ Step 5: Waiting for rollback to complete..."
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $REGION

# Step 6: Verify rollback
echo ""
echo "🏥 Step 6: Verifying rollback..."
API_URL="https://$ENVIRONMENT-api.ologywood.com"

HEALTH=$(curl -s $API_URL/health | jq '.status' 2>/dev/null || echo '"error"')
if [ "$HEALTH" = '"ok"' ]; then
  echo "✅ API health: OK"
else
  echo "⚠️  API health: WARNING"
fi

echo ""
echo "✨ Rollback complete!"
echo ""
echo "📊 Rollback Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  From revision: $CURRENT_REVISION"
echo "  To revision: $PREVIOUS_REVISION"
echo "  API URL: $API_URL"
