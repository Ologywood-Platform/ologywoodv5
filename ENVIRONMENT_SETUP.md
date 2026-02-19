# Ologywood - Environment Setup & Configuration

**Status:** MVP Golden Path - Production Ready  
**Last Updated:** February 19, 2026  
**Purpose:** Complete environment configuration for MVP Golden Path

---

## Overview

This guide covers all environment variables and configuration needed to run the Ologywood MVP Golden Path platform. The platform is currently in production-ready MVP stage with all critical features implemented and tested.

---

## Current Platform Status

**MVP Golden Path Features Completed:**
- ✅ Artist and Venue profiles with validation
- ✅ Booking creation and status management
- ✅ Rider template system with full CRUD
- ✅ Real-time messaging with polling (2-second intervals)
- ✅ Payment processing with Stripe (test mode)
- ✅ Email logging and delivery tracking
- ✅ Profile completion enforcement
- ✅ Booking confirmation page
- ✅ Phone number validation

**Database:** 43 tables, 753 test users (627 artists, 100 venues)  
**API:** 22 active TRPC routers  
**Status:** Zero TypeScript errors, all systems operational

---

## Quick Start

### Prerequisites
- Node.js 22.13.0+
- MySQL 8.0+
- pnpm package manager

### Installation

```bash
# Clone and install
git clone <repo-url>
cd ologywood
pnpm install

# Create environment file
cp .env.example .env

# Configure environment (see sections below)
# Then run migrations
pnpm db:push

# Start development
pnpm dev
```

---

## Step 2: Configure Database

### Development Database

```env
# Database connection string
DATABASE_URL=mysql://ologywood_user:password@localhost:3306/ologywood_dev

# Database host
DB_HOST=localhost

# Database port
DB_PORT=3306

# Database name
DB_NAME=ologywood_dev

# Database user
DB_USER=ologywood_user

# Database password
DB_PASSWORD=secure_password
```

### Production Database

```env
# Use managed database service
DATABASE_URL=mysql://ologywood_user:password@prod-db.example.com:3306/ologywood_prod

# Or use environment variables
DB_HOST=prod-db.example.com
DB_PORT=3306
DB_NAME=ologywood_prod
DB_USER=ologywood_user
DB_PASSWORD=very_secure_password_here
```

### Create Database User

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE ologywood_dev;

# Create user
CREATE USER 'ologywood_user'@'localhost' IDENTIFIED BY 'secure_password';

# Grant permissions
GRANT ALL PRIVILEGES ON ologywood_dev.* TO 'ologywood_user'@'localhost';

# Apply changes
FLUSH PRIVILEGES;

# Exit
EXIT;
```

---

## Step 3: Configure Authentication

### JWT Configuration

```env
# JWT Secret (generate random 32+ character string)
JWT_SECRET=your-random-secret-key-here-minimum-32-characters

# JWT Expiration
JWT_EXPIRATION=7d

# Refresh token expiration
REFRESH_TOKEN_EXPIRATION=30d
```

**Generate JWT Secret:**
```bash
# macOS/Linux
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### OAuth Configuration

**Get Google OAuth Credentials:**

1. Go to https://console.cloud.google.com
2. Create new project: "Ologywood"
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Type: Web application
   - Name: "Ologywood Web"
   - Authorized JavaScript origins:
     - Development: `http://localhost:3000`
     - Staging: `https://staging.ologywood.com`
     - Production: `https://ologywood.com`
   - Authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback`
     - Staging: `https://staging.ologywood.com/api/auth/callback`
     - Production: `https://ologywood.com/api/auth/callback`
5. Copy Client ID and Secret

**Environment Variables:**

```env
# OAuth Provider
OAUTH_PROVIDER=google

# OAuth Client Credentials
OAUTH_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
OAUTH_CLIENT_SECRET=your-client-secret-here

# OAuth Redirect
OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback
VITE_OAUTH_PORTAL_URL=http://localhost:3000

# OAuth Server
OAUTH_SERVER_URL=https://accounts.google.com
```

---

## Step 4: Configure Payment Processing

### Stripe Setup

**Get Stripe Credentials:**

1. Go to https://dashboard.stripe.com
2. Sign up or log in
3. Navigate to Developers → API Keys
4. Copy:
   - Publishable Key (starts with `pk_`)
   - Secret Key (starts with `sk_`)
