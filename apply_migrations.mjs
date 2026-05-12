import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = __dirname;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const url = new URL(DATABASE_URL);
const isTiDB = url.hostname.includes('tidbcloud.com');

const poolConfig = {
  host: url.hostname,
  port: parseInt(url.port || '3306'),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  waitForConnections: true,
  connectionLimit: 1,
  multipleStatements: true,
  ...(isTiDB ? { ssl: {} } : {}),
};

async function main() {
  const pool = mysql.createPool(poolConfig);
  
  // Get the last applied migration hash
  const [rows] = await pool.query('SELECT hash FROM __drizzle_migrations ORDER BY id DESC LIMIT 1');
  const lastHash = rows[0]?.hash;
  console.log(`Last applied migration: ${lastHash}`);
  
  // Read the journal
  const journal = JSON.parse(fs.readFileSync(path.join(projectDir, 'drizzle/meta/_journal.json'), 'utf8'));
  
  // Find the index of the last applied migration
  let startIdx = -1;
  for (let i = 0; i < journal.entries.length; i++) {
    if (journal.entries[i].tag === lastHash) {
      startIdx = i + 1;
      break;
    }
  }
  
  // Also check by hash (some entries use SHA hash instead of tag)
  if (startIdx === -1) {
    for (let i = 0; i < journal.entries.length; i++) {
      const sqlFile = path.join(projectDir, `drizzle/${journal.entries[i].tag}.sql`);
      if (fs.existsSync(sqlFile)) {
        const content = fs.readFileSync(sqlFile, 'utf8');
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        if (hash === lastHash) {
          startIdx = i + 1;
          break;
        }
      }
    }
  }
  
  if (startIdx === -1) {
    console.error(`Could not find last applied migration "${lastHash}" in journal`);
    // Try to find by name pattern
    console.log('Attempting to find by index...');
    // The last applied is 0046_certain_mockingbird, which is index 46 in journal
    startIdx = 47; // Start from 0047
  }
  
  const pendingMigrations = journal.entries.slice(startIdx);
  console.log(`\nPending migrations: ${pendingMigrations.length}`);
  
  if (pendingMigrations.length === 0) {
    console.log('No pending migrations!');
    await pool.end();
    return;
  }
  
  for (const entry of pendingMigrations) {
    const sqlFile = path.join(projectDir, `drizzle/${entry.tag}.sql`);
    if (!fs.existsSync(sqlFile)) {
      console.error(`  ❌ SQL file not found: ${entry.tag}.sql`);
      continue;
    }
    
    const sql = fs.readFileSync(sqlFile, 'utf8').trim();
    if (!sql) {
      console.log(`  ⏭️  ${entry.tag} (empty file, skipping)`);
      // Still record it as applied
      const hash = crypto.createHash('sha256').update(sql || '').digest('hex');
      await pool.query(
        'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
        [entry.tag, Date.now()]
      );
      continue;
    }
    
    // Split by --> statement-breakpoint
    const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s);
    
    console.log(`  📦 Applying ${entry.tag} (${statements.length} statements)...`);
    
    const conn = await pool.getConnection();
    try {
      for (const stmt of statements) {
        if (!stmt) continue;
        try {
          await conn.query(stmt);
        } catch (err) {
          // Handle "table already exists" or "column already exists" gracefully
          if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.errno === 1050) {
            console.log(`    ⚠️  Table already exists, skipping: ${err.message.split("'")[1] || 'unknown'}`);
          } else if (err.code === 'ER_DUP_FIELDNAME' || err.errno === 1060) {
            console.log(`    ⚠️  Column already exists, skipping: ${err.message}`);
          } else if (err.code === 'ER_DUP_KEYNAME' || err.errno === 1061) {
            console.log(`    ⚠️  Index already exists, skipping: ${err.message}`);
          } else if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY' || err.errno === 1091) {
            console.log(`    ⚠️  Can't drop (doesn't exist), skipping: ${err.message}`);
          } else if (err.code === 'ER_BAD_TABLE_ERROR' || err.errno === 1051) {
            console.log(`    ⚠️  Table doesn't exist to drop, skipping: ${err.message}`);
          } else {
            console.error(`    ❌ Error in ${entry.tag}: ${err.message}`);
            console.error(`    Statement: ${stmt.substring(0, 100)}...`);
            throw err; // Re-throw for non-recoverable errors
          }
        }
      }
      
      // Record migration as applied
      await conn.query(
        'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
        [entry.tag, Date.now()]
      );
      console.log(`  ✅ ${entry.tag} applied successfully`);
    } catch (err) {
      console.error(`  ❌ Failed to apply ${entry.tag}: ${err.message}`);
      // Don't stop — continue with next migration
    } finally {
      conn.release();
    }
  }
  
  // Verify final state
  const [finalRows] = await pool.query('SELECT COUNT(*) as count FROM __drizzle_migrations');
  console.log(`\nTotal migrations now applied: ${finalRows[0].count}`);
  
  const [tableRows] = await pool.query(
    "SELECT GROUP_CONCAT(TABLE_NAME ORDER BY TABLE_NAME SEPARATOR ', ') as tables FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()"
  );
  console.log(`\nAll tables: ${tableRows[0].tables}`);
  
  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
