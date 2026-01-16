# GitHub & AWS Quick Start Guide

Complete setup of GitHub and AWS accounts in 30 minutes using ologywood5@gmail.com

## 🚀 Quick Start Checklist

### GitHub Setup (10 minutes)
- [ ] Create GitHub account at github.com
- [ ] Enable 2FA with authenticator app
- [ ] Generate SSH key and add to GitHub
- [ ] Create repository: `ologywood-platform`
- [ ] Create Personal Access Token (save securely)
- [ ] Enable GitHub Actions in repository settings
- [ ] Add repository secrets (AWS_ROLE_TO_ASSUME, SLACK_WEBHOOK_URL)

### AWS Setup (15 minutes)
- [ ] Create AWS account at aws.amazon.com
- [ ] Enable MFA on root account
- [ ] Create IAM user: `ologywood-dev`
- [ ] Create access keys for IAM user
- [ ] Configure AWS CLI with credentials
- [ ] Create S3 bucket: `ologywood-platform-data`
- [ ] Create RDS database: `ologywood-db`
- [ ] Create CloudFormation stack for GitHub Actions

### Verification (5 minutes)
- [ ] Test GitHub SSH connection: `ssh -T git@github.com`
- [ ] Test AWS CLI: `aws sts get-caller-identity`
- [ ] Verify S3 bucket: `aws s3 ls`
- [ ] Verify RDS database in AWS console

## 📋 Step-by-Step Instructions

### 1. Create GitHub Account (5 min)

```
Email: ologywood5@gmail.com
Username: ologywood
Password: [Strong password with 15+ chars]
```

**Link:** https://github.com/signup

### 2. Enable GitHub 2FA (3 min)

1. Settings → Password and authentication → Two-factor authentication
2. Download authenticator app (Google Authenticator, Microsoft Authenticator, or Authy)
3. Scan QR code and save recovery codes

### 3. Generate SSH Key (2 min)

```bash
ssh-keygen -t ed25519 -C "ologywood5@gmail.com"
# Press Enter for default location and passphrase
```

Add to GitHub:
1. Copy: `cat ~/.ssh/id_ed25519.pub`
2. GitHub → Settings → SSH and GPG keys → New SSH key
3. Paste key and save

### 4. Create GitHub Repository (2 min)

1. Click **"+"** → **"New repository"**
2. Name: `ologywood-platform`
3. Description: `Artist booking platform with contracts`
4. Select **"Private"**
5. Initialize with README, .gitignore (Node), and MIT license

### 5. Create Personal Access Token (2 min)

1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Name: `Ologywood Deployment`
4. Scopes: `repo`, `workflow`, `admin:repo_hook`
5. **Save token securely** (password manager)

### 6. Create AWS Account (5 min)

```
Email: ologywood5@gmail.com
Account name: ologywood-platform
Password: [Strong password with 12+ chars]
```

**Link:** https://aws.amazon.com

### 7. Enable AWS MFA (3 min)

1. AWS Console → Security credentials
2. Multi-factor authentication → Activate MFA
3. Download authenticator app
4. Scan QR code and save recovery codes

### 8. Create IAM User (5 min)

1. IAM → Users → Create user
2. Username: `ologywood-dev`
3. Enable console access with custom password
4. Attach policy: `AdministratorAccess`
5. Create access key (CLI)
6. **Save Access Key ID and Secret Access Key securely**

### 9. Configure AWS CLI (3 min)

```bash
aws configure
# AWS Access Key ID: [from step 8]
# AWS Secret Access Key: [from step 8]
# Default region: us-east-1
# Default output format: json
```

Verify:
```bash
aws sts get-caller-identity
```

### 10. Create S3 Bucket (2 min)

```bash
aws s3 mb s3://ologywood-platform-data --region us-east-1
aws s3api put-bucket-versioning \
  --bucket ologywood-platform-data \
  --versioning-configuration Status=Enabled
```

### 11. Create RDS Database (5 min)

1. AWS Console → RDS → Create database
2. Engine: MySQL 8.0
3. Template: Free tier
4. DB identifier: `ologywood-db`
5. Master username: `admin`
6. Generate strong password and **save securely**
7. Instance class: `db.t3.micro`
8. Storage: 20 GB `gp3`
9. Click Create

**Wait 5-10 minutes for database to be available**

### 12. Get Database Endpoint

1. RDS → Databases → ologywood-db
2. Copy Endpoint (save for later)
3. Format: `ologywood-db.xxxxx.us-east-1.rds.amazonaws.com`

