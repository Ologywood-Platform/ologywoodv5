# Complete CI/CD Pipeline Setup Guide

## Overview

This guide provides complete setup instructions for automated CI/CD pipelines using GitHub Actions, GitLab CI, or Jenkins.

## GitHub Actions Setup

### 1. Create GitHub Actions Workflow Files

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: ologywood
  ECS_CLUSTER: ologywood-staging
  ECS_SERVICE: ologywood-app

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      id-token: write

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build, tag, and push image to Amazon ECR
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -f docker/Dockerfile .
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
        echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

    - name: Update ECS service
      run: |
        aws ecs update-service \
          --cluster ${{ env.ECS_CLUSTER }} \
          --service ${{ env.ECS_SERVICE }} \
          --force-new-deployment \
          --region ${{ env.AWS_REGION }}

    - name: Wait for service to stabilize
      run: |
        aws ecs wait services-stable \
          --cluster ${{ env.ECS_CLUSTER }} \
          --services ${{ env.ECS_SERVICE }} \
          --region ${{ env.AWS_REGION }}

    - name: Run health checks
      run: |
        chmod +x scripts/health-check.sh
        ./scripts/health-check.sh staging

    - name: Run load tests
      run: |
        npm install -g k6
        k6 run tests/load-testing.js --env STAGING_API=https://staging-api.ologywood.com

    - name: Notify Slack on success
      if: success()
      uses: slackapi/slack-github-action@v1
      with:
        payload: |
          {
            "text": "✅ Staging deployment successful",
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*Staging Deployment Successful*\nCommit: ${{ github.sha }}\nAuthor: ${{ github.actor }}"
                }
              }
            ]
          }
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

    - name: Notify Slack on failure
      if: failure()
      uses: slackapi/slack-github-action@v1
      with:
        payload: |
          {
            "text": "❌ Staging deployment failed",
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*Staging Deployment Failed*\nCommit: ${{ github.sha }}\nAuthor: ${{ github.actor }}"
                }
              }
            ]
          }
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  release:
    types: [published]
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: ologywood
  ECS_CLUSTER: ologywood-production
  ECS_SERVICE: ologywood-app

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    permissions:
      contents: read
      id-token: write

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build, tag, and push image to Amazon ECR
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.ref_name }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -f docker/Dockerfile .
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

    - name: Create backup
      run: |
        aws rds create-db-snapshot \
          --db-instance-identifier ologywood-production \
          --db-snapshot-identifier ologywood-production-$(date +%Y%m%d-%H%M%S)

    - name: Update ECS service
      run: |
        aws ecs update-service \
          --cluster ${{ env.ECS_CLUSTER }} \
          --service ${{ env.ECS_SERVICE }} \
          --force-new-deployment \
          --region ${{ env.AWS_REGION }}

    - name: Wait for service to stabilize
      run: |
        aws ecs wait services-stable \
          --cluster ${{ env.ECS_CLUSTER }} \
          --services ${{ env.ECS_SERVICE }} \
          --region ${{ env.AWS_REGION }}

    - name: Run health checks
      run: |
        chmod +x scripts/health-check.sh
        ./scripts/health-check.sh production

    - name: Notify Slack on success
      if: success()
      uses: slackapi/slack-github-action@v1
      with:
        payload: |
          {
            "text": "✅ Production deployment successful",
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*Production Deployment Successful*\nVersion: ${{ github.ref_name }}"
                }
              }
            ]
          }
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 2. Set Up GitHub Secrets

Go to Settings → Secrets and add:

```
AWS_ROLE_TO_ASSUME: arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole
SLACK_WEBHOOK_URL: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 3. Create IAM Role for GitHub Actions

```bash
# Create trust policy
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:ologywood/platform:ref:refs/heads/develop"
        }
      }
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name GitHubActionsRole \
  --assume-role-policy-document file://trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess
```

## GitLab CI Setup

Create `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - test
  - deploy-staging
  - deploy-production

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: ""
  AWS_REGION: us-east-1
  ECR_REPOSITORY: ologywood

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $ECR_REPOSITORY:$CI_COMMIT_SHA -f docker/Dockerfile .
    - docker tag $ECR_REPOSITORY:$CI_COMMIT_SHA $ECR_REPOSITORY:latest
  artifacts:
    reports:
      dotenv: build.env
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
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

deploy_staging:
  stage: deploy-staging
  image: alpine:latest
  before_script:
    - apk add --no-cache aws-cli curl
  script:
    - aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    - docker tag $ECR_REPOSITORY:$CI_COMMIT_SHA $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$CI_COMMIT_SHA
    - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$CI_COMMIT_SHA
    - aws ecs update-service --cluster ologywood-staging --service ologywood-app --force-new-deployment --region $AWS_REGION
    - aws ecs wait services-stable --cluster ologywood-staging --services ologywood-app --region $AWS_REGION
    - ./scripts/health-check.sh staging
  environment:
    name: staging
    url: https://staging-api.ologywood.com
  only:
    - develop

