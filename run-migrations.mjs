import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

// Parse connection string
const url = new URL(`mysql://${connectionString.replace('mysql://', '')}`);
const config = {
  host: url.hostname,
  port: parseInt(url.port || '3306'),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2',
  },
};

console.log(`Connecting to ${config.host}:${config.port}/${config.database}...`);

async function runMigrations() {
  const connection = await mysql.createConnection(config);
  
  try {
    console.log('✓ Connected to TiDB Cloud');
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname, 'drizzle');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${files.length} migration files\n`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      try {
        // Split by semicolon to handle multiple statements
        const statements = sql.split(';').filter(s => s.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            await connection.execute(statement);
          }
        }
        
        console.log(`✓ ${file}`);
        successCount++;
      } catch (error) {
        // Ignore "already exists" and "duplicate column" errors
        if (
          error.code === 'ER_TABLE_EXISTS_ERROR' || 
          error.code === 'ER_DUP_FIELDNAME' ||
          error.message.includes('already exists') ||
          error.message.includes('Duplicate column')
        ) {
          console.log(`⊘ ${file} (skipped - already applied)`);
          skipCount++;
        } else {
          console.error(`✗ ${file}: ${error.message}`);
          errorCount++;
          // Continue with next migration instead of failing
        }
      }
    }
    
    console.log(`\n✓ Migrations completed!`);
    console.log(`  Applied: ${successCount}`);
    console.log(`  Skipped: ${skipCount}`);
    console.log(`  Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n✓ All migrations completed successfully!');
    }
  } finally {
    await connection.end();
  }
}

runMigrations().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
