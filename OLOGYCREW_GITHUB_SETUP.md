# Setting Up Ologycrew GitHub Account for Ologywood Platform

This guide helps you configure your existing Ologycrew GitHub account for the Ologywood artist booking platform deployment.

## Step 1: Access Your Ologycrew Account

### 1.1 Sign In to GitHub
1. Go to [github.com](https://github.com)
2. Click **"Sign in"**
3. Enter your Ologycrew username/email
4. Enter your password
5. Click **"Sign in"**

### 1.2 Verify Your Account
1. Check that you're logged in (profile icon shows your avatar)
2. Click profile icon (top right) to verify account name

## Step 2: Enable Two-Factor Authentication (2FA)

### 2.1 Access Security Settings
1. Click profile icon (top right) → **"Settings"**
2. Click **"Password and authentication"** in left sidebar
3. Click **"Two-factor authentication"**

### 2.2 Check Current 2FA Status
- If 2FA is already enabled, you can skip to Step 3
- If 2FA is not enabled, click **"Enable"**

### 2.3 Set Up 2FA (if not already enabled)
1. Select **"Set up using an app"** (recommended)
2. Download authenticator app if you don't have one:
   - Google Authenticator (iOS/Android)
   - Microsoft Authenticator (iOS/Android)
   - Authy (iOS/Android/Desktop)
3. Scan the QR code with your authenticator app
4. Enter the 6-digit code from your app
5. Click **"Assign MFA"**
6. **Save recovery codes** in a secure location

## Step 3: Generate SSH Key

### 3.1 Check Existing SSH Keys
First, check if you already have SSH keys:

**On macOS/Linux:**
```bash
ls -la ~/.ssh/
```

**On Windows (PowerShell):**
```powershell
Get-Item $env:USERPROFILE\.ssh\ -ErrorAction SilentlyContinue
```

If you see `id_ed25519` or `id_rsa`, you already have an SSH key. Skip to Step 3.3.

### 3.2 Generate New SSH Key (if you don't have one)

**On macOS/Linux:**
```bash
ssh-keygen -t ed25519 -C "ologycrew-github@example.com"
```

**On Windows (PowerShell):**
```powershell
ssh-keygen -t ed25519 -C "ologycrew-github@example.com"
```

When prompted:
- **File location:** Press Enter to use default
- **Passphrase:** Enter a strong passphrase (or press Enter for no passphrase)

### 3.3 Add SSH Key to GitHub

1. Copy your public key:
   ```bash
   # macOS/Linux
   cat ~/.ssh/id_ed25519.pub
   
   # Windows PowerShell
   Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
   ```

2. Go to GitHub → Profile icon → **"Settings"**
3. Click **"SSH and GPG keys"** in left sidebar
4. Click **"New SSH key"**
5. **Title:** `Ologywood Platform Development`
6. **Key type:** `Authentication Key`
7. **Key:** Paste your public key
8. Click **"Add SSH key"**

### 3.4 Test SSH Connection
```bash
ssh -T git@github.com
```

You should see: `Hi [your-username]! You've successfully authenticated...`

## Step 4: Create Repository

### 4.1 Create New Repository
1. Click the **"+"** icon (top right) → **"New repository"**
2. **Repository name:** `ologywood-platform`
3. **Description:** `Artist booking platform with professional contracts and digital signatures`
4. **Visibility:** Select **"Private"** (recommended)
5. **Initialize repository:**
   - ✅ Add a README file
   - ✅ Add .gitignore (select "Node")
   - ✅ Choose a license (select "MIT")
6. Click **"Create repository"**

### 4.2 Clone Repository Locally
```bash
git clone git@github.com:[your-username]/ologywood-platform.git
cd ologywood-platform
```

Replace `[your-username]` with your actual Ologycrew username.

## Step 5: Create Personal Access Token (PAT)

### 5.1 Access Token Settings
1. Go to GitHub → Profile icon → **"Settings"**
2. Click **"Developer settings"** in left sidebar
3. Click **"Personal access tokens"** → **"Tokens (classic)"**

### 5.2 Check Existing Tokens
- If you already have tokens, review them
- You can reuse an existing token if it has the required scopes
- Otherwise, create a new one

### 5.3 Generate New Token (if needed)
1. Click **"Generate new token"** → **"Generate new token (classic)"**
2. **Token name:** `Ologywood Platform Deployment`
3. **Expiration:** `90 days` (recommended)
4. **Scopes:** Select:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `admin:repo_hook` (Full control of repository hooks)
5. Click **"Generate token"**

### 5.4 Save Token Securely
1. **Copy the token immediately** (you won't see it again)
2. Save in a secure password manager
3. **Never commit this token to your repository**

## Step 6: Configure Git

### 6.1 Set Global Configuration
```bash
git config --global user.name "Ologycrew"
git config --global user.email "your-email@example.com"
```

Replace `your-email@example.com` with your actual email.

### 6.2 Verify Configuration
```bash
git config --global --list
```

## Step 7: Enable GitHub Actions

### 7.1 Access Repository Settings
1. Go to your `ologywood-platform` repository
2. Click **"Settings"** tab

### 7.2 Enable Actions
1. Click **"Actions"** → **"General"** in left sidebar
2. Under "Actions permissions," select **"Allow all actions and reusable workflows"**
3. Click **"Save"**

### 7.3 Configure Workflow Permissions
1. Still in Actions → General
2. Under "Workflow permissions," select:
   - ✅ **"Read and write permissions"**
   - ✅ **"Allow GitHub Actions to create and approve pull requests"**
3. Click **"Save"**

## Step 8: Add Repository Secrets

### 8.1 Add AWS Role Secret
1. Go to your repository → **"Settings"**
2. Click **"Secrets and variables"** → **"Actions"** in left sidebar
3. Click **"New repository secret"**
4. **Name:** `AWS_ROLE_TO_ASSUME`
5. **Value:** `arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole`
   - Replace `ACCOUNT_ID` with your AWS account ID (you'll get this from AWS setup)
6. Click **"Add secret"**

### 8.2 Add Slack Webhook Secret (Optional)
1. Click **"New repository secret"**
2. **Name:** `SLACK_WEBHOOK_URL`
3. **Value:** Your Slack webhook URL (from Slack workspace setup)
4. Click **"Add secret"**

### 8.3 Add Database Credentials (Optional)
1. Click **"New repository secret"**
2. **Name:** `DATABASE_URL`
3. **Value:** Your RDS database connection string
4. Click **"Add secret"**

## Step 9: Push Your Code

### 9.1 Add Project Files
```bash
# Copy your Ologywood project files to the repository
cp -r /home/ubuntu/ologywood/* .
```

### 9.2 Commit and Push
```bash
git add .
git commit -m "Initial commit: Ologywood artist booking platform"
git push origin main
```

### 9.3 Verify Push
1. Go to your GitHub repository
2. Verify files appear in the repository
3. Check commit history shows your commit

## Step 10: Set Up GitHub CLI (Optional)

### 10.1 Install GitHub CLI
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

### 10.2 Authenticate with GitHub
```bash
gh auth login
```

Follow the prompts:
1. Select **"GitHub.com"**
2. Select **"SSH"** (recommended)
3. Select **"Yes"** to authenticate with your GitHub credentials
4. Select **"Paste an authentication token"**
5. Paste your Personal Access Token from Step 5

### 10.3 Verify Authentication
```bash
gh auth status
```

## Troubleshooting

### SSH Connection Issues
```bash
# Test SSH connection with verbose output
ssh -vT git@github.com

# If key not found, add it to SSH agent
ssh-add ~/.ssh/id_ed25519

# On Windows, use:
ssh-add $env:USERPROFILE\.ssh\id_ed25519
```

### Can't Find SSH Key
1. Check key exists: `ls ~/.ssh/id_ed25519`
2. Check key is added to GitHub: Settings → SSH and GPG keys
3. Verify key permissions: `chmod 600 ~/.ssh/id_ed25519`

### Authentication Failures
1. Verify SSH key is added to GitHub
2. Check that 2FA is properly configured
3. Ensure Personal Access Token has correct scopes
4. Try: `ssh-add -D` then `ssh-add ~/.ssh/id_ed25519`

### Repository Not Found
1. Verify repository name matches exactly
2. Check that repository is not deleted
3. Ensure you have access to the repository
4. Try: `git remote -v` to check remote URL

### Push Rejected
1. Verify you have write access to repository
2. Check that branch exists: `git branch -a`
3. Try: `git pull origin main` before pushing
4. Verify SSH key is added to GitHub

## Verification Checklist

```bash
# Test SSH connection
ssh -T git@github.com
# Expected: "Hi [username]! You've successfully authenticated..."

# Test Git configuration
git config --global user.name
git config --global user.email

# Test repository clone
git clone git@github.com:[username]/ologywood-platform.git

# Test GitHub CLI
gh auth status
gh repo view [username]/ologywood-platform
```

## Security Best Practices

✅ **Do:**
- Keep 2FA enabled
- Rotate Personal Access Tokens every 90 days
- Use SSH keys instead of HTTPS
- Keep SSH private key secure
- Review repository access regularly
- Use strong, unique passwords
- Save recovery codes securely

❌ **Don't:**
- Commit Personal Access Tokens to repository
- Share SSH private key
- Disable 2FA
- Use same password across accounts
- Commit sensitive credentials
- Leave unused tokens active

## Next Steps

1. ✅ Enable 2FA on your Ologycrew account
2. ✅ Generate and add SSH key
3. ✅ Create `ologywood-platform` repository
4. ✅ Create Personal Access Token
5. ✅ Enable GitHub Actions
6. ✅ Add repository secrets
7. ✅ Push your code
8. Set up AWS account (see AWS_ACCOUNT_SETUP.md)
9. Deploy CloudFormation stack
10. Test deployment workflow

## Support

For GitHub help:
- [GitHub Docs](https://docs.github.com)
- [GitHub Support](https://support.github.com)
- [GitHub Community](https://github.community)

---

**Estimated Time: 20 minutes**

This guide helps you set up your existing Ologycrew account for the Ologywood platform deployment.
