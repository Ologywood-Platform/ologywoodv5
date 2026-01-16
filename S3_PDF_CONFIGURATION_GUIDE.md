# S3 Bucket Configuration Guide for Contract PDF Storage

## Overview

This guide explains how to configure AWS S3 for storing contract PDFs with lifecycle policies, security settings, and presigned URL generation.

## Prerequisites

- AWS account with S3 access
- AWS CLI installed and configured
- IAM user with S3 permissions
- Manus platform with S3 integration enabled

## Step 1: Create S3 Bucket

### Using AWS Console

1. Go to **S3 Dashboard** → **Create Bucket**
2. Enter bucket name: `ologywood-contracts-pdf` (must be globally unique)
3. Select region: Choose closest to your users
4. Block Public Access: **Enable all** (keep PDFs private)
5. Enable versioning: **Enable** (for version history)
6. Enable encryption: **Enable** (AES-256 or KMS)
7. Click **Create Bucket**

### Using AWS CLI

```bash
aws s3api create-bucket \
  --bucket ologywood-contracts-pdf \
  --region us-east-1 \
  --create-bucket-configuration LocationConstraint=us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket ologywood-contracts-pdf \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket ologywood-contracts-pdf \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket ologywood-contracts-pdf \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

## Step 2: Configure Lifecycle Policy

Lifecycle policies automatically delete old PDFs after 365 days to manage storage costs.

### Using AWS Console

1. Go to **Bucket** → **Management** → **Lifecycle Rules**
2. Click **Create Lifecycle Rule**
3. Name: `Archive-Old-PDFs`
4. Scope: Apply to all objects
5. Transitions:
   - Move to Glacier after 90 days
   - Move to Deep Archive after 180 days
6. Expiration: Delete after 365 days
7. Click **Create Rule**

### Using AWS CLI

```bash
cat > lifecycle-policy.json << 'EOF'
{
  "Rules": [
    {
      "Id": "Archive-Old-PDFs",
      "Status": "Enabled",
      "Filter": { "Prefix": "contracts/" },
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        },
        {
          "Days": 180,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket ologywood-contracts-pdf \
  --lifecycle-configuration file://lifecycle-policy.json
```

## Step 3: Configure CORS (Cross-Origin Resource Sharing)

Allow your web application to download PDFs directly from S3.

### Using AWS Console

1. Go to **Bucket** → **Permissions** → **CORS**
2. Add CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### Using AWS CLI

```bash
cat > cors-policy.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedOrigins": ["https://yourdomain.com"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket ologywood-contracts-pdf \
  --cors-configuration file://cors-policy.json
```

## Step 4: Create IAM Policy for Application

Create an IAM policy that allows your application to upload and download PDFs.

### IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ContractPdfUpload",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::ologywood-contracts-pdf/contracts/*"
    },
    {
      "Sid": "ContractPdfDownload",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion"
      ],
      "Resource": "arn:aws:s3:::ologywood-contracts-pdf/contracts/*"
    },
    {
      "Sid": "ContractPdfDelete",
      "Effect": "Allow",
      "Action": [
        "s3:DeleteObject",
        "s3:DeleteObjectVersion"
      ],
      "Resource": "arn:aws:s3:::ologywood-contracts-pdf/contracts/*"
    },
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::ologywood-contracts-pdf"
    }
  ]
}
```

### Create IAM User

```bash
# Create user
aws iam create-user --user-name ologywood-pdf-service

# Create access key
aws iam create-access-key --user-name ologywood-pdf-service

# Attach policy
aws iam put-user-policy \
  --user-name ologywood-pdf-service \
  --policy-name ContractPdfPolicy \
  --policy-document file://policy.json
```

## Step 5: Configure Environment Variables

Add S3 credentials to your environment:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=ologywood-contracts-pdf
S3_BUCKET_REGION=us-east-1

# PDF Storage Configuration
PDF_STORAGE_PREFIX=contracts/
PDF_RETENTION_DAYS=365
PDF_PRESIGNED_URL_EXPIRY=3600
```

## Step 6: Generate Presigned URLs

Presigned URLs allow temporary access to private PDFs without exposing AWS credentials.

### Using AWS CLI

```bash
# Generate presigned URL (valid for 1 hour)
aws s3 presign s3://ologywood-contracts-pdf/contracts/contract-123.pdf \
  --expires-in 3600 \
  --region us-east-1
```

### Using Node.js/TypeScript

```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

async function generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}
```

## Step 7: Upload PDFs to S3

### Using AWS CLI

```bash
# Upload single file
aws s3 cp contract.pdf s3://ologywood-contracts-pdf/contracts/contract-123.pdf

# Upload with metadata
aws s3 cp contract.pdf s3://ologywood-contracts-pdf/contracts/contract-123.pdf \
  --metadata "contractId=123,certificateNumber=CERT-123,userId=456"
```

### Using Node.js/TypeScript

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

async function uploadPdfToS3(
  key: string,
  buffer: Buffer,
  metadata: Record<string, string> = {}
): Promise<{ key: string; url: string }> {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: 'application/pdf',
    Metadata: metadata,
    ServerSideEncryption: 'AES256',
  });

  await s3Client.send(command);

  const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  return { key, url };
}
```

## Step 8: Retrieve PDFs from S3

### Using AWS CLI

```bash
# Download file
aws s3 cp s3://ologywood-contracts-pdf/contracts/contract-123.pdf contract.pdf

# Get object metadata
aws s3api head-object \
  --bucket ologywood-contracts-pdf \
  --key contracts/contract-123.pdf
```

### Using Node.js/TypeScript

```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

async function downloadPdfFromS3(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);
  const chunks: Buffer[] = [];

  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}
```

## Step 9: Monitor S3 Usage

### CloudWatch Metrics

```bash
# View bucket size
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name BucketSizeBytes \
  --dimensions Name=BucketName,Value=ologywood-contracts-pdf Name=StorageType,Value=StandardStorage \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z \
  --period 86400 \
  --statistics Average
```

### S3 Inventory

Enable S3 Inventory to track all objects:

1. Go to **Bucket** → **Management** → **Inventory Configurations**
2. Create new inventory
3. Output format: CSV or Parquet
4. Destination: Another S3 bucket or Athena

## Step 10: Security Best Practices

### Enable MFA Delete

```bash
aws s3api put-bucket-versioning \
  --bucket ologywood-contracts-pdf \
  --versioning-configuration Status=Enabled,MFADelete=Enabled \
  --mfa "arn:aws:iam::123456789012:mfa/user 123456"
```

### Enable Logging

```bash
# Create logging bucket
aws s3api create-bucket --bucket ologywood-contracts-logs

# Enable logging
aws s3api put-bucket-logging \
  --bucket ologywood-contracts-pdf \
  --bucket-logging-status '{
    "LoggingEnabled": {
      "TargetBucket": "ologywood-contracts-logs",
      "TargetPrefix": "access-logs/"
    }
  }'
```

### Enable CloudTrail

```bash
aws cloudtrail create-trail \
  --name ologywood-s3-trail \
  --s3-bucket-name ologywood-contracts-logs

aws cloudtrail start-logging --trail-name ologywood-s3-trail
```

## Troubleshooting

### Issue: Access Denied when uploading

**Solution:**
- Verify IAM policy is attached to user
- Check bucket policy allows the action
- Verify AWS credentials are correct

### Issue: Presigned URL expires too quickly

**Solution:**
- Increase `expiresIn` parameter (max 7 days)
- Implement refresh token mechanism
- Use CloudFront for longer caching

### Issue: High S3 costs

**Solution:**
- Enable lifecycle policies to move to Glacier
- Implement retention policies
- Use S3 Intelligent-Tiering
- Monitor usage with CloudWatch

### Issue: Slow PDF downloads

**Solution:**
- Use CloudFront CDN for caching
- Enable S3 Transfer Acceleration
- Optimize PDF file size
- Use multipart uploads for large files

## Testing

### Test Upload

```bash
# Create test PDF
echo "Test PDF" > test.pdf

# Upload to S3
aws s3 cp test.pdf s3://ologywood-contracts-pdf/contracts/test.pdf

# Verify upload
aws s3 ls s3://ologywood-contracts-pdf/contracts/
```

### Test Download

```bash
# Generate presigned URL
PRESIGNED_URL=$(aws s3 presign s3://ologywood-contracts-pdf/contracts/test.pdf)

# Download using presigned URL
curl -o downloaded.pdf "$PRESIGNED_URL"

# Verify file
file downloaded.pdf
```

### Test Lifecycle Policy

```bash
# List objects with storage class
aws s3api list-objects-v2 \
  --bucket ologywood-contracts-pdf \
  --query 'Contents[*].[Key,StorageClass]' \
  --output table
```

## Production Checklist

- [ ] S3 bucket created and configured
- [ ] Versioning enabled
- [ ] Encryption enabled (AES-256 or KMS)
- [ ] Public access blocked
- [ ] Lifecycle policy configured (365-day retention)
- [ ] CORS policy configured
- [ ] IAM policy created and attached
- [ ] Environment variables configured
- [ ] Presigned URL generation tested
- [ ] Upload/download functionality tested
- [ ] CloudWatch monitoring enabled
- [ ] CloudTrail logging enabled
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented

## Cost Estimation

**Monthly costs for 10,000 PDFs (avg 2MB each):**

- Storage: ~$200 (20GB @ $0.023/GB)
- Requests: ~$50 (10K uploads + 50K downloads)
- Data transfer: ~$100 (50GB @ $0.02/GB)
- **Total: ~$350/month**

Use S3 Intelligent-Tiering to reduce costs by 30-50%.

## Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [S3 Lifecycle Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
