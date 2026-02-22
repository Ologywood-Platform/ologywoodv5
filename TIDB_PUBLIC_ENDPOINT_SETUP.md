# How to Enable Public Endpoint with SSL in TiDB Cloud

## Step-by-Step Visual Guide

### Step 1: Log Into TiDB Cloud
1. Go to https://tidbcloud.com
2. Log in with your account
3. You should see your cluster in the dashboard

---

### Step 2: Navigate to Your Cluster
1. In the TiDB Cloud console, find your cluster (e.g., "ologywood")
2. Click on the cluster name to open it
3. You should see the cluster details page

---

### Step 3: Find the Connect Button
1. Look for a **"Connect"** button (usually in the top right or center of the page)
2. Click the **"Connect"** button
3. A dialog/modal will appear with connection options

---

### Step 4: Select Public Endpoint Tab
In the Connect dialog, you'll see tabs at the top:
- **Public Endpoint** ← Click this one
- Private Endpoint
- VPC Peering
- Other options

**Click on "Public Endpoint" tab**

---

### Step 5: Enable Public Endpoint (If Not Already Enabled)
You should see one of these scenarios:

**Scenario A: Public Endpoint is Already Enabled**
- You'll see a message: "Public Endpoint is enabled"
- You'll see the connection details (host, port, username)
- SSL is enabled by default
- **Skip to Step 6**

**Scenario B: Public Endpoint is Disabled**
- You'll see a message: "Public Endpoint is not enabled"
- There will be an **"Enable"** or **"Create"** button
- Click the **"Enable"** button
- Wait 1-2 minutes for it to be created
- Then proceed to Step 6

---

### Step 6: Verify SSL is Enabled
In the Public Endpoint section, look for:
- **"SSL"** or **"TLS"** option
- It should show: **"Enabled"** or **"Required"**
- This is usually enabled by default

**If SSL is disabled:**
1. Look for a toggle or button to enable it
2. Click to enable SSL
3. Wait for the change to apply

---

### Step 7: Copy Your Connection Details
You should see a section with connection information:

```
Host: gateway03.us-east-1.prod.aws.tidbcloud.com
Port: 4000
Username: KrGaEuKwKPW5NAp.root
Password: [Click to reveal or copy]
```

**Copy each of these details:**
1. **Host** - Copy the full hostname
2. **Port** - Should be 4000
3. **Username** - Copy the full username (includes the cluster ID prefix)
4. **Password** - Click "Copy" or "Reveal" and copy the password

---

### Step 8: Build Your Connection String
Use this format:
```
mysql://USERNAME:PASSWORD@HOST:4000/ologywood
```

**Example:**
```
mysql://KrGaEuKwKPW5NAp.root:MySecurePassword123@gateway03.us-east-1.prod.aws.tidbcloud.com:4000/ologywood
```

---

## Troubleshooting

### "Public Endpoint is disabled" or "Not available"
**Solution:**
1. Make sure you're on a Serverless Tier cluster (not Dedicated)
2. Click the "Enable" button if available
3. Wait 2-3 minutes for it to be created
4. Refresh the page if needed

### "SSL/TLS is not enabled"
**Solution:**
1. Look for a toggle or checkbox to enable SSL
2. Click to enable it
3. Wait for the change to apply (usually instant)
4. Refresh if needed

### "Connection string shows mysql+srv://"
**Solution:**
- This is fine, but you can also use regular `mysql://` format
- Both work, but `mysql://` is simpler

### "Can't find the Connect button"
**Solution:**
1. Make sure you're viewing the cluster details (not the cluster list)
2. Look for a button in the top right area of the page
3. It might be labeled "Connect" or have a connection icon

---

## What You Should See

After enabling Public Endpoint with SSL, you should see:

✅ **Public Endpoint** section with:
- Host name
- Port (4000)
- Username
- Password field
- **SSL: Enabled** or **TLS: Required**

✅ **Connection examples** showing:
```
mysql -h gateway03.us-east-1.prod.aws.tidbcloud.com -P 4000 -u KrGaEuKwKPW5NAp.root -p
```

---

## Next Steps

Once you have the connection details:

1. **Create the database:**
   ```sql
   CREATE DATABASE ologywood;
   ```

2. **Update DATABASE_URL in Manus:**
   - Go to Manus Management UI → Settings → Secrets
   - Set DATABASE_URL to your connection string
   - Save

3. **Restart dev server:**
   - The dev server will automatically reconnect with the new DATABASE_URL

4. **Verify connection:**
   - Artists should appear on the homepage
   - Artist search should work
   - Images should display

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Connection refused" | Make sure Public Endpoint is enabled |
| "Access denied" | Check username and password are correct |
| "SSL error" | Make sure SSL is enabled in the connection settings |
| "Unknown database" | Create the database with `CREATE DATABASE ologywood;` |
| "Connection timeout" | Check your firewall allows outbound connections to TiDB |

---

## Security Notes

- ✅ Public Endpoint with SSL is secure
- ✅ Your password is encrypted in transit
- ✅ TiDB Cloud provides DDoS protection
- ✅ You can restrict access by IP if needed (optional)

---

## Once Connected

After successfully connecting, run this to create all tables:
```bash
cd /home/ubuntu/ologywood
DATABASE_URL="mysql://USERNAME:PASSWORD@HOST:4000/ologywood" pnpm db:push
```

Then seed test data:
```bash
DATABASE_URL="mysql://USERNAME:PASSWORD@HOST:4000/ologywood" node seed-production-data.mjs
```