5. Create webhook endpoint:
   - Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `payment_intent.succeeded`, `customer.subscription.created`
   - Copy Webhook Secret (starts with `whsec_`)

**Environment Variables:**

```env
# Stripe Keys (Test Mode)
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_test_your_webhook_secret_here

# Frontend Stripe Key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here

# Stripe Configuration
STRIPE_API_VERSION=2023-10-16
```

**Test Cards:**
```
Visa:           4242 4242 4242 4242
Mastercard:     5555 5555 5555 4444
American Express: 3782 822463 10005
Declined:       4000 0000 0000 0002
```

---

## Step 5: Configure Email Service

### SendGrid Setup

**Get SendGrid Credentials:**

1. Go to https://sendgrid.com
2. Sign up or log in
3. Navigate to Settings → API Keys
4. Create new API key
5. Copy the key

**Environment Variables:**

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=noreply@ologywood.com
SENDGRID_FROM_NAME=Ologywood

# Email Templates
SENDGRID_BOOKING_CONFIRMATION_TEMPLATE_ID=d-template-id-here
SENDGRID_BOOKING_CANCELLATION_TEMPLATE_ID=d-template-id-here
SENDGRID_PAYMENT_RECEIPT_TEMPLATE_ID=d-template-id-here
```

---

## Step 6: Configure AWS (Optional for Backups)

### AWS Setup

**Create IAM User:**

1. Go to https://console.aws.amazon.com/iam
2. Create new user: "ologywood-backup"
3. Attach policy: `AmazonS3FullAccess`
4. Create access key
5. Copy:
   - Access Key ID
   - Secret Access Key

**Environment Variables:**

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# S3 Bucket
AWS_S3_BUCKET=ologywood-backups
AWS_S3_BACKUP_PATH=backups/
```

---

## Step 7: Configure Application

### Application Settings

```env
# Application Name
VITE_APP_TITLE=Ologywood
VITE_APP_ID=ologywood
VITE_APP_LOGO=https://ologywood.com/logo.png

# Application Environment
NODE_ENV=development
# Options: development, staging, production

# Application Port
PORT=3000

# Application URL
VITE_FRONTEND_URL=http://localhost:3000
VITE_BACKEND_URL=http://localhost:3000/api

# API Configuration
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=30000
```

### Logging Configuration

```env
# Logging Level
LOG_LEVEL=debug
# Options: debug, info, warn, error

# Log Format
LOG_FORMAT=json
# Options: json, text

# Log Output
LOG_OUTPUT=console
# Options: console, file, both
```

---

## Step 8: Configure Security

### CORS Configuration

```env
# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# For production
CORS_ORIGINS=https://ologywood.com,https://www.ologywood.com
```

### Rate Limiting

```env
# Rate Limit (requests per minute)
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# API Rate Limit
API_RATE_LIMIT=1000
```

### Security Headers

```env
# HTTPS
FORCE_HTTPS=false
# Set to true in production

# HSTS
HSTS_MAX_AGE=31536000

# CSP
CSP_ENABLED=true
```

---

## Step 9: Configure Analytics (Optional)

### Analytics Configuration

```env
# Analytics Provider
ANALYTICS_PROVIDER=google
# Options: google, mixpanel, segment, custom

# Google Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Custom Analytics
VITE_ANALYTICS_ENDPOINT=http://localhost:3000/api/analytics
VITE_ANALYTICS_WEBSITE_ID=ologywood
```

---

## Step 10: Configure Monitoring (Optional)

### Error Tracking

```env
# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0
```

### Performance Monitoring

```env
# DataDog Configuration
DATADOG_API_KEY=your-datadog-api-key
DATADOG_APP_KEY=your-datadog-app-key
DATADOG_SITE=datadoghq.com
```

---

## Complete .env Template

