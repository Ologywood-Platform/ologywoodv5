# AWS Account Setup Guide for Ologywood

This guide walks you through creating an AWS account and setting up the infrastructure for the Ologywood artist booking platform.

## Step 1: Create AWS Account

### 1.1 Visit AWS
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click **"Create an AWS account"** button (top right)

### 1.2 Enter Email Address
1. Email address: **ologywood5@gmail.com**
2. AWS account name: **ologywood-platform**
3. Click **"Verify email address"**

### 1.3 Verify Email
1. Check your inbox for AWS verification email
2. Click the verification link in the email
3. You'll be redirected back to AWS

### 1.4 Create Password
1. Create a strong password (at least 12 characters)
   - Mix uppercase, lowercase, numbers, and symbols
   - Example: `Ologywood2024!AWS`
2. Confirm password
3. Click **"Continue"**

### 1.5 Contact Information
1. **Account type:** Select **"Business"**
2. **Full name:** Your name
3. **Company name:** Ologywood
4. **Phone number:** Your phone number
5. **Country:** Select your country
6. **Address:** Your address
7. **City, State, Postal Code:** Your location
8. Click **"Continue"**

### 1.6 Billing Information
1. **Card holder's name:** Your name
2. **Card number:** Your credit/debit card
3. **Expiration date:** MM/YY format
4. **CVV:** 3-digit security code
5. **Billing address:** Same as contact info (usually)
6. Click **"Continue"**

### 1.7 Confirm Identity
1. **Verification method:** Select **"Text message (SMS)"**
2. **Phone number:** Confirm your phone number
3. Click **"Send OTP"**
4. Enter the code you receive via SMS
5. Click **"Verify OTP"**

### 1.8 Choose Support Plan
1. Select **"Basic support (Free)"** for now
2. Click **"Complete sign up"**

### 1.9 Wait for Activation
1. AWS will activate your account (usually within minutes)
2. You'll receive a confirmation email
3. Click **"Go to AWS Console"** when ready

## Step 2: Enable Multi-Factor Authentication (MFA)

### 2.1 Access Security Credentials
1. Click your account name (top right) → **"Security credentials"**
2. Click **"Multi-factor authentication (MFA)"**
3. Click **"Activate MFA"**

### 2.2 Choose MFA Device
1. Select **"Authenticator app"** (recommended)
2. Click **"Continue"**

### 2.3 Set Up Authenticator App
1. Download authenticator app:
   - Google Authenticator (iOS/Android)
   - Microsoft Authenticator (iOS/Android)
   - Authy (iOS/Android/Desktop)
2. Scan the QR code with your app
3. Enter the 6-digit code from your app
4. Click **"Assign MFA"**

### 2.4 Save Recovery Codes
1. Download and save your recovery codes
2. Store them in a secure location
3. Click **"Finish"**

## Step 3: Create IAM User for Development

### 3.1 Access IAM Console
1. Go to **"Services"** → **"IAM"** (or search for IAM)
2. Click **"Users"** in left sidebar
3. Click **"Create user"**

### 3.2 Create User
1. **User name:** `ologywood-dev`
2. Check **"Provide user access to the AWS Management Console"**
3. Select **"I want to create an IAM user"**
4. Create custom password: `Ologywood2024!Dev`
5. Uncheck **"Users must create a new password on next sign-in"** (optional)
6. Click **"Next"**

### 3.3 Set Permissions
1. Select **"Attach policies directly"**
2. Search for and select:
   - ✅ `AdministratorAccess` (for development/testing)
   - Or select specific policies:
     - `AmazonEC2FullAccess`
     - `AmazonRDSFullAccess`
     - `AmazonS3FullAccess`
     - `CloudWatchFullAccess`
     - `IAMFullAccess`
4. Click **"Next"**

### 3.4 Review and Create
1. Review the settings
2. Click **"Create user"**

