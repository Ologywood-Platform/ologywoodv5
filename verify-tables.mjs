import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'ologywood.ci1gi2qo65oh.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Crewology1',
  database: 'ologywood',
  ssl: false
});

try {
  const [tables] = await connection.execute('SHOW TABLES');
  console.log(`✓ Found ${tables.length} tables in RDS`);
  
  if (tables.length >= 30) {
    console.log('✓ Schema successfully created in AWS RDS');
  }
  
  console.log('\nTables created:');
  tables.forEach(t => {
    const tableName = Object.values(t)[0];
    console.log(`  - ${tableName}`);
  });
} finally {
  await connection.end();
}
