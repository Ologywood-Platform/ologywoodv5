# Ologywood - Local Development Setup Guide

**Version:** 1.0  
**Date:** February 19, 2026  
**Time to Complete:** 30-45 minutes  
**Difficulty Level:** Beginner to Intermediate

---

## Overview

This guide will help you set up the Ologywood Artist Booking Platform on your local computer for development. By the end, you'll have a fully functional development environment running on your machine.

---

## Prerequisites

### Required Software
- **Node.js** 18.0.0 or higher
- **npm** 8.0.0+ or **pnpm** 7.0.0+
- **MySQL** 8.0.0 or higher
- **Git** 2.0.0 or higher

### Required Accounts
- **Google OAuth** - For authentication
- **Stripe** - For payment processing (test mode)
- **AWS** - For backups (optional but recommended)

### System Requirements
- **OS:** macOS, Linux, or Windows (WSL2)
- **RAM:** Minimum 4GB (8GB recommended)
- **Disk Space:** Minimum 10GB free
- **Internet Connection:** Required

---

## Step 1: Install Prerequisites (10 minutes)

### 1.1 Install Node.js

**macOS (using Homebrew):**
```bash
brew install node
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 8.0.0 or higher
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install nodejs npm
node --version
npm --version
```

**Windows:**
Download from https://nodejs.org/ and run the installer.

### 1.2 Install pnpm (Recommended)

```bash
npm install -g pnpm
pnpm --version  # Should be 7.0.0 or higher
```

### 1.3 Install MySQL

**macOS (using Homebrew):**
```bash
brew install mysql
mysql --version
# Start MySQL
brew services start mysql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
mysql --version
# Start MySQL
sudo systemctl start mysql
```

**Windows:**
Download from https://dev.mysql.com/downloads/mysql/ and run the installer.

### 1.4 Verify Installations

```bash
node --version
npm --version
pnpm --version
mysql --version
git --version
```

All should show version numbers.

---

## Step 2: Clone the Project (5 minutes)

### Option A: Clone from GitHub
```bash
git clone <repository-url> ologywood
cd ologywood
```

### Option B: Download from Manus
```bash
# Download the checkpoint version: aebf8891
# Extract to your projects directory
cd ologywood
```

### Option C: Copy from Existing Installation
```bash
cp -r /home/ubuntu/ologywood ~/projects/ologywood
cd ~/projects/ologywood
```

---

## Step 3: Install Dependencies (5 minutes)

```bash
# Install all project dependencies
pnpm install

# This will install:
# - Frontend dependencies (React, TypeScript, etc.)
# - Backend dependencies (Express, tRPC, etc.)
# - Development tools (testing, linting, etc.)

# Verify installation
pnpm list
```

---

## Step 4: Setup Database (10 minutes)

### 4.1 Create MySQL Database

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE ologywood_prod;

# Create database user
CREATE USER 'ologywood_user'@'localhost' IDENTIFIED BY 'secure_password';

# Grant permissions
GRANT ALL PRIVILEGES ON ologywood_prod.* TO 'ologywood_user'@'localhost';

# Apply changes
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

### 4.2 Run Database Migrations

```bash
# Push schema to database
pnpm db:push

# This will create all tables and relationships
# Output should show: "✓ Pushed database schema"
```

### 4.3 Verify Database

```bash
# Connect to database
mysql -u ologywood_user -p ologywood_prod

# List tables
SHOW TABLES;

# Check table count (should be 20+)
SELECT COUNT(*) as table_count FROM information_schema.TABLES WHERE TABLE_SCHEMA='ologywood_prod';

# Exit
EXIT;
```

---

## Step 5: Configure Environment Variables (5 minutes)

### 5.1 Create .env File

```bash
# Copy example file
cp .env.example .env

# Edit .env with your editor
nano .env
# or
code .env
# or
vim .env
```

### 5.2 Set Required Variables

