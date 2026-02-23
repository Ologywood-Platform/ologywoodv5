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

async function cleanAndMigrate() {
  const connection = await mysql.createConnection(config);
  
  try {
    console.log('✓ Connected to TiDB Cloud\n');
    
    // Step 1: Drop all tables
    console.log('Step 1: Dropping all existing tables...');
    try {
      const [tables] = await connection.execute(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
        [config.database]
      );
      
      // Disable foreign key checks
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
      
      for (const table of tables) {
        try {
          await connection.execute(`DROP TABLE IF EXISTS \`${table.TABLE_NAME}\``);
          console.log(`  ✓ Dropped ${table.TABLE_NAME}`);
        } catch (error) {
          console.log(`  ⊘ ${table.TABLE_NAME} (already dropped)`);
        }
      }
      
      // Re-enable foreign key checks
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      console.log(`\n✓ All tables dropped\n`);
    } catch (error) {
      console.error('Error dropping tables:', error.message);
      throw error;
    }
    
    // Step 2: Run migrations
    console.log('Step 2: Running migrations...\n');
    const migrationsDir = path.join(__dirname, 'drizzle');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${files.length} migration files\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      let sql = fs.readFileSync(filePath, 'utf-8');
      
      // Clean up Drizzle comments and markers
      sql = sql
        .replace(/^--> statement-breakpoint\n/gm, '')
        .replace(/^--> statement-breakpoint$/gm, '')
        .trim();
      
      try {
        // Split by semicolon but keep track of statements
        const statements = [];
        let current = '';
        let inString = false;
        let stringChar = '';
        
        for (let i = 0; i < sql.length; i++) {
          const char = sql[i];
          const prevChar = i > 0 ? sql[i - 1] : '';
          
          // Track if we're inside a string
          if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
            if (!inString) {
              inString = true;
              stringChar = char;
            } else if (char === stringChar) {
              inString = false;
            }
          }
          
          // If we hit a semicolon outside a string, it's a statement separator
          if (char === ';' && !inString) {
            current += char;
            if (current.trim()) {
              statements.push(current.trim());
            }
            current = '';
          } else {
            current += char;
          }
        }
        
        // Add any remaining statement
        if (current.trim()) {
          statements.push(current.trim());
        }
        
        // Execute each statement
        for (const statement of statements) {
          if (statement && !statement.startsWith('--')) {
            await connection.execute(statement);
          }
        }
        
        console.log(`✓ ${file}`);
        successCount++;
      } catch (error) {
        console.error(`✗ ${file}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n✓ Migration completed!`);
    console.log(`  Applied: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n✓ All migrations completed successfully!');
    } else {
      console.log(`\n⚠ ${errorCount} migrations failed. Review errors above.`);
    }
  } finally {
    await connection.end();
  }
}

cleanAndMigrate().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
