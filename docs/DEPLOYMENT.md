# Ologywood Deployment Guide

## Overview

This guide covers deploying the Ologywood platform to production environments, including database setup, environment configuration, and monitoring.

## Pre-Deployment Checklist

Before deploying to production, ensure the following:

- [ ] All tests pass (`pnpm test`)
- [ ] TypeScript compilation succeeds (`pnpm tsc --noEmit`)
- [ ] Environment variables are configured
- [ ] Database migrations are up to date
- [ ] SSL certificates are valid
- [ ] Backups are configured
- [ ] Monitoring is set up
- [ ] Error tracking is configured
- [ ] Email service is configured
- [ ] Stripe keys are configured

## Environment Setup

### Development Environment

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

### Staging Environment

```bash
# Build for staging
pnpm build

# Set staging environment variables
export NODE_ENV=staging
export DATABASE_URL=<staging-db-url>
export STRIPE_SECRET_KEY=<staging-stripe-key>

# Run migrations
pnpm db:push

# Start server
pnpm start
```

### Production Environment

```bash
# Build for production
pnpm build

# Set production environment variables
export NODE_ENV=production
export DATABASE_URL=<production-db-url>
export STRIPE_SECRET_KEY=<production-stripe-key>

# Run migrations
pnpm db:push

# Start server with process manager (PM2)
pm2 start server/_core/index.ts --name ologywood
```

## Database Setup

### MySQL Configuration

```sql
-- Create production database
CREATE DATABASE ologywood_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create application user
CREATE USER 'ologywood_app'@'localhost' IDENTIFIED BY '<strong-password>';
GRANT ALL PRIVILEGES ON ologywood_prod.* TO 'ologywood_app'@'localhost';
FLUSH PRIVILEGES;

-- Enable SSL
ALTER USER 'ologywood_app'@'localhost' REQUIRE SSL;
```

### Backup Strategy

```bash
# Daily backup script (backup.sh)
#!/bin/bash
BACKUP_DIR="/backups/ologywood"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="ologywood_prod"
DB_USER="ologywood_app"
DB_PASS="<password>"

mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh
```

## Environment Variables

### Required Variables

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/ologywood_prod

# Authentication
JWT_SECRET=<strong-random-secret>
OAUTH_SERVER_URL=https://api.manus.im

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@ologywood.com

# Application
NODE_ENV=production
PORT=3000
VITE_APP_TITLE=Ologywood
VITE_APP_LOGO=https://cdn.ologywood.com/logo.png

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
DATADOG_API_KEY=xxx
```

## Deployment Process

### Using Manus Platform

The Ologywood platform is deployed on Manus, which provides:

1. **Automatic HTTPS**: SSL certificates managed automatically
2. **Auto-scaling**: Scales based on traffic
3. **Database hosting**: Managed MySQL database
4. **CDN**: Global content delivery network
5. **Monitoring**: Built-in monitoring and alerting

### Manual Deployment

For manual deployment to your own infrastructure:

```bash
# 1. Build the application
pnpm build

# 2. Install production dependencies
pnpm install --production

# 3. Run database migrations
pnpm db:push

# 4. Start the application
pm2 start ecosystem.config.js

# 5. Configure reverse proxy (Nginx)
# See nginx.conf example below
```

### Nginx Configuration

```nginx
upstream ologywood {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    server_name ologywood.com www.ologywood.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ologywood.com www.ologywood.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/ologywood.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ologywood.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy configuration
    location / {
        proxy_pass http://ologywood;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Monitoring & Logging

### Application Monitoring

Set up monitoring using Datadog or similar:

```typescript
// server/_core/monitoring.ts
import * as dd from 'dd-trace';

dd.init({
  service: 'ologywood',
  env: process.env.NODE_ENV,
  version: process.env.APP_VERSION,
});

export const tracer = dd.tracer;
```

### Log Aggregation

Configure centralized logging:

```typescript
// server/_core/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

### Health Checks

Implement health check endpoint:

```typescript
// server/health.ts
export async function healthCheck() {
  const db = await getDb();
  
  if (!db) {
    return { status: 'unhealthy', reason: 'Database unavailable' };
  }
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };
}
```

## Performance Optimization

### Database Optimization

1. **Add indexes**: Run `server/migrations/addIndexes.sql`
2. **Enable query caching**: Configure MySQL query cache
3. **Optimize slow queries**: Monitor and optimize queries > 1s

### Application Optimization

1. **Enable compression**: Use gzip middleware
2. **Implement caching**: Use Redis for session/data caching
3. **Optimize images**: Use CDN for image delivery
4. **Minify assets**: Ensure build process minifies CSS/JS

### CDN Configuration

```typescript
// Serve static assets from CDN
const CDN_URL = 'https://cdn.ologywood.com';

app.use((req, res, next) => {
  res.locals.cdnUrl = CDN_URL;
  next();
});
```

## Security Hardening

### SSL/TLS Configuration

```bash
# Generate strong SSL certificate
certbot certonly --standalone -d ologywood.com -d www.ologywood.com

# Auto-renewal
certbot renew --quiet --no-eff-email
```

### Database Security

```sql
-- Restrict remote access
GRANT ALL PRIVILEGES ON ologywood_prod.* TO 'ologywood_app'@'localhost' IDENTIFIED BY '<password>' REQUIRE SSL;

-- Enable binary logging for replication
SET GLOBAL binlog_format = 'ROW';
```

### Application Security

- [ ] Enable CSRF protection
- [ ] Implement rate limiting
- [ ] Validate all inputs
- [ ] Use parameterized queries
- [ ] Implement proper authentication
- [ ] Use HTTPS everywhere
- [ ] Set security headers
- [ ] Implement CORS properly

## Rollback Procedure

If deployment fails:

```bash
# 1. Check current version
pm2 show ologywood

# 2. Rollback to previous version
git checkout <previous-commit>
pnpm build
pm2 restart ologywood

# 3. Rollback database if needed
mysql -u root -p < backup_<timestamp>.sql
```

## Troubleshooting

### Application won't start

```bash
# Check logs
pm2 logs ologywood

# Check port availability
lsof -i :3000

# Check database connection
mysql -u ologywood_app -p -h localhost ologywood_prod
```

### High memory usage

```bash
# Check memory leaks
pm2 monit

# Restart application
pm2 restart ologywood
```

### Database connection errors

```bash
# Check MySQL status
systemctl status mysql

# Check connection pool
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Threads%';
```

## Maintenance

### Regular Tasks

- [ ] Review logs daily
- [ ] Monitor disk space
- [ ] Verify backups
- [ ] Update dependencies monthly
- [ ] Review security patches
- [ ] Analyze slow queries
- [ ] Clean up old logs

### Scheduled Maintenance

Schedule maintenance windows for:

- Database optimization (OPTIMIZE TABLE)
- Index maintenance (ANALYZE TABLE)
- Log rotation
- Backup verification

---

## Support

For deployment issues, contact: devops@ologywood.com