### 13. Configure GitHub Secrets (3 min)

1. GitHub → Repository Settings → Secrets and variables → Actions
2. Add secret: `AWS_ROLE_TO_ASSUME`
   - Value: `arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole`
   - (You'll get ACCOUNT_ID from AWS setup)
3. Add secret: `SLACK_WEBHOOK_URL` (optional)
   - Value: Your Slack webhook URL

### 14. Enable GitHub Actions (1 min)

1. GitHub → Repository Settings → Actions → General
2. Select "Allow all actions and reusable workflows"
3. Workflow permissions: "Read and write permissions"
4. Allow GitHub Actions to create pull requests

### 15. Deploy CloudFormation Stack (5 min)

```bash
aws cloudformation create-stack \
  --stack-name ologywood-github-actions \
  --template-body file:///home/ubuntu/ologywood/cloudformation/github-actions-iam.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Wait for stack to complete
aws cloudformation wait stack-create-complete \
  --stack-name ologywood-github-actions \
  --region us-east-1
```

## ✅ Verification Checklist

```bash
# Test GitHub SSH
ssh -T git@github.com
# Expected: "Hi ologywood! You've successfully authenticated..."

# Test AWS CLI
aws sts get-caller-identity
# Expected: Shows your AWS account ID and user

# Test S3 bucket
aws s3 ls
# Expected: Lists your S3 buckets including ologywood-platform-data

# Test RDS database
aws rds describe-db-instances --query 'DBInstances[0].DBInstanceIdentifier'
# Expected: ologywood-db

# Test GitHub Actions
gh workflow list --repo ologywood/ologywood-platform
# Expected: Lists your workflows
```

## 🔐 Security Checklist

- [ ] GitHub 2FA enabled
- [ ] GitHub SSH key added
- [ ] Personal Access Token saved securely
- [ ] AWS MFA enabled
- [ ] IAM user created (not using root)
- [ ] Access keys saved securely
- [ ] S3 bucket encryption enabled
- [ ] RDS database password saved securely
- [ ] GitHub secrets configured
- [ ] No credentials committed to repository

## 📝 Important Credentials to Save

Create a secure password manager entry with:

**GitHub:**
- Username: `ologywood`
- Email: `ologywood5@gmail.com`
- Password: [Your GitHub password]
- Personal Access Token: [Token value]
- SSH Key Passphrase: [If you created one]

**AWS:**
- Root Email: `ologywood5@gmail.com`
- Root Password: [Your AWS root password]
- IAM User: `ologywood-dev`
- IAM Password: [IAM user password]
- Access Key ID: [From step 8]
- Secret Access Key: [From step 8]
- RDS Master Password: [Database password]

## 🆘 Troubleshooting

### GitHub SSH Not Working
```bash
# Test with verbose output
ssh -vT git@github.com

# Add key to SSH agent
ssh-add ~/.ssh/id_ed25519
```

### AWS CLI Not Working
```bash
# Check credentials
aws sts get-caller-identity

# Reconfigure
aws configure
```

### RDS Connection Failed
1. Check database is in "Available" state
2. Verify security group allows port 3306
3. Test with: `mysql -h [ENDPOINT] -u admin -p`

## 📚 Full Guides

For detailed information, see:
- **GitHub Setup:** `GITHUB_ACCOUNT_SETUP.md`
- **AWS Setup:** `AWS_ACCOUNT_SETUP.md`
- **Deployment:** `GITHUB_ACTIONS_EXECUTION_GUIDE.md`

## 🚀 Next Steps

1. ✅ Complete GitHub setup
2. ✅ Complete AWS setup
3. Push code to GitHub repository
4. Deploy CloudFormation stack
5. Configure GitHub Actions secrets
6. Test deployment workflow
7. Monitor CloudWatch dashboard
8. Set up billing alerts

## 💰 Cost Estimate

**Free Tier (12 months):**
- RDS: 750 hours/month
- S3: 5 GB storage
- CloudWatch: 10 custom metrics

**Monthly Cost After Free Tier:**
- RDS: ~$15-20
- S3: ~$1-5
- CloudWatch: ~$5-10
- **Total: ~$25-35/month**

## 📞 Support

**GitHub Help:**
- https://docs.github.com
- https://support.github.com

**AWS Help:**
- https://docs.aws.amazon.com
- https://console.aws.amazon.com/support

---

**Estimated Total Time: 30 minutes**

Start with GitHub setup, then AWS setup. Both guides are straightforward and can be completed in one session.
