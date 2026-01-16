# CI/CD Pipeline & Deployment Guide

## Overview

Ologywood uses GitHub Actions for automated testing, building, and deployment. This guide covers the CI/CD pipeline setup, deployment procedures, and best practices.

## GitHub Actions CI/CD Pipeline

### Pipeline Stages

The CI/CD pipeline consists of 8 automated stages:

#### 1. **Lint & Format Check**
- Runs ESLint for code quality
- Checks TypeScript compilation
- Validates code formatting
- Runs on every push and pull request

#### 2. **Unit & Integration Tests**
- Executes all unit tests with vitest
- Runs integration tests against test database
- Uploads code coverage to Codecov
- Requires lint stage to pass

#### 3. **Build**
- Builds the application
- Generates optimized bundles
- Uploads build artifacts
- Requires test stage to pass

#### 4. **Security Scan**
- Runs npm audit for vulnerabilities
- Executes Snyk security scanning
- Checks for dependency issues
- Runs in parallel with build

#### 5. **Docker Build & Push**
- Builds multi-stage Docker image
- Pushes to GitHub Container Registry
- Only runs on main branch
- Requires build stage to pass

#### 6. **Deploy to Staging**
- Deploys to staging environment
- Runs smoke tests
- Sends Slack notifications
- Only runs on develop branch

#### 7. **Deploy to Production**
- Creates GitHub deployment
- Deploys to production environment
- Runs health checks
- Sends Slack notifications
- Only runs on main branch

#### 8. **Performance Testing**
- Runs performance benchmarks
- Uploads results as artifacts
- Only runs on develop branch
- Runs after staging deployment

### Pipeline Configuration