```env
# Database
DATABASE_URL=mysql://ologywood_user:secure_password@localhost:3306/ologywood_prod

# JWT Secret (generate a random string)
JWT_SECRET=your-random-secret-key-here-min-32-chars

# Stripe (use test keys from https://dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_test_your_webhook_secret_here

# Google OAuth (from https://console.cloud.google.com)
VITE_OAUTH_PORTAL_URL=http://localhost:3000
OAUTH_CLIENT_ID=your-google-oauth-client-id
OAUTH_CLIENT_SECRET=your-google-oauth-client-secret

# Application
VITE_APP_TITLE=Ologywood
VITE_APP_ID=ologywood
NODE_ENV=development
PORT=3000
```

### 5.3 Generate JWT Secret

```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy the output and paste into JWT_SECRET in .env
```

---

## Step 6: Configure OAuth (Optional but Recommended)

### 6.1 Create Google OAuth Credentials

1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback`
5. Copy Client ID and Client Secret
6. Paste into `.env` file

### 6.2 Update .env

```env
OAUTH_CLIENT_ID=your-client-id-here
OAUTH_CLIENT_SECRET=your-client-secret-here
```

---

## Step 7: Start Development Server (5 minutes)

### 7.1 Start the Application

```bash
# Start development server
pnpm dev

# Output should show:
# [15:07:35] · [15:07:37] [OAuth] Initialized with baseURL
# [15:07:37] Server running on http://localhost:3000/
```

### 7.2 Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the Ologywood homepage with:
- Navigation bar with login/logout
- Hero section: "Book Talented Artists for Your Events"
- Search section: "Find Your Perfect Artist"
- Featured Artists section

### 7.3 Test the Application

**Test User Login:**
1. Click "Login" button
2. Sign in with Google account
3. You should be redirected to dashboard

**Test Artist Search:**
1. Use the search bar to find artists
2. Try filtering by genre or location

**Test Booking:**
1. Click on an artist
2. View their profile and riders
3. Create a booking

---

## Step 8: Run Tests (5 minutes)

```bash
# Run all tests
pnpm test

# Expected output:
# Test Files  22 passed (23)
# Tests      374 passed (395)

# Run specific test file
pnpm test server/services/subscriptionValidation.test.ts

# Run tests in watch mode
pnpm test --watch
```

---

## Step 9: Build for Production (5 minutes)

```bash
# Build the application
pnpm build

# Output should show:
# ✓ Built successfully
# ✓ Frontend compiled
# ✓ Backend compiled

# Verify build
ls -la dist/
```

---

## Step 10: Setup Backup System (Optional)

```bash
# Copy backup scripts
cp scripts/backup-*.sh ~/bin/

# Make executable
chmod +x ~/bin/backup-*.sh

# Test backup
~/bin/backup-daily.sh

# Verify
ls -lh ~/backups/daily/
```

See `BACKUP_QUICK_START.md` for complete backup setup.

---

## Common Commands

### Development
```bash
# Start development server
pnpm dev

# Start with specific port
PORT=3001 pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Lint code
pnpm lint

# Format code
pnpm format
```

### Database
```bash
# Push schema changes
pnpm db:push

# Generate migrations
pnpm db:generate

# Open database studio
pnpm db:studio

# Reset database
pnpm db:reset
```

### Build & Deploy
```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Build and start
pnpm build && pnpm start
```

### Utilities
```bash
# Check TypeScript errors
pnpm tsc --noEmit

# View project info
pnpm info

# Clean dependencies
pnpm clean
```

---

## Troubleshooting

### Issue: "Cannot find module" error

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue: Database connection failed

**Solution:**
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# Verify credentials in .env
DATABASE_URL=mysql://user:password@localhost:3306/ologywood_prod

# Test connection
pnpm db:push
```

### Issue: Port 3000 already in use

**Solution:**
```bash
# Use different port
PORT=3001 pnpm dev

# Or kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Issue: OAuth login not working

**Solution:**
1. Verify OAuth credentials in `.env`
2. Check redirect URI in Google Console matches `http://localhost:3000/api/auth/callback`
3. Restart development server: `pnpm dev`

### Issue: Tests failing

