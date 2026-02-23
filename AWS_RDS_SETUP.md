# AWS RDS Migration for Ologywood

**Goal:** Move from TiDB Cloud to AWS RDS MySQL  
**Timeline:** 1-2 hours  
**Status:** Ready to execute

---

## Prerequisites

You need:
1. AWS account with RDS access
2. RDS MySQL instance created (or create one now)
3. RDS endpoint, username, password
4. Access to update Manus secrets

---

## Step 1: Create AWS RDS Instance (If Not Done)

### In AWS Console:
1. Go to **RDS → Databases → Create database**
2. Select **MySQL 8.0**
3. **DB Instance Class:** db.t3.micro (free tier)
4. **DB Instance Identifier:** ologywood-db
5. **Master Username:** admin
6. **Master Password:** [Create strong password - SAVE IT]
7. **Initial Database Name:** ologywood
8. **Publicly Accessible:** YES
9. **VPC Security Group:** Allow inbound MySQL (3306) from 0.0.0.0/0
10. Click **Create database**

### After Creation (5-10 minutes):
- Note the **Endpoint** (e.g., `ologywood-db.xxxxx.us-east-1.rds.amazonaws.com`)
- Your DATABASE_URL: `mysql://admin:PASSWORD@ENDPOINT:3306/ologywood`

---

## Step 2: Test RDS Connection

```bash
cd /home/ubuntu/ologywood

# Create test script
cat > test-rds.mjs << 'EOF'
import mysql from 'mysql2/promise';

const rdsEndpoint = process.argv[2];
const rdsPassword = process.argv[3];

if (!rdsEndpoint || !rdsPassword) {
  console.error('Usage: node test-rds.mjs <endpoint> <password>');
  process.exit(1);
}

const connection = await mysql.createConnection({
  host: rdsEndpoint,
  user: 'admin',
  password: rdsPassword,
  database: 'ologywood'
});

try {
  const [result] = await connection.execute('SELECT 1 as test');
  console.log('✓ Successfully connected to AWS RDS');
  console.log('✓ Database: ologywood');
  console.log('✓ Ready for migration');
} catch (error) {
  console.error('✗ Connection failed:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
EOF

# Run test
node test-rds.mjs YOUR_RDS_ENDPOINT YOUR_PASSWORD
```

---

## Step 3: Run Migrations to Create Schema

```bash
# Set DATABASE_URL to your RDS
export DATABASE_URL="mysql://admin:PASSWORD@YOUR_RDS_ENDPOINT:3306/ologywood"

# Run Drizzle migrations
pnpm db:push
```

Expected output:
```
✓ Migrations applied successfully
✓ 55 tables created
```

---

## Step 4: Verify Schema

```bash
cat > verify-schema.mjs << 'EOF'
import mysql from 'mysql2/promise';

const rdsEndpoint = process.argv[2];
const rdsPassword = process.argv[3];

const connection = await mysql.createConnection({
  host: rdsEndpoint,
  user: 'admin',
  password: rdsPassword,
  database: 'ologywood'
});

try {
  const [tables] = await connection.execute('SHOW TABLES');
  console.log(`✓ Found ${tables.length} tables in RDS`);
  
  if (tables.length === 55) {
    console.log('✓ All 55 tables created successfully');
  } else {
    console.warn(`⚠ Expected 55 tables, found ${tables.length}`);
  }
} finally {
  await connection.end();
}
EOF

node verify-schema.mjs YOUR_RDS_ENDPOINT YOUR_PASSWORD
```

---

## Step 5: Export Data from TiDB

```bash
cat > export-tidb.mjs << 'EOF'
import mysql from 'mysql2/promise';
import fs from 'fs';

const tidbConnection = await mysql.createConnection({
  host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2uXaD1wbYUFqiqF.root',
  password: 'cwRgelpxV28lX0k5',
  database: 'test',
  ssl: { rejectUnauthorized: false }
});

try {
  console.log('Exporting data from TiDB...');
  
  const [users] = await tidbConnection.execute('SELECT * FROM users');
  const [artists] = await tidbConnection.execute('SELECT * FROM artist_profiles');
  const [availability] = await tidbConnection.execute('SELECT * FROM availability');
  
  const exportData = {
    users,
    artists,
    availability,
    exportDate: new Date().toISOString()
  };
  
  fs.writeFileSync('tidb-export.json', JSON.stringify(exportData, null, 2));
  
  console.log(`✓ Exported ${users.length} users`);
  console.log(`✓ Exported ${artists.length} artists`);
  console.log(`✓ Exported ${availability.length} availability records`);
  console.log('✓ Data saved to tidb-export.json');
} finally {
  await tidbConnection.end();
}
EOF

node export-tidb.mjs
```

---

## Step 6: Import Data to RDS