The pipeline is defined in `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

### Branch Strategy

**Main Branch** (`main`)
- Production-ready code
- Triggers: Build, Docker, Production Deploy
- Requires: All tests passing, code review

**Develop Branch** (`develop`)
- Integration branch for features
- Triggers: Build, Docker, Staging Deploy, Performance Tests
- Requires: All tests passing

**Feature Branches** (`feature/*`)
- Individual feature development
- Triggers: Lint, Test, Build
- Requires: All tests passing before merge

## Environment Variables & Secrets

### Required GitHub Secrets

Configure these secrets in Settings → Secrets and variables → Actions:

| Secret | Purpose | Example |
|---|---|---|
| `SNYK_TOKEN` | Snyk security scanning | `xxxx-xxxx-xxxx` |
| `SLACK_WEBHOOK_URL` | Slack notifications | `https://hooks.slack.com/...` |
| `SENTRY_DSN` | Error tracking | `https://key@sentry.io/123456` |
| `DATABASE_URL` | Production database | `mysql://user:pass@host/db` |
| `STRIPE_SECRET_KEY` | Stripe payments | `sk_live_xxxx` |

### Environment-Specific Variables

**Staging Environment**
```
DATABASE_URL=mysql://user:pass@staging-db/ologywood_staging
SENTRY_DSN=https://key@sentry.io/staging-project
NODE_ENV=staging
```

**Production Environment**
```
DATABASE_URL=mysql://user:pass@prod-db/ologywood_prod
SENTRY_DSN=https://key@sentry.io/prod-project
NODE_ENV=production
```

## Docker Deployment

### Building Docker Image Locally

```bash
# Build image
docker build -t ologywood:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=mysql://user:pass@localhost/ologywood \
  -e NODE_ENV=production \
  ologywood:latest
```

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Clean up volumes
docker-compose down -v
```

### Docker Compose Services

- **MySQL**: Database server (port 3306)
- **Redis**: Cache server (port 6379)
- **App**: Application (port 3000)
- **Adminer**: Database UI (port 8080)

## Health Check Endpoints

### API Health Endpoints

```bash
# Comprehensive health check
curl http://localhost:3000/api/health/check

# Liveness probe (Kubernetes)
curl http://localhost:3000/api/health/liveness

# Readiness probe (Kubernetes)
curl http://localhost:3000/api/health/readiness

# System metrics
curl http://localhost:3000/api/health/metrics

# Version information
curl http://localhost:3000/api/health/version
```

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2026-01-16T21:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "ok",
      "responseTime": 5,
      "message": "Database is healthy"
    },
    "memory": {
      "status": "ok",
      "responseTime": 0,
      "message": "Memory usage is normal",
      "details": {
        "heapUsed": 128,
        "heapTotal": 512,
        "heapUsedPercent": 25
      }
    },
    "cpu": {
      "status": "ok",
      "responseTime": 0
    },
    "api": {
      "status": "ok",
      "responseTime": 0,
      "message": "API is responding"
    }
  }
}
```

## Sentry Integration

### Setup Sentry

1. **Create Sentry Account**
   - Go to https://sentry.io
   - Create a new project for Node.js
   - Copy the DSN

2. **Configure Environment Variable**
   ```bash
   SENTRY_DSN=https://key@sentry.io/project-id
   ```

3. **Initialize in Application**
   - Sentry is automatically initialized in the server startup
   - All errors are captured and reported

### Monitoring in Sentry

**Error Tracking**
- View all errors in real-time
- Group similar errors
- Track error trends
- Set up alerts

**Performance Monitoring**
- Monitor slow requests
- Track database query performance
- Identify bottlenecks
- Set performance thresholds

**Release Tracking**
- Track deployments
- Associate errors with releases
- Monitor release health

## Deployment Procedures

### Manual Deployment

#### Deploy to Staging

```bash
# 1. Ensure all tests pass
pnpm test
pnpm test:integration

# 2. Build application
pnpm build

# 3. Deploy to staging
docker build -t ologywood:staging .
docker push ghcr.io/ologywood/ologywood:staging

# 4. Update staging environment
kubectl set image deployment/ologywood-staging \
  app=ghcr.io/ologywood/ologywood:staging
```

#### Deploy to Production

```bash
# 1. Create release tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 2. Build and push image
docker build -t ologywood:v1.0.0 .
docker push ghcr.io/ologywood/ologywood:v1.0.0

# 3. Update production environment
kubectl set image deployment/ologywood-prod \
  app=ghcr.io/ologywood/ologywood:v1.0.0

# 4. Verify deployment
kubectl rollout status deployment/ologywood-prod
```

### Rollback Procedure

```bash
# View deployment history
kubectl rollout history deployment/ologywood-prod

# Rollback to previous version
kubectl rollout undo deployment/ologywood-prod

# Rollback to specific revision
kubectl rollout undo deployment/ologywood-prod --to-revision=2
```

## Kubernetes Deployment

### Deployment Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ologywood-prod
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
        image: ghcr.io/ologywood/ologywood:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ologywood-secrets
              key: database-url
        livenessProbe:
          httpGet:
            path: /api/health/liveness
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health/readiness
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Service Configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ologywood-service
spec:
  selector:
    app: ologywood
  type: LoadBalancer
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

## Monitoring & Alerts

### Slack Notifications

The pipeline sends notifications to Slack on:
- Successful deployments
- Failed deployments
- Test failures
- Security issues

Configure webhook URL in GitHub Secrets: `SLACK_WEBHOOK_URL`

### Email Alerts

Configure email notifications for:
- Failed deployments
- Security vulnerabilities
- Performance degradation
- Database backup failures

## Best Practices

### Code Quality
- Keep tests passing at all times
- Maintain >80% code coverage
- Use TypeScript strict mode
- Follow ESLint rules

### Security
- Scan dependencies regularly
- Use environment variables for secrets
- Rotate credentials periodically
- Enable branch protection rules

### Performance
- Monitor bundle size
- Track Core Web Vitals
- Optimize database queries
- Use caching effectively

### Reliability
- Run smoke tests after deployment
- Monitor error rates
- Track uptime metrics
- Maintain runbooks

## Troubleshooting

### Pipeline Failures

**Lint Failures**
```bash
# Fix formatting
pnpm format

# Fix ESLint issues
pnpm lint --fix
```

**Test Failures**
```bash
# Run tests locally
pnpm test

# Run specific test file
pnpm test server/routers.test.ts

# Update snapshots
pnpm test -u
```

**Build Failures**
```bash
# Clean build
rm -rf dist
pnpm build

# Check TypeScript errors
pnpm tsc --noEmit
```

### Deployment Issues

**Database Connection**
- Verify DATABASE_URL in environment
- Check database credentials
- Ensure database is running
- Check network connectivity

**Sentry Not Capturing Errors**
- Verify SENTRY_DSN is set
- Check Sentry project settings
- Review error filtering rules
- Check network requests

**Health Check Failures**
- Verify database connectivity
- Check memory usage
- Review application logs
- Check port availability

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Sentry Documentation](https://docs.sentry.io/)

---

**Last Updated**: January 2026
**Owner**: DevOps Team
