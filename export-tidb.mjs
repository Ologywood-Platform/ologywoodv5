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
