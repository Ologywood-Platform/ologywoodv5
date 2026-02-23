# TiDB Connection Troubleshooting Guide

## Current Issue
Production site (www.ologywood.com) shows "No artists found" while dev server displays all 10 artists correctly, despite both using the same DATABASE_URL.

---

## TiDB Connection Requirements

### 1. Connection String Format
```
mysql://username:password@host:port/database
```

**Current Connection String:**
```
mysql://2uXaD1wbYUFqiqF.root:cwRgelpxV28lX0k5@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test
```

**Components:**
- **Username:** `2uXaD1wbYUFqiqF.root`
- **Password:** `cwRgelpxV28lX0k5`
- **Host:** `gateway01.us-east-1.prod.aws.tidbcloud.com`
- **Port:** `4000` (TiDB cloud gateway port)
- **Database:** `test`

### 2. SSL/TLS Requirements
TiDB Cloud requires SSL/TLS connections. Our current configuration:

```javascript
ssl: {} // Enable SSL with default Node.js Mozilla CA certificates
```

This is correct for TiDB Cloud Serverless/Starter/Essential because:
- Node.js has built-in Mozilla CA certificates
- No manual certificate configuration needed
- SSL is enabled by default with empty object

### 3. Connection Pool Configuration
```javascript
const pool = mysql.createPool({
  host: url.hostname,
  port: parseInt(url.port || '3306'),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  ssl: {} // Enable SSL for TiDB with default settings
});
```

---

## Diagnosis Steps

### Step 1: Verify DATABASE_URL in Production
Check if the environment variable is properly set in the Manus Management UI:
1. Go to Management UI → Settings → Secrets
2. Look for `DATABASE_URL`
3. Verify it matches: `mysql://2uXaD1wbYUFqiqF.root:cwRgelpxV28lX0k5@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test`

### Step 2: Check Connection Logs
Add enhanced logging to diagnose connection issues:

```javascript
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      console.log("[Database] DATABASE_URL exists:", !!process.env.DATABASE_URL);
      console.log("[Database] DATABASE_URL length:", process.env.DATABASE_URL.length);
      
      const url = new URL(process.env.DATABASE_URL);
      console.log("[Database] Parsed URL - Host:", url.hostname);
      console.log("[Database] Parsed URL - Port:", url.port);
      console.log("[Database] Parsed URL - Database:", url.pathname);
      
      const pool = mysql.createPool({
        host: url.hostname,
        port: parseInt(url.port || '3306'),
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        ssl: {}
      });
      
      // Test connection immediately
      const connection = await pool.getConnection();
      console.log("[Database] Connection test successful");
      connection.release();
      
      _pool = pool;
      _db = drizzle(pool, { schema, mode: 'default' });
      console.log("[Database] Connected successfully to TiDB");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      console.error("[Database] Error details:", {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState
      });
      _db = null;
    }
  }
  return _db;
}
```

### Step 3: Test Connection Endpoint
Create a test endpoint to verify database connectivity:

```javascript
// Add to routers.ts
debug: router({
  // ... existing debug routes
  
  testDatabase: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        return { status: 'error', message: 'Database not initialized' };
      }
      
      // Test query
      const result = await db.select().from(artistProfiles).limit(1);
      return { 
        status: 'success', 
        message: 'Database connection working',
        artistCount: result.length 
      };
    } catch (error) {
      return { 
        status: 'error', 
        message: error.message 
      };
    }
  }),
}),
```

---

## Common TiDB Connection Issues

### Issue 1: SSL Certificate Verification Failed
**Symptom:** Connection timeout or "ECONNREFUSED"
**Solution:** Ensure `ssl: {}` is set in pool configuration

### Issue 2: Wrong Port
**Symptom:** Connection refused
**Solution:** TiDB Cloud uses port 4000 (not 3306). Verify in connection string.

### Issue 3: Database Name Wrong
**Symptom:** "Unknown database" error
**Solution:** Ensure database name is `test` (extracted from URL path `/test`)

### Issue 4: Credentials Invalid
**Symptom:** "Access denied for user" error
**Solution:** Verify username and password match TiDB Cloud account

### Issue 5: Connection Pool Exhausted
**Symptom:** Timeout errors after many requests
**Solution:** Increase `connectionLimit` in pool configuration

---

## Potential Root Causes for Production Issue

### Cause 1: Environment Variable Not Set
**Check:** Go to Management UI → Settings → Secrets
**Fix:** Ensure DATABASE_URL is set to the correct value

### Cause 2: Stale Deployment
**Check:** Production code might be using old database connection
**Fix:** Publish a new checkpoint to force fresh deployment

### Cause 3: Connection Pool Not Initialized
**Check:** If `getDb()` is never called, pool is never created
**Fix:** Ensure at least one database query is made on app startup

### Cause 4: Network/Firewall Issue
**Check:** Production environment might have different network access
**Fix:** Verify TiDB Cloud IP whitelist includes production server IPs

### Cause 5: Different Database Instance
**Check:** Production might be pointing to a different TiDB cluster
**Fix:** Verify DATABASE_URL in production matches dev server

---

## Solution: Enhanced Connection Configuration

Update `server/db.ts` with improved connection handling:

```javascript
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Log connection attempt
      console.log("[Database] Attempting to connect to TiDB Cloud...");
      
      const url = new URL(process.env.DATABASE_URL);
      
      const pool = mysql.createPool({
        host: url.hostname,
        port: parseInt(url.port || '3306'),
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelayMs: 0,
        ssl: 'require', // Explicitly require SSL
        authPlugins: {
          mysql_clear_password: () => () => url.password,
        }
      });
      
      // Test connection on startup
      try {
        const connection = await pool.getConnection();
        const result = await connection.query('SELECT 1');
        connection.release();
        console.log("[Database] Connection test successful");
      } catch (testError) {
        console.error("[Database] Connection test failed:", testError.message);
        throw testError;
      }
      
      _pool = pool;
      _db = drizzle(pool, { schema, mode: 'default' });
      console.log("[Database] Drizzle ORM initialized successfully");
      
    } catch (error) {
      console.error("[Database] Connection failed:", {
        message: error.message,
        code: error.code,
        host: error.host,
        port: error.port,
      });
      _db = null;
      throw error; // Re-throw to prevent silent failures
    }
  }
  return _db;
}
```

---

## Verification Checklist

- [ ] DATABASE_URL is set in Management UI → Settings → Secrets
- [ ] DATABASE_URL value: `mysql://2uXaD1wbYUFqiqF.root:cwRgelpxV28lX0k5@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test`
- [ ] Dev server shows all 10 artists on /browse
- [ ] Production server shows all 10 artists on /browse
- [ ] Database connection logs show successful connection
- [ ] Test endpoint returns artist count > 0
- [ ] No SSL/TLS errors in logs
- [ ] Connection pool is properly initialized

---

## Next Steps

1. **Check Management UI Secrets** - Verify DATABASE_URL is properly configured
2. **Publish New Checkpoint** - Force fresh deployment with improved logging
3. **Monitor Production Logs** - Check for connection errors
4. **Test Database Endpoint** - Use `/api/debug/testDatabase` to verify connectivity
5. **Verify Artists Display** - Check www.ologywood.com/browse shows all 6 artists

---

## References

- [TiDB Cloud mysql2 Connection Guide](https://docs.pingcap.com/developer/dev-guide-sample-application-nodejs-mysql2/)
- [TiDB SSL/TLS Configuration](https://docs.pingcap.com/tidbcloud/secure-connections-to-serverless-clusters)
- [mysql2 Pool Configuration](https://github.com/sidorares/node-mysql2#connection-pools)