```env
# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
DATABASE_URL=mysql://ologywood_user:password@localhost:3306/ologywood_dev
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ologywood_dev
DB_USER=ologywood_user
DB_PASSWORD=secure_password

# ============================================================================
# AUTHENTICATION
# ============================================================================
JWT_SECRET=your-random-secret-key-here-minimum-32-characters
JWT_EXPIRATION=7d
REFRESH_TOKEN_EXPIRATION=30d

# ============================================================================
# OAUTH
# ============================================================================
OAUTH_PROVIDER=google
OAUTH_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
OAUTH_CLIENT_SECRET=your-client-secret-here
OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback
VITE_OAUTH_PORTAL_URL=http://localhost:3000
OAUTH_SERVER_URL=https://accounts.google.com

# ============================================================================
# STRIPE PAYMENT
# ============================================================================
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_test_your_webhook_secret_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here

# ============================================================================
# EMAIL SERVICE
# ============================================================================
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=noreply@ologywood.com
SENDGRID_FROM_NAME=Ologywood

# ============================================================================
# AWS CONFIGURATION
# ============================================================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=ologywood-backups

# ============================================================================
# APPLICATION
# ============================================================================
NODE_ENV=development
PORT=3000
VITE_APP_TITLE=Ologywood
VITE_APP_ID=ologywood
VITE_FRONTEND_URL=http://localhost:3000
VITE_BACKEND_URL=http://localhost:3000/api

# ============================================================================
# SECURITY
# ============================================================================
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
FORCE_HTTPS=false
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# ============================================================================
# LOGGING
# ============================================================================
LOG_LEVEL=debug
LOG_FORMAT=json

# ============================================================================
# ANALYTICS (OPTIONAL)
# ============================================================================
ANALYTICS_PROVIDER=google
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# ============================================================================
# MONITORING (OPTIONAL)
# ============================================================================
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=development
```

---

## Environment-Specific Configurations

### Development (.env.development)

```env
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
FORCE_HTTPS=false
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
DATABASE_URL=mysql://user:pass@localhost:3306/ologywood_dev
```

### Staging (.env.staging)

```env
NODE_ENV=staging
DEBUG=false
LOG_LEVEL=info
FORCE_HTTPS=true
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
DATABASE_URL=mysql://user:pass@staging-db:3306/ologywood_staging
```

### Production (.env.production)

```env
NODE_ENV=production
DEBUG=false
LOG_LEVEL=warn
FORCE_HTTPS=true
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
DATABASE_URL=mysql://user:pass@prod-db:3306/ologywood_prod
SENTRY_ENABLED=true
```

---

## Verification Checklist

After configuring environment variables:

- [ ] Database connection working: `pnpm db:push`
- [ ] JWT secret set (32+ characters)
- [ ] OAuth credentials configured
- [ ] Stripe keys set (test or live)
- [ ] SendGrid API key configured
- [ ] AWS credentials set (if using backups)
- [ ] Application starts: `pnpm dev`
- [ ] OAuth login working
- [ ] Payment processing working
- [ ] Emails sending correctly

---

## Security Best Practices

1. **Never commit .env files** - Add to `.gitignore`
2. **Use strong passwords** - Minimum 16 characters
3. **Rotate secrets regularly** - Monthly or quarterly
4. **Use environment-specific credentials** - Don't reuse across environments
5. **Restrict access** - Only share with authorized team members
6. **Monitor usage** - Check API usage and access logs
7. **Enable 2FA** - For all service accounts
8. **Use secrets manager** - For production (AWS Secrets Manager, HashiCorp Vault)

---

## Troubleshooting

### Database Connection Failed
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# Verify credentials
mysql -u ologywood_user -p ologywood_dev

# Check DATABASE_URL format
# Should be: mysql://user:password@host:port/database
```

### OAuth Not Working
```bash
# Verify credentials in .env
echo $OAUTH_CLIENT_ID
echo $OAUTH_CLIENT_SECRET

# Check redirect URI matches Google Console
# Should be: http://localhost:3000/api/auth/callback
```

### Stripe Payment Failing
```bash
# Use test card: 4242 4242 4242 4242
# Verify STRIPE_SECRET_KEY starts with sk_test_
# Check webhook secret is correct
```

### Email Not Sending
```bash
# Verify SENDGRID_API_KEY is correct
# Check from email is verified in SendGrid
# Verify email template IDs if using templates
```

---

## Next Steps

1. **Copy .env.example:** `cp .env.example .env`
2. **Fill in credentials:** Edit `.env` with your values
3. **Verify configuration:** `pnpm db:push`
4. **Start development:** `pnpm dev`
5. **Test features:** Login, search, create booking

---

**Document Version:** 1.0  
**Last Updated:** February 19, 2026  
**Status:** READY FOR USE