deploy_production:
  stage: deploy-production
  image: alpine:latest
  before_script:
    - apk add --no-cache aws-cli curl
  script:
    - aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    - docker tag $ECR_REPOSITORY:$CI_COMMIT_SHA $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$CI_COMMIT_SHA
    - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$CI_COMMIT_SHA
    - aws rds create-db-snapshot --db-instance-identifier ologywood-production --db-snapshot-identifier ologywood-production-$(date +%Y%m%d-%H%M%S)
    - aws ecs update-service --cluster ologywood-production --service ologywood-app --force-new-deployment --region $AWS_REGION
    - aws ecs wait services-stable --cluster ologywood-production --services ologywood-app --region $AWS_REGION
    - ./scripts/health-check.sh production
  environment:
    name: production
    url: https://api.ologywood.com
  only:
    - main
  when: manual
```

## Jenkins Setup

Create `Jenkinsfile`:

```groovy
pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        ECR_REPOSITORY = 'ologywood'
        AWS_ACCOUNT_ID = credentials('aws-account-id')
        AWS_CREDENTIALS = credentials('aws-credentials')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                script {
                    sh '''
                        docker build -t ${ECR_REPOSITORY}:${BUILD_NUMBER} -f docker/Dockerfile .
                        docker tag ${ECR_REPOSITORY}:${BUILD_NUMBER} ${ECR_REPOSITORY}:latest
                    '''
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    sh '''
                        npm install
                        npm run test
                        npm run lint
                    '''
                }
            }
        }

        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    sh '''
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                        docker tag ${ECR_REPOSITORY}:${BUILD_NUMBER} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${BUILD_NUMBER}
                        docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${BUILD_NUMBER}
                        
                        aws ecs update-service \
                          --cluster ologywood-staging \
                          --service ologywood-app \
                          --force-new-deployment \
                          --region ${AWS_REGION}
                        
                        aws ecs wait services-stable \
                          --cluster ologywood-staging \
                          --services ologywood-app \
                          --region ${AWS_REGION}
                        
                        ./scripts/health-check.sh staging
                    '''
                }
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            input {
                message "Deploy to production?"
                ok "Deploy"
            }
            steps {
                script {
                    sh '''
                        aws rds create-db-snapshot \
                          --db-instance-identifier ologywood-production \
                          --db-snapshot-identifier ologywood-production-$(date +%Y%m%d-%H%M%S)
                        
                        aws ecs update-service \
                          --cluster ologywood-production \
                          --service ologywood-app \
                          --force-new-deployment \
                          --region ${AWS_REGION}
                        
                        aws ecs wait services-stable \
                          --cluster ologywood-production \
                          --services ologywood-app \
                          --region ${AWS_REGION}
                        
                        ./scripts/health-check.sh production
                    '''
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
```

## Monitoring CI/CD Pipeline

### GitHub Actions Monitoring

```bash
# View workflow runs
gh run list --repo ologywood/platform

# View specific run
gh run view RUN_ID --repo ologywood/platform

# View logs
gh run view RUN_ID --log --repo ologywood/platform

# Cancel run
gh run cancel RUN_ID --repo ologywood/platform
```

### GitLab CI Monitoring

```bash
# View pipeline status
curl --header "PRIVATE-TOKEN: $CI_JOB_TOKEN" \
  https://gitlab.com/api/v4/projects/ologywood/platform/pipelines

# View job logs
curl --header "PRIVATE-TOKEN: $CI_JOB_TOKEN" \
  https://gitlab.com/api/v4/projects/ologywood/platform/jobs/JOB_ID/log
```

## Troubleshooting CI/CD

### GitHub Actions Issues

**Issue: Workflow not triggering**
```bash
# Check branch protection rules
# Ensure branch is not protected from CI/CD

# Check workflow syntax
gh workflow view deploy-staging.yml --repo ologywood/platform
```

**Issue: ECR login fails**
```bash
# Verify IAM role has ECR permissions
aws iam get-role-policy --role-name GitHubActionsRole --policy-name ECRPolicy

# Check ECR repository exists
aws ecr describe-repositories --repository-names ologywood
```

**Issue: ECS update fails**
```bash
# Check service exists
aws ecs describe-services --cluster ologywood-staging --services ologywood-app

# Check task definition
aws ecs describe-task-definition --task-definition ologywood-staging
```

### GitLab CI Issues

**Issue: Docker build fails**
```bash
# Check Docker image size
docker images | grep ologywood

# Clear Docker cache
docker system prune -a
```

**Issue: AWS credentials not found**
```bash
# Verify GitLab CI/CD variables
# Settings → CI/CD → Variables

# Check AWS credentials format
aws sts get-caller-identity
```

---

**CI/CD Setup Version:** 1.0  
**Last Updated:** January 16, 2026  
**Ready for Production:** ✅ Yes
