import mysql from 'mysql2/promise';

const config = {
  host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2uXaD1wbYUFqiqF.root',
  password: 'cwRgelpxV28lX0k5',
  database: 'test',
  ssl: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2',
  },
};

const connection = await mysql.createConnection(config);

try {
  const [artists] = await connection.execute('SELECT id, artistName, genres, location, priceMin, priceMax, profilePhotoUrl FROM artistProfiles');
  console.log('Current artists in database:');
  console.table(artists);
  
  const [users] = await connection.execute('SELECT id, email, role FROM users');
  console.log('\nCurrent users in database:');
  console.table(users);
} finally {
  await connection.end();
}
