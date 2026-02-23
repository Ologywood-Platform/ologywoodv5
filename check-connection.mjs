import mysql from 'mysql2/promise';

// Try AWS RDS first
console.log('Testing AWS RDS connection...');
try {
  const rdsConnection = await mysql.createConnection({
    host: 'ologywood.ci1gi2qo65oh.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: 'Crewology1',
    database: 'ologywood',
    ssl: false,
    connectTimeout: 3000
  });
  
  const [artists] = await rdsConnection.execute('SELECT COUNT(*) as count FROM artist_profiles');
  console.log(`✓ AWS RDS: ${artists[0].count} artists found`);
  await rdsConnection.end();
} catch (e) {
  console.log(`✗ AWS RDS connection failed: ${e.message}`);
}

// Try TiDB Cloud
console.log('\nTesting TiDB Cloud connection...');
try {
  const tidbConnection = await mysql.createConnection({
    host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '2uXaD1wbYUFqiqF.root',
    password: 'cwRgelpxV28lX0k5',
    database: 'test',
    ssl: { rejectUnauthorized: false },
    connectTimeout: 3000
  });
  
  const [artists] = await tidbConnection.execute('SELECT COUNT(*) as count FROM artist_profiles');
  console.log(`✓ TiDB Cloud: ${artists[0].count} artists found`);
  await tidbConnection.end();
} catch (e) {
  console.log(`✗ TiDB Cloud connection failed: ${e.message}`);
}
