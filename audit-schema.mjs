/**
 * Full Schema Audit: Compare Drizzle schema definitions with actual database columns.
 * Outputs a detailed report of mismatches.
 */
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function run() {
  const conn = await mysql.createConnection(DATABASE_URL);

  // Step 1: Get all tables in the database
  const [dbTables] = await conn.execute(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`
  );
  const dbTableNames = dbTables.map(r => r.TABLE_NAME);
  console.log(`\n=== DATABASE TABLES (${dbTableNames.length}) ===`);
  console.log(dbTableNames.join(', '));

  // Step 2: Get all columns for each table from the actual database
  const dbSchema = {};
  for (const table of dbTableNames) {
    const [cols] = await conn.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? 
       ORDER BY ORDINAL_POSITION`,
      [table]
    );
    dbSchema[table] = cols.map(c => ({
      name: c.COLUMN_NAME,
      type: c.DATA_TYPE,
      nullable: c.IS_NULLABLE === 'YES',
      default: c.COLUMN_DEFAULT,
      key: c.COLUMN_KEY,
      extra: c.EXTRA,
    }));
  }

  // Step 3: Parse the Drizzle schema file to extract table definitions
  // We'll read the schema.ts and extract table names and column names
  const fs = await import('fs');
  const schemaContent = fs.readFileSync('/home/ubuntu/ologywood/drizzle/schema.ts', 'utf-8');

  // Find all mysqlTable definitions
  const tableRegex = /export const (\w+) = mysqlTable\("(\w+)",\s*\{/g;
  const drizzleTables = {};
  let match;
  while ((match = tableRegex.exec(schemaContent)) !== null) {
    const varName = match[1];
    const tableName = match[2];
    
    // Find the columns block - from the opening { to the closing }, (table)
    const startIdx = match.index + match[0].length;
    let braceCount = 1;
    let endIdx = startIdx;
    for (let i = startIdx; i < schemaContent.length; i++) {
      if (schemaContent[i] === '{') braceCount++;
      if (schemaContent[i] === '}') braceCount--;
      if (braceCount === 0) {
        endIdx = i;
        break;
      }
    }
    const columnsBlock = schemaContent.substring(startIdx, endIdx);
    
    // Extract column names - look for patterns like: columnName: type("dbColumnName")
    // or columnName: type("dbColumnName", ...)
    const colRegex = /(\w+):\s*(?:int|varchar|text|boolean|timestamp|json|mysqlEnum|bigint|decimal|float|double|tinyint|smallint|mediumint|serial|datetime|date|time|blob|binary|varbinary|char|mediumtext|longtext)\("(\w+)"/g;
    const columns = [];
    let colMatch;
    while ((colMatch = colRegex.exec(columnsBlock)) !== null) {
      columns.push({
        jsName: colMatch[1],
        dbName: colMatch[2],
      });
    }
    
    drizzleTables[tableName] = {
      varName,
      columns,
    };
  }

  console.log(`\n=== DRIZZLE SCHEMA TABLES (${Object.keys(drizzleTables).length}) ===`);
  console.log(Object.keys(drizzleTables).join(', '));

  // Step 4: Compare
  const report = {
    tablesOnlyInDB: [],
    tablesOnlyInSchema: [],
    columnMismatches: [],
  };

  // Tables in DB but not in schema
  for (const table of dbTableNames) {
    if (!drizzleTables[table]) {
      report.tablesOnlyInDB.push(table);
    }
  }

  // Tables in schema but not in DB
  for (const table of Object.keys(drizzleTables)) {
    if (!dbTableNames.includes(table)) {
      report.tablesOnlyInSchema.push(table);
    }
  }

  // Column comparison for matching tables
  for (const [tableName, drizzleInfo] of Object.entries(drizzleTables)) {
    if (!dbSchema[tableName]) continue;

    const dbCols = dbSchema[tableName].map(c => c.name);
    const schemaCols = drizzleInfo.columns.map(c => c.dbName);

    const onlyInDB = dbCols.filter(c => !schemaCols.includes(c));
    const onlyInSchema = schemaCols.filter(c => !dbCols.includes(c));

    if (onlyInDB.length > 0 || onlyInSchema.length > 0) {
      report.columnMismatches.push({
        table: tableName,
        varName: drizzleInfo.varName,
        columnsOnlyInDB: onlyInDB,
        columnsOnlyInSchema: onlyInSchema,
        dbColumns: dbCols,
        schemaColumns: schemaCols,
      });
    }
  }

  // Step 5: Output report
  console.log('\n' + '='.repeat(70));
  console.log('SCHEMA AUDIT REPORT');
  console.log('='.repeat(70));

  if (report.tablesOnlyInDB.length > 0) {
    console.log(`\n⚠️  TABLES ONLY IN DATABASE (${report.tablesOnlyInDB.length}):`);
    report.tablesOnlyInDB.forEach(t => console.log(`   - ${t}`));
  } else {
    console.log('\n✅ No tables only in database');
  }

  if (report.tablesOnlyInSchema.length > 0) {
    console.log(`\n❌ TABLES ONLY IN SCHEMA (not in DB) (${report.tablesOnlyInSchema.length}):`);
    report.tablesOnlyInSchema.forEach(t => console.log(`   - ${t}`));
  } else {
    console.log('✅ No tables only in schema');
  }

  if (report.columnMismatches.length > 0) {
    console.log(`\n❌ COLUMN MISMATCHES (${report.columnMismatches.length} tables):`);
    for (const m of report.columnMismatches) {
      console.log(`\n   TABLE: ${m.table} (${m.varName})`);
      if (m.columnsOnlyInDB.length > 0) {
        console.log(`   ⚠️  Columns in DB but NOT in schema: ${m.columnsOnlyInDB.join(', ')}`);
      }
      if (m.columnsOnlyInSchema.length > 0) {
        console.log(`   ❌ Columns in SCHEMA but NOT in DB: ${m.columnsOnlyInSchema.join(', ')}`);
        console.log(`      (These will cause query failures!)`);
      }
      console.log(`   DB columns:     [${m.dbColumns.join(', ')}]`);
      console.log(`   Schema columns: [${m.schemaColumns.join(', ')}]`);
    }
  } else {
    console.log('\n✅ No column mismatches found');
  }

  console.log('\n' + '='.repeat(70));
  console.log('AUDIT COMPLETE');
  console.log('='.repeat(70));

  // Output JSON for programmatic use
  const jsonPath = '/home/ubuntu/schema_audit_results.json';
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`\nFull report saved to: ${jsonPath}`);

  await conn.end();
}

run().catch(e => {
  console.error('Audit failed:', e.message);
  process.exit(1);
});
