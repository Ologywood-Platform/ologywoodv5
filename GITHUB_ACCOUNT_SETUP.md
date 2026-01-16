# GitHub Account Setup Guide for Ologywood

This guide walks you through creating a GitHub account and setting up your repository for the Ologywood artist booking platform.

## Step 1: Create GitHub Account

### 1.1 Visit GitHub
1. Go to [github.com](https://github.com)
2. Click the **"Sign up"** button in the top right corner

### 1.2 Enter Your Email
1. Enter your email: **ologywood5@gmail.com**
2. Click **"Continue"**

### 1.3 Create Password
1. Create a strong password (at least 15 characters recommended)
   - Mix uppercase, lowercase, numbers, and symbols
   - Example: `Ologywood2024!Secure`
2. Click **"Continue"**

### 1.4 Choose Username
1. Enter your GitHub username: **ologywood** (or **ologywood-platform** if taken)
2. Choose whether to receive emails about product updates (optional)
3. Click **"Continue"**

### 1.5 Verify Email
1. GitHub will send a verification email to ologywood5@gmail.com
2. Check your inbox and click the verification link
3. Complete the CAPTCHA if prompted

### 1.6 Complete Setup
1. Answer the personalization questions (optional, can skip)
2. Click **"Create account"**

## Step 2: Set Up Two-Factor Authentication (2FA)

### 2.1 Enable 2FA
1. Click your profile icon (top right) → **Settings**
2. Click **"Password and authentication"** in left sidebar
3. Click **"Enable"** next to "Two-factor authentication"

### 2.2 Choose Authentication Method
**Option A: Authenticator App (Recommended)**
1. Select **"Set up using an app"**
2. Download authenticator app:
   - Google Authenticator (iOS/Android)
   - Microsoft Authenticator (iOS/Android)
   - Authy (iOS/Android/Desktop)
3. Scan the QR code with your app
4. Enter the 6-digit code from your app
5. Save recovery codes in a secure location

**Option B: SMS Text Message**
1. Select **"Set up using SMS"**
2. Enter your phone number
3. Enter the code you receive via SMS
4. Save recovery codes in a secure location

## Step 3: Create SSH Key for Authentication

### 3.1 Generate SSH Key (On Your Computer)

**On macOS/Linux:**
```bash
ssh-keygen -t ed25519 -C "ologywood5@gmail.com"
```

**On Windows (PowerShell):**
```powershell
ssh-keygen -t ed25519 -C "ologywood5@gmail.com"
```

When prompted:
- **File location:** Press Enter to use default (~/.ssh/id_ed25519)
- **Passphrase:** Enter a strong passphrase (or press Enter for no passphrase)

### 3.2 Add SSH Key to GitHub

1. Copy your public key:
   ```bash
   # macOS/Linux
   cat ~/.ssh/id_ed25519.pub
   
   # Windows PowerShell
   Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
   ```

2. Go to GitHub → Click profile icon → **Settings**
3. Click **"SSH and GPG keys"** in left sidebar
4. Click **"New SSH key"**
5. Title: `Ologywood Development`
6. Paste your public key in the "Key" field
7. Click **"Add SSH key"**

### 3.3 Test SSH Connection
```bash
ssh -T git@github.com
```

You should see: `Hi ologywood! You've successfully authenticated...`

## Step 4: Create Repository

### 4.1 Create New Repository
1. Click the **"+"** icon (top right) → **"New repository"**
2. Repository name: **ologywood-platform**
3. Description: **Artist booking platform with professional contracts and digital signatures**
4. Select **"Private"** (recommended for production)
5. Initialize with:
   - ✅ Add a README file
   - ✅ Add .gitignore (select "Node")
   - ✅ Choose a license (MIT recommended)
6. Click **"Create repository"**

### 4.2 Clone Repository Locally
```bash
git clone git@github.com:ologywood/ologywood-platform.git
cd ologywood-platform
```

## Step 5: Configure Git

### 5.1 Set Global Configuration
```bash
git config --global user.name "Ologywood"
git config --global user.email "ologywood5@gmail.com"
```

### 5.2 Verify Configuration
```bash
git config --global --list
```

## Step 6: Set Up GitHub Personal Access Token (PAT)

### 6.1 Create PAT
1. Go to GitHub → Click profile icon → **Settings**
2. Click **"Developer settings"** in left sidebar
3. Click **"Personal access tokens"** → **"Tokens (classic)"**
4. Click **"Generate new token"** → **"Generate new token (classic)"**

### 6.2 Configure Token
1. **Token name:** `Ologywood Deployment`
2. **Expiration:** 90 days (recommended)
3. **Scopes:** Select:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `admin:repo_hook` (Full control of repository hooks)
   - ✅ `admin:org_hook` (Full control of organization hooks)
4. Click **"Generate token"**

### 6.3 Save Token Securely
1. **Copy the token immediately** (you won't see it again)
2. Save in a secure password manager
3. **Never commit this token to your repository**

## Step 7: Configure GitHub CLI (Optional but Recommended)

### 7.1 Install GitHub CLI
**macOS:**
```bash
brew install gh
```

**Windows:**
```powershell
winget install GitHub.cli
```

**Linux:**
```bash
sudo apt install gh
```

### 7.2 Authenticate with GitHub
```bash
gh auth login
```

Follow the prompts:
1. Select **"GitHub.com"**
2. Select **"HTTPS"** (or SSH if preferred)
3. Select **"Yes"** to authenticate with your GitHub credentials
4. Select **"Paste an authentication token"**
5. Paste your Personal Access Token from Step 6

### 7.3 Verify Authentication
```bash
gh auth status
```

## Step 8: Set Up Repository Secrets

### 8.1 Add AWS Deployment Secret
1. Go to your repository on GitHub
2. Click **"Settings"** → **"Secrets and variables"** → **"Actions"**
3. Click **"New repository secret"**
4. **Name:** `AWS_ROLE_TO_ASSUME`
5. **Value:** `arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole` (you'll get this from AWS setup)
6. Click **"Add secret"**

### 8.2 Add Slack Webhook (Optional)
1. Click **"New repository secret"**
2. **Name:** `SLACK_WEBHOOK_URL`
3. **Value:** Your Slack webhook URL (from Slack workspace setup)
4. Click **"Add secret"**

## Step 9: Enable GitHub Actions

### 9.1 Enable Actions
1. Go to your repository → **"Settings"**
2. Click **"Actions"** → **"General"**
3. Under "Actions permissions," select **"Allow all actions and reusable workflows"**
4. Click **"Save"**

### 9.2 Configure Actions
1. Click **"Actions"** → **"General"**
2. Under "Workflow permissions," select:
   - ✅ **"Read and write permissions"**
   - ✅ **"Allow GitHub Actions to create and approve pull requests"**
3. Click **"Save"**

## Step 10: Push Your Code

### 10.1 Add Your Project Files
```bash
# Copy your Ologywood project files to the repository
cp -r /home/ubuntu/ologywood/* .
```

### 10.2 Commit and Push
```bash
git add .
git commit -m "Initial commit: Ologywood artist booking platform"
git push origin main
```

## Troubleshooting

### SSH Connection Issues
```bash
# Test SSH connection with verbose output
ssh -vT git@github.com

# If key not found, add it to SSH agent
ssh-add ~/.ssh/id_ed25519
```

### Authentication Failures
1. Verify your Personal Access Token is correct
2. Check that your SSH key is added to GitHub
3. Ensure 2FA is properly configured

### Repository Not Found
1. Verify repository name matches exactly
2. Check that repository is not deleted
3. Ensure you have access to the repository

## Next Steps

1. **Set up AWS account** (see AWS_ACCOUNT_SETUP.md)
2. **Configure GitHub Actions secrets** with AWS credentials
3. **Deploy CloudFormation stack** for CI/CD infrastructure
4. **Test deployment workflow** with a test commit

## Security Best Practices

✅ **Do:**
- Use strong, unique passwords
- Enable 2FA on your account
- Rotate Personal Access Tokens regularly (every 90 days)
- Use SSH keys instead of HTTPS when possible
- Keep recovery codes in a secure location
- Review repository access regularly

❌ **Don't:**
- Commit Personal Access Tokens to your repository
- Share your SSH private key
- Use the same password across multiple accounts
- Disable 2FA
- Commit sensitive credentials to version control

## Support

For GitHub help:
- [GitHub Docs](https://docs.github.com)
- [GitHub Support](https://support.github.com)
- [GitHub Community](https://github.community)
