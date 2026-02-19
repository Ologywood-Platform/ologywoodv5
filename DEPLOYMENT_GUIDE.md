# Ologywood - Production Deployment Guide

**Version:** 1.0  
**Date:** February 19, 2026  
**Purpose:** Complete guide for deploying to production  
**Estimated Time:** 2-4 hours

---

## Overview

This guide covers deploying the Ologywood Artist Booking Platform to production. It includes multiple deployment options and best practices for ensuring a smooth launch.

---

## Deployment Options

### Option 1: Manus Hosting (Recommended)
- **Pros:** Built-in hosting, automatic backups, monitoring included
- **Cons:** Limited customization
- **Time:** 30 minutes
- **Cost:** Included with Manus subscription

### Option 2: Self-Hosted (VPS/Server)
- **Pros:** Full control, custom configuration
- **Cons:** Requires DevOps knowledge, manual backups
- **Time:** 2-4 hours
- **Cost:** $20-100+ per month

### Option 3: Cloud Platforms
- **Pros:** Scalable, managed services available
- **Cons:** More complex setup
- **Time:** 2-4 hours
- **Cost:** $50-500+ per month

---

## Pre-Deployment Checklist

### Code & Testing
- [ ] All tests passing (374/395)
- [ ] Zero TypeScript errors
- [ ] Code reviewed and approved
- [ ] Security audit completed
- [ ] Performance tested
- [ ] Backup system tested
- [ ] Restore procedures tested

### Configuration
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] OAuth credentials configured
- [ ] Stripe credentials configured
- [ ] Email service configured
- [ ] AWS credentials configured (if using)
- [ ] Monitoring configured

### Infrastructure
- [ ] Server/hosting provisioned
- [ ] Database created
- [ ] SSL certificates obtained
- [ ] DNS configured
- [ ] Firewall rules configured
- [ ] Backup storage configured
- [ ] Monitoring tools installed

### Team
- [ ] Team trained on deployment
- [ ] Rollback procedures documented
- [ ] On-call engineer assigned
- [ ] Escalation procedures defined
- [ ] Communication plan ready

---

## Option 1: Deploy to Manus Hosting

### Step 1: Create Checkpoint

```bash
# Ensure all changes are committed
git add .
git commit -m "Production deployment"

# Create checkpoint via Manus UI
# Or use: webdev_save_checkpoint
```

### Step 2: Access Manus Management UI

1. Go to your Manus project dashboard
2. Click "Publish" button (top-right)
3. Review deployment settings
4. Confirm deployment

### Step 3: Configure Production Domain

1. In Settings → Domains
2. Add custom domain or use auto-generated domain
3. Configure DNS records
4. Wait for SSL certificate (5-10 minutes)

### Step 4: Configure Secrets

1. In Settings → Secrets
2. Add all production environment variables:
   - DATABASE_URL
   - JWT_SECRET
   - STRIPE_SECRET_KEY
   - OAUTH_CLIENT_ID
   - OAUTH_CLIENT_SECRET
   - etc.

### Step 5: Verify Deployment

```bash
# Check application is running
curl https://your-domain.com

# Check API endpoints
curl https://your-domain.com/api/trpc/auth.me

# Check logs
# Via Manus Dashboard → Logs
```

---

## Option 2: Deploy to Self-Hosted Server

### Step 1: Provision Server

**Using DigitalOcean Droplet:**
```bash
# Create Ubuntu 22.04 droplet
# Size: 2GB RAM, 2 vCPU (minimum)
# Enable backups
# Add SSH key
```

**Using AWS EC2:**
```bash
# Launch Ubuntu 22.04 instance
# Type: t3.small (minimum)
# Storage: 20GB SSD
# Security group: Allow 80, 443, 22
```

### Step 2: Install Dependencies

```bash
# SSH into server
ssh ubuntu@your-server-ip

# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install MySQL
sudo apt install -y mysql-server

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install SSL (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 3: Clone Project

```bash
# Create app directory
sudo mkdir -p /var/www/ologywood
sudo chown ubuntu:ubuntu /var/www/ologywood

# Clone repository
cd /var/www/ologywood
git clone <repository-url> .

# Install dependencies
pnpm install