### 3.5 Save Access Credentials
1. Click the user you just created
2. Click **"Security credentials"** tab
3. Click **"Create access key"**
4. Select **"Command Line Interface (CLI)"**
5. Check the confirmation box
6. Click **"Next"**
7. Click **"Create access key"**
8. **Save these credentials securely:**
   - Access Key ID
   - Secret Access Key
9. Click **"Done"**

## Step 4: Configure AWS CLI

### 4.1 Install AWS CLI

**macOS:**
```bash
brew install awscli
```

**Windows:**
```powershell
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### 4.2 Configure AWS Credentials
```bash
aws configure
```

When prompted, enter:
1. **AWS Access Key ID:** [From Step 3.5]
2. **AWS Secret Access Key:** [From Step 3.5]
3. **Default region name:** `us-east-1` (recommended)
4. **Default output format:** `json`

### 4.3 Verify Configuration
```bash
aws sts get-caller-identity
```

You should see your AWS account information.

## Step 5: Create S3 Bucket for Application Data

### 5.1 Create Bucket
```bash
aws s3 mb s3://ologywood-platform-data --region us-east-1
```

### 5.2 Enable Versioning
```bash
aws s3api put-bucket-versioning \
  --bucket ologywood-platform-data \
  --versioning-configuration Status=Enabled
```

### 5.3 Enable Encryption
```bash
aws s3api put-bucket-encryption \
  --bucket ologywood-platform-data \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

### 5.4 Block Public Access
```bash
aws s3api put-public-access-block \
  --bucket ologywood-platform-data \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

## Step 6: Create RDS Database

### 6.1 Access RDS Console
1. Go to **"Services"** → **"RDS"** (or search for RDS)
2. Click **"Databases"** in left sidebar
3. Click **"Create database"**

### 6.2 Configure Database
1. **Engine type:** Select **"MySQL"**
2. **Engine version:** Select latest stable (e.g., 8.0.35)
3. **Templates:** Select **"Free tier"** (for development)
4. **DB instance identifier:** `ologywood-db`
5. **Master username:** `admin`
6. **Master password:** Generate strong password
   - Save this password securely
7. **DB instance class:** `db.t3.micro` (free tier eligible)
8. **Storage type:** `gp3`
9. **Allocated storage:** `20 GB`
10. Click **"Create database"**

### 6.3 Wait for Database Creation
1. Database creation takes 5-10 minutes
2. You'll see status "Creating"
3. Wait for status to change to "Available"

### 6.4 Get Database Endpoint
1. Click on your database instance
2. Copy the **Endpoint** (looks like: `ologywood-db.xxxxx.us-east-1.rds.amazonaws.com`)
3. Save this for later use

## Step 7: Create ECR Repository for Docker Images

### 7.1 Create Repository
```bash
aws ecr create-repository \
  --repository-name ologywood-platform \
  --region us-east-1
```

### 7.2 Get Repository URI
```bash
aws ecr describe-repositories \
  --repository-names ologywood-platform \
  --region us-east-1 \
  --query 'repositories[0].repositoryUri' \
  --output text
```

Save this URI for Docker image deployment.

## Step 8: Create CloudWatch Log Group

### 8.1 Create Log Group
```bash
aws logs create-log-group \
  --log-group-name /ologywood/platform \
  --region us-east-1
```

### 8.2 Set Retention Policy
```bash
aws logs put-retention-policy \
  --log-group-name /ologywood/platform \
  --retention-in-days 30 \
  --region us-east-1
```

## Step 9: Set Up GitHub OIDC Provider

### 9.1 Create OIDC Provider
```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
  --region us-east-1
```

### 9.2 Create IAM Role for GitHub Actions
```bash
# Create trust policy file
cat > /tmp/trust-policy.json << 'EOF'
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
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:ologywood/ologywood-platform:*"
        }
      }
    }
  ]
}
EOF

# Replace ACCOUNT_ID with your AWS account ID
sed -i 's/ACCOUNT_ID/YOUR_ACCOUNT_ID/g' /tmp/trust-policy.json

