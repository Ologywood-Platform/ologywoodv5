# AWS RDS Setup - Step by Step Guide

## Step 1: Click "Create a database"

You should see options:
- **Standard create** (recommended)
- **Easy create**

Select **Standard create**

---

## Step 2: Choose Engine

Look for **MySQL** and select it.

**Version:** MySQL 8.0.35 (or latest 8.0.x)

Click **Next** or continue to configuration

---

## Step 3: DB Instance Class

Under "DB instance class":
- Select **Burstable classes (includes t classes)**
- Choose **db.t3.micro** (this is free tier eligible)

---

## Step 4: DB Instance Identifier

Enter: `ologywood-db`

---

## Step 5: Master Username & Password

**Master username:** `admin`

**Master password:** Generate a strong password and **SAVE IT SOMEWHERE SAFE**
- Example: `Ologywood2024!SecurePass123`

Confirm password in the next field

---

## Step 6: Storage

- **Storage type:** gp3 (General Purpose)
- **Allocated storage:** 20 GB
- **Storage autoscaling:** Enable (optional, but recommended)

---

## Step 7: Connectivity

**VPC:** Default VPC

**Publicly accessible:** YES (this is important - we need to connect from outside AWS)

**VPC security group:** 
- Create new security group
- Name: `ologywood-sg`

---

## Step 8: Database Options

**Initial database name:** `ologywood`

**Port:** 3306 (default)

**DB Parameter group:** default.mysql8.0

**Option group:** default:mysql-8-0

---

## Step 9: Backup

**Backup retention period:** 7 days

**Backup window:** Default is fine

---

## Step 10: Encryption

**Enable encryption:** Yes

**KMS key:** aws/rds (default)

---

## Step 11: Monitoring

**Enable Enhanced monitoring:** No (optional, not needed for dev)

---

## Step 12: Additional Configuration

**Initial database name:** `ologywood` (should already be set)

**DB port:** 3306

**Enable automated backups:** Yes

**Enable automatic minor version upgrades:** Yes

---

## Step 13: Create Database

Click **Create database** button

**Wait 5-10 minutes** for the instance to be created and available

---

## Step 14: Get Connection Details

Once the instance shows **"Available"** status:

1. Click on the instance name: `ologywood-db`
2. Scroll down to **Connectivity & security**
3. Copy the **Endpoint** (looks like: `ologywood-db.xxxxx.us-east-1.rds.amazonaws.com`)
4. Note the **Port:** 3306

---

## Step 15: Configure Security Group

The security group needs to allow MySQL connections:

1. In the RDS console, click on your instance
2. Under **VPC security groups**, click on the security group name
3. Go to **Inbound rules**
4. Click **Edit inbound rules**
5. Click **Add rule**
6. Configure:
   - **Type:** MySQL/Aurora
   - **Protocol:** TCP
   - **Port:** 3306
   - **Source:** 0.0.0.0/0 (allow from anywhere)
7. Click **Save rules**

---

## Your Connection Details

Once everything is set up, you'll have:

```
Host: ologywood-db.xxxxx.us-east-1.rds.amazonaws.com
Port: 3306
Username: admin
Password: [Your password]
Database: ologywood

DATABASE_URL: mysql://admin:YOUR_PASSWORD@ologywood-db.xxxxx.us-east-1.rds.amazonaws.com:3306/ologywood
```

---

## Next Steps

Once the RDS instance is created and available:

1. Share the endpoint and password with me
2. I'll run the migration scripts to:
   - Create all 55 tables
   - Migrate the 6 artists from TiDB
   - Verify everything works
3. Update Manus configuration
4. Deploy to production

---

## Troubleshooting

**Instance stuck in "creating" state:**
- Wait longer (can take 10-15 minutes)
- Refresh the page

**Can't find the endpoint:**
- Make sure instance status is "Available"
- Endpoint is under "Connectivity & security" section

**Security group issues:**
- Make sure you allowed MySQL (3306) from 0.0.0.0/0
- Wait a few minutes for the rule to take effect

---

## Cost Note

- **db.t3.micro:** Free tier (first 12 months)
- **20 GB storage:** Free tier
- **Data transfer:** Minimal cost
- **Total:** $0/month (free tier) or ~$10-15/month after free tier expires

This is much cheaper than TiDB Cloud ($50-100/month)