# Build application
pnpm build
```

### Step 4: Configure Database

```bash
# Start MySQL
sudo systemctl start mysql

# Create database
mysql -u root -p << EOF
CREATE DATABASE ologywood_prod;
CREATE USER 'ologywood_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON ologywood_prod.* TO 'ologywood_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Run migrations
cd /var/www/ologywood
pnpm db:push
```

### Step 5: Configure Environment

```bash
# Create .env file
cd /var/www/ologywood
nano .env

# Add all production variables
# DATABASE_URL=mysql://ologywood_user:password@localhost:3306/ologywood_prod
# JWT_SECRET=your-secret-key
# NODE_ENV=production
# PORT=3000
# ... (see ENVIRONMENT_SETUP.md)
```

### Step 6: Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/ologywood

# Add configuration:
```

```nginx
upstream ologywood {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location / {
        proxy_pass http://ologywood;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ologywood /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 7: Setup SSL Certificate

```bash
# Get SSL certificate
sudo certbot certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Step 8: Setup Application Service

```bash
# Create systemd service
sudo nano /etc/systemd/system/ologywood.service

# Add configuration:
```

```ini
[Unit]
Description=Ologywood Artist Booking Platform
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/ologywood
ExecStart=/usr/local/bin/pnpm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable ologywood
sudo systemctl start ologywood

# Check status
sudo systemctl status ologywood
```

### Step 9: Setup Backup System

```bash
# Copy backup scripts
sudo cp /var/www/ologywood/scripts/backup-*.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/backup-*.sh

# Create backup directories
sudo mkdir -p /backups/{daily,weekly,monthly}
sudo chown ubuntu:ubuntu /backups

# Configure cron jobs
crontab -e

# Add:
# 0 2 * * * /usr/local/bin/backup-daily.sh >> /var/log/ologywood-backup.log 2>&1
# 0 3 * * 0 /usr/local/bin/backup-weekly.sh >> /var/log/ologywood-backup.log 2>&1
# 0 4 1 * * /usr/local/bin/backup-monthly.sh >> /var/log/ologywood-backup.log 2>&1
```

### Step 10: Verify Deployment

```bash
# Check application is running
curl https://your-domain.com

# Check logs
tail -f /var/log/syslog | grep ologywood

# Check PM2 status
pm2 status

# Monitor resources
htop
```

---

## Option 3: Deploy to Cloud Platforms

### AWS Deployment

**Using Elastic Beanstalk:**

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init -p "Node.js 20 running on 64bit Amazon Linux 2" ologywood

# Create environment
eb create ologywood-prod

# Deploy application
eb deploy

# Configure environment variables
eb setenv NODE_ENV=production JWT_SECRET=your-secret

# Monitor deployment
eb logs
```

**Using EC2 + RDS:**

```bash
# Launch EC2 instance
# Launch RDS MySQL instance
# Configure security groups
# Follow self-hosted steps above
```

### Google Cloud Deployment

**Using App Engine:**

```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash

# Initialize project
gcloud init

# Deploy application
gcloud app deploy

# View logs
gcloud app logs read
```

### DigitalOcean App Platform

1. Connect GitHub repository
2. Configure build settings
3. Set environment variables
4. Deploy application
5. Configure custom domain

---

## Post-Deployment Verification

### Smoke Tests

```bash
# Test homepage
curl https://your-domain.com

# Test API
curl https://your-domain.com/api/trpc/auth.me

# Test OAuth
# Visit https://your-domain.com and test login

# Test search
# Search for artists

# Test booking creation
# Create a test booking

# Test payment
# Use test card: 4242 4242 4242 4242
```

### Monitoring

```bash
# Check application logs
tail -f /var/log/ologywood/app.log

# Monitor system resources
htop

# Check database
mysql -u ologywood_user -p ologywood_prod -e "SELECT COUNT(*) FROM users;"

# Check backups
ls -la /backups/daily/
```

### Performance Testing

```bash
# Test response time
time curl https://your-domain.com

# Load test (using Apache Bench)
ab -n 100 -c 10 https://your-domain.com/

# Monitor with New Relic or DataDog
# Check dashboard for metrics
```

---

## Rollback Procedures

### If Deployment Fails

**Option 1: Rollback via Manus**
```bash
# In Manus Dashboard
# Click "Rollback" on previous checkpoint
# Select version to rollback to
# Confirm rollback
```

**Option 2: Manual Rollback**
```bash
# Stop application
sudo systemctl stop ologywood

