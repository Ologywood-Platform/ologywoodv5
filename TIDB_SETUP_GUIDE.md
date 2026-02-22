# TiDB Setup Guide for Ologywood Platform

## Quick Summary

The Ologywood platform needs a MySQL-compatible database. You can set this up on TiDB (TiDB Cloud) with the following steps.

---

## Step 1: Create TiDB Cloud Account & Cluster

1. Go to https://tidbcloud.com
2. Sign up for a free account (or log in if you have one)
3. Create a new **Serverless Tier** cluster
   - **Cluster Name:** `ologywood` (or any name you prefer)
   - **Region:** Choose closest to your location (e.g., us-east-1)
   - **Plan:** Serverless Tier (free tier available)

4. Wait for cluster to be created (usually 2-3 minutes)

---

## Step 2: Enable Public Endpoint with SSL

1. In TiDB Cloud console, go to your cluster
2. Click **Connect** button
3. Select **Public Endpoint** tab
4. **Enable Public Endpoint** if not already enabled
5. **Important:** Make sure SSL is enabled (it should be by default)

---

## Step 3: Get Connection Details

In the **Connect** dialog, you'll see:
- **Host:** (something like `gateway03.us-east-1.prod.aws.tidbcloud.com`)
- **Port:** `4000`
- **Username:** (something like `KrGaEuKwKPW5NAp.root`)
- **Password:** (will be shown or you can reset it)
- **Database:** Leave blank for now (we'll create it)

**Copy these details - you'll need them in the next step.**

---

## Step 4: Create Database & Tables

1. In TiDB Cloud console, click **SQL Editor** or use a MySQL client
2. Run this SQL to create the database:

```sql
CREATE DATABASE IF NOT EXISTS ologywood;
USE ologywood;
```

3. Then run the schema migration. You have two options:

### Option A: Use Drizzle Migration (Recommended)
```bash
cd /home/ubuntu/ologywood
DATABASE_URL="mysql://USERNAME:PASSWORD@HOST:4000/ologywood" pnpm db:push
```

Replace:
- `USERNAME` with your TiDB username (e.g., `KrGaEuKwKPW5NAp.root`)
- `PASSWORD` with your TiDB password
- `HOST` with your TiDB host (e.g., `gateway03.us-east-1.prod.aws.tidbcloud.com`)

### Option B: Manual SQL (If Option A doesn't work)
Run the SQL from `/home/ubuntu/ologywood/drizzle/schema.ts` manually in TiDB SQL Editor

---

## Step 5: Update Environment Variable

1. In Manus Management UI, go to **Settings → Secrets**
2. Find or create `DATABASE_URL` with this format:

```
mysql://USERNAME:PASSWORD@HOST:4000/ologywood
```

Example:
```
mysql://KrGaEuKwKPW5NAp.root:mypassword123@gateway03.us-east-1.prod.aws.tidbcloud.com:4000/ologywood
```

3. Save the secret

---

## Step 6: Restart Dev Server

```bash
cd /home/ubuntu/ologywood
pnpm dev
```

Or use the Manus Management UI to restart the dev server.

---

## Step 7: Seed Test Data

Once the database is connected and tables are created, seed test data:

```bash
cd /home/ubuntu/ologywood
DATABASE_URL="mysql://USERNAME:PASSWORD@HOST:4000/ologywood" node seed-production-data.mjs
```

This will create:
- 753 test users
- 627 artists
- 100 venues
- Sample bookings
- Sample riders
- Sample messages

---

## Troubleshooting

### Error: "Connections using insecure transport are prohibited"
**Solution:** Make sure you're using the **Public Endpoint** with **SSL enabled**. The connection string should use `mysql://` protocol (not `mysql+ssl://`).

### Error: "Access denied for user"
**Solution:** Check your username and password are correct. You can reset the password in TiDB Cloud console.

### Error: "Unknown database 'ologywood'"
**Solution:** Make sure you created the database with `CREATE DATABASE ologywood;` before running migrations.

### Error: "Connection timeout"
**Solution:** Make sure Public Endpoint is enabled and your IP is not blocked by firewall rules.

---

## Verification

Once everything is set up, you should see:

1. **Dev server starts without errors**
2. **Artists display on homepage** (after seeding data)
3. **Artist search works**
4. **Venue browse works**
5. **Images display for artists and venues**

---

## Connection String Format

```
mysql://[username]:[password]@[host]:[port]/[database]
```

Example with all parts:
```
mysql://KrGaEuKwKPW5NAp.root:MySecurePassword123@gateway03.us-east-1.prod.aws.tidbcloud.com:4000/ologywood
```

---

## Next Steps After Setup

1. Verify database is connected: `pnpm test` (should pass database tests)
2. Seed data: `node seed-production-data.mjs`
3. Test platform: Visit dev server and verify artists display
4. Deploy to production: Use Manus Management UI Publish button