```bash
cat > import-rds.mjs << 'EOF'
import mysql from 'mysql2/promise';
import fs from 'fs';

const rdsEndpoint = process.argv[2];
const rdsPassword = process.argv[3];

const data = JSON.parse(fs.readFileSync('tidb-export.json', 'utf-8'));

const rdsConnection = await mysql.createConnection({
  host: rdsEndpoint,
  user: 'admin',
  password: rdsPassword,
  database: 'ologywood'
});

try {
  console.log('Importing data to RDS...');
  
  // Import users
  for (const user of data.users) {
    await rdsConnection.execute(
      'INSERT INTO users (id, openId, name, email, loginMethod, role, createdAt, updatedAt, lastSignedIn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [user.id, user.openId, user.name, user.email, user.loginMethod, user.role, user.createdAt, user.updatedAt, user.lastSignedIn]
    );
  }
  console.log(`✓ Imported ${data.users.length} users`);
  
  // Import artists
  for (const artist of data.artists) {
    await rdsConnection.execute(
      'INSERT INTO artist_profiles (id, userId, artistName, genre, bio, location, feeRangeMin, feeRangeMax, touringPartySize, profilePhotoUrl, mediaGallery, websiteUrl, socialLinks, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [artist.id, artist.userId, artist.artistName, artist.genre, artist.bio, artist.location, artist.feeRangeMin, artist.feeRangeMax, artist.touringPartySize, artist.profilePhotoUrl, artist.mediaGallery, artist.websiteUrl, artist.socialLinks, artist.createdAt, artist.updatedAt]
    );
  }
  console.log(`✓ Imported ${data.artists.length} artists`);
  
  // Import availability
  for (const avail of data.availability) {
    await rdsConnection.execute(
      'INSERT INTO availability (id, artistId, date, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [avail.id, avail.artistId, avail.date, avail.status, avail.notes, avail.createdAt, avail.updatedAt]
    );
  }
  console.log(`✓ Imported ${data.availability.length} availability records`);
  console.log('✓ All data imported successfully');
  
} finally {
  await rdsConnection.end();
}
EOF

node import-rds.mjs YOUR_RDS_ENDPOINT YOUR_PASSWORD
```

---

## Step 7: Verify Data in RDS

```bash
cat > verify-data.mjs << 'EOF'
import mysql from 'mysql2/promise';

const rdsEndpoint = process.argv[2];
const rdsPassword = process.argv[3];

const connection = await mysql.createConnection({
  host: rdsEndpoint,
  user: 'admin',
  password: rdsPassword,
  database: 'ologywood'
});

try {
  const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
  const [artists] = await connection.execute('SELECT COUNT(*) as count FROM artist_profiles');
  
  console.log('Data verification:');
  console.log(`  Users: ${users[0].count}`);
  console.log(`  Artists: ${artists[0].count}`);
  
  if (artists[0].count === 6) {
    console.log('✓ All 6 artists successfully migrated');
  }
  
  const [artistList] = await connection.execute('SELECT artistName, location FROM artist_profiles ORDER BY artistName');
  console.log('\nArtists in RDS:');
  artistList.forEach(a => console.log(`  - ${a.artistName} (${a.location})`));
  
} finally {
  await connection.end();
}
EOF

node verify-data.mjs YOUR_RDS_ENDPOINT YOUR_PASSWORD
```

---

## Step 8: Update Manus Configuration

### Update DATABASE_URL Secret:
1. Open Manus Management UI
2. Go to **Settings → Secrets**
3. Find `DATABASE_URL`
4. Update value to: `mysql://admin:PASSWORD@YOUR_RDS_ENDPOINT:3306/ologywood`
5. Click **Save**

### Restart Dev Server:
The dev server will automatically reconnect to RDS when you save the secret.

---

## Step 9: Test Dev Server

1. Open dev server in browser: https://3000-YOUR_DEV_URL
2. Go to `/browse`
3. Verify all 6 artists display:
   - Luna Moonlight
   - The Velvet Collective
   - G.Chizo
   - Sofia Strings
   - The Rhythm Kings
   - Aurora Electronica

---

## Step 10: Deploy to Production

1. Manus Management UI → **Publish** button (top right)
2. Wait for deployment to complete
3. Visit https://www.ologywood.com/browse
4. Verify artists display on live site

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Check RDS security group allows 3306 from 0.0.0.0/0 |
| Access denied | Verify username/password are correct |
| Tables not found | Run `pnpm db:push` again with correct DATABASE_URL |
| Data not showing | Check tidb-export.json has data, re-run import script |

---

## Cleanup

After successful migration:
1. Keep TiDB Cloud for 1 week as backup
2. Monitor RDS for issues
3. After 1 week, delete TiDB Cloud instance (saves $50-100/month)

---

## Next Steps

1. Create RDS instance in AWS
2. Run the migration scripts above
3. Update Manus secrets
4. Deploy to production
5. Monitor for 24 hours

Ready to proceed?