# Revert code
cd /var/www/ologywood
git revert HEAD
git push

# Restart application
sudo systemctl start ologywood
```

**Option 3: Restore from Backup**
```bash
# See RESTORE_PROCEDURES_RUNBOOK.md
# Follow full database restore procedure
```

---

## Monitoring & Maintenance

### Daily Tasks
- [ ] Check application logs
- [ ] Verify backup completion
- [ ] Monitor system resources
- [ ] Check error rates

### Weekly Tasks
- [ ] Review performance metrics
- [ ] Check database size
- [ ] Verify SSL certificate
- [ ] Review security logs

### Monthly Tasks
- [ ] Run restore test
- [ ] Update dependencies
- [ ] Review and optimize queries
- [ ] Conduct security audit

---

## Scaling Considerations

### Vertical Scaling (Increase Resources)
```bash
# Increase server size
# Increase RAM
# Increase CPU cores
# Increase disk space
```

### Horizontal Scaling (Add Servers)
```bash
# Add load balancer
# Add multiple application servers
# Configure database replication
# Setup caching layer (Redis)
```

### Database Optimization
```bash
# Add indexes
# Optimize queries
# Setup read replicas
# Configure connection pooling
```

---

## Security Hardening

### SSL/TLS
- [ ] Install SSL certificate
- [ ] Enable HTTPS redirect
- [ ] Configure HSTS headers
- [ ] Test SSL configuration

### Firewall
- [ ] Allow only necessary ports (80, 443, 22)
- [ ] Configure rate limiting
- [ ] Enable DDoS protection
- [ ] Setup WAF (Web Application Firewall)

### Authentication
- [ ] Enable 2FA for admin accounts
- [ ] Rotate API keys regularly
- [ ] Restrict SSH access
- [ ] Use VPN for admin access

### Monitoring
- [ ] Setup intrusion detection
- [ ] Monitor failed login attempts
- [ ] Track API usage
- [ ] Alert on suspicious activity

---

## Cost Optimization

### Compute
- Use auto-scaling to reduce idle resources
- Choose appropriate instance size
- Use reserved instances for predictable load

### Database
- Use managed database service
- Enable automated backups
- Monitor query performance
- Optimize storage

### Storage
- Use S3 for backups (cheaper than local)
- Enable lifecycle policies
- Compress old backups
- Archive to Glacier

---

## Troubleshooting

### Application Won't Start
```bash
# Check logs
sudo journalctl -u ologywood -n 50

# Check environment variables
echo $DATABASE_URL
echo $JWT_SECRET

# Verify database connection
mysql -u ologywood_user -p ologywood_prod -e "SELECT 1;"
```

### High CPU Usage
```bash
# Check running processes
top

# Check for infinite loops
# Review recent code changes
# Restart application
sudo systemctl restart ologywood
```

### Database Connection Errors
```bash
# Check MySQL is running
sudo systemctl status mysql

# Check connection string
cat /var/www/ologywood/.env | grep DATABASE_URL

# Test connection
mysql -u ologywood_user -p ologywood_prod -e "SELECT 1;"
```

### SSL Certificate Issues
```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL
curl -I https://your-domain.com
```

---

## Support & Documentation

### Deployment Documentation
- **Local Setup:** `LOCAL_SETUP_GUIDE.md`
- **Environment:** `ENVIRONMENT_SETUP.md`
- **Backup:** `BACKUP_QUICK_START.md`
- **Monitoring:** `BACKUP_MONITORING_GUIDE.md`

### Getting Help
- Check logs for error messages
- Review deployment guide for your platform
- Contact hosting provider support
- Check GitHub issues for similar problems

---

## Deployment Checklist

- [ ] Pre-deployment checklist completed
- [ ] Code tested and reviewed
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificate installed
- [ ] Application deployed
- [ ] Smoke tests passed
- [ ] Monitoring configured
- [ ] Backup system working
- [ ] Team notified
- [ ] Documentation updated

---

**Document Version:** 1.0  
**Last Updated:** February 19, 2026  
**Status:** READY FOR DEPLOYMENT