**Solution:**
```bash
# Run tests with verbose output
pnpm test --reporter=verbose

# Run specific test
pnpm test subscriptionValidation

# Clear test cache
pnpm test --clearCache
```

### Issue: Build fails

**Solution:**
```bash
# Check TypeScript errors
pnpm tsc --noEmit

# Clean and rebuild
rm -rf dist
pnpm build

# Check for missing dependencies
pnpm install
```

---

## Project Structure

```
ologywood/
├── client/                  # React frontend
│   ├── src/
│   │   ├── App.tsx         # Main app component
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── lib/            # Utilities and helpers
│   │   └── styles/         # CSS and styling
│   └── package.json
│
├── server/                  # Node.js backend
│   ├── routers/            # API endpoints (25 routers)
│   ├── services/           # Business logic
│   ├── middleware/         # Express middleware
│   ├── db.ts               # Database connection
│   └── auth.ts             # Authentication logic
│
├── drizzle/                # Database schema
│   ├── schema.ts           # Table definitions
│   └── migrations/         # Database migrations
│
├── scripts/                # Utility scripts
│   ├── backup-daily.sh
│   ├── backup-weekly.sh
│   └── ...
│
├── Documentation/          # Guides and docs
│   ├── LOCAL_SETUP_GUIDE.md (this file)
│   ├── ENVIRONMENT_SETUP.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── ...
│
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript config
├── .env.example            # Environment template
└── README.md               # Project readme
```

---

## Next Steps

### After Setup
1. **Explore the codebase** - Read `DEVELOPER_QUICK_REFERENCE.md`
2. **Review features** - See `FEATURE_IMPLEMENTATION_GUIDE.md`
3. **Setup backups** - Follow `BACKUP_QUICK_START.md`
4. **Deploy to production** - See `DEPLOYMENT_GUIDE.md`

### Development Workflow
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test: `pnpm test`
3. Build and verify: `pnpm build`
4. Commit and push: `git push origin feature/your-feature`
5. Create pull request

### Production Deployment
1. Build application: `pnpm build`
2. Configure environment: Set production `.env`
3. Setup database: `pnpm db:push`
4. Start server: `pnpm start`
5. Verify deployment: Check logs and test endpoints

---

## Support

### Documentation
- **Project Overview:** `PLATFORM_OVERVIEW.md`
- **Features:** `FEATURE_IMPLEMENTATION_GUIDE.md`
- **Code Review:** `CODE_REVIEW_CHECKLIST.md`
- **Developer Reference:** `DEVELOPER_QUICK_REFERENCE.md`

### Getting Help
- Check `TROUBLESHOOTING.md` for common issues
- Review `DEVELOPER_QUICK_REFERENCE.md` for commands
- Check GitHub issues for similar problems
- Contact support team

---

## Verification Checklist

After completing setup, verify:

- [ ] Node.js and npm installed
- [ ] Project cloned/downloaded
- [ ] Dependencies installed (`pnpm install`)
- [ ] Database created and migrated
- [ ] Environment variables configured
- [ ] Development server running (`pnpm dev`)
- [ ] Application accessible at `http://localhost:3000`
- [ ] Tests passing (`pnpm test`)
- [ ] OAuth login working
- [ ] Search functionality working
- [ ] Booking creation working

---

## Performance Tips

### Development
- Use `pnpm` instead of `npm` for faster installs
- Enable TypeScript strict mode for better type checking
- Use VS Code with TypeScript extension

### Database
- Create indexes on frequently queried columns
- Use connection pooling for production
- Monitor slow queries

### Frontend
- Use React DevTools for debugging
- Enable network throttling to test slow connections
- Use Lighthouse for performance audits

---

## Security Notes

- Never commit `.env` file to version control
- Use strong passwords for database users
- Rotate OAuth credentials regularly
- Keep dependencies updated: `pnpm update`
- Use HTTPS in production
- Enable CORS only for trusted domains

---

**Document Version:** 1.0  
**Last Updated:** February 19, 2026  
**Status:** READY FOR USE