# Create role
aws iam create-role \
  --role-name GitHubActionsRole \
  --assume-role-policy-document file:///tmp/trust-policy.json
```

### 9.3 Attach Policies to Role
```bash
aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/CloudFormationFullAccess

aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/IAMFullAccess
```

## Step 10: Create CloudFormation Stack

### 10.1 Deploy Stack
```bash
aws cloudformation create-stack \
  --stack-name ologywood-github-actions \
  --template-body file:///home/ubuntu/ologywood/cloudformation/github-actions-iam.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### 10.2 Monitor Stack Creation
```bash
aws cloudformation wait stack-create-complete \
  --stack-name ologywood-github-actions \
  --region us-east-1
```

### 10.3 Get Stack Outputs
```bash
aws cloudformation describe-stacks \
  --stack-name ologywood-github-actions \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Step 11: Set Up Cost Alerts

### 11.1 Create Budget Alert
1. Go to **"Billing"** → **"Budgets"**
2. Click **"Create budget"**
3. **Budget type:** Select **"Cost"**
4. **Budget name:** `Ologywood Monthly Budget`
5. **Budgeted amount:** `$50` (adjust as needed)
6. Click **"Create budget"**

### 11.2 Add Alert
1. Click **"Add an alert"**
2. **Alert threshold:** `80%` of budgeted amount
3. **Email recipients:** `ologywood5@gmail.com`
4. Click **"Create alert"**

## Step 12: Enable AWS Cost Explorer

### 12.1 Activate Cost Explorer
1. Go to **"Billing"** → **"Cost Explorer"**
2. Click **"Enable Cost Explorer"**
3. Wait for data to populate (24-48 hours)

### 12.2 Create Cost Analysis
1. Create custom reports to track spending
2. Set up alerts for unusual spending patterns

## Troubleshooting

### AWS CLI Authentication Issues
```bash
# Check current credentials
aws sts get-caller-identity

# Reconfigure credentials
aws configure
```

### S3 Bucket Access Denied
```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket ologywood-platform-data

# Check your IAM permissions
aws iam get-user-policy --user-name ologywood-dev --policy-name [POLICY_NAME]
```

### RDS Connection Issues
1. Check security group allows inbound traffic on port 3306
2. Verify database is in "Available" state
3. Test connection with MySQL client:
   ```bash
   mysql -h [ENDPOINT] -u admin -p
   ```

## Security Best Practices

✅ **Do:**
- Enable MFA on root account
- Use IAM users instead of root account
- Rotate access keys every 90 days
- Use strong, unique passwords
- Enable CloudTrail for audit logging
- Enable S3 versioning and encryption
- Use VPC for database security
- Monitor costs regularly

❌ **Don't:**
- Share AWS credentials
- Commit access keys to version control
- Use root account for daily tasks
- Disable MFA
- Use overly permissive IAM policies
- Leave unused resources running
- Ignore AWS billing alerts

## Next Steps

1. **Verify AWS setup** with `aws sts get-caller-identity`
2. **Test database connection** to RDS instance
3. **Configure GitHub secrets** with AWS credentials
4. **Deploy CloudFormation stack** for CI/CD infrastructure
5. **Set up monitoring** with CloudWatch dashboards

## Support

For AWS help:
- [AWS Documentation](https://docs.aws.amazon.com)
- [AWS Support Center](https://console.aws.amazon.com/support)
- [AWS Community Forums](https://forums.aws.amazon.com)
- [AWS Training and Certification](https://aws.amazon.com/training)

## Cost Estimation

**Free Tier (12 months):**
- RDS: 750 hours/month of `db.t3.micro`
- S3: 5 GB storage, 20,000 GET requests
- CloudWatch: 10 custom metrics, 1 GB logs

**Estimated Monthly Cost (after free tier):**
- RDS: ~$15-20/month
- S3: ~$1-5/month
- CloudWatch: ~$5-10/month
- **Total: ~$25-35/month**

Monitor costs regularly and adjust resources as needed.
