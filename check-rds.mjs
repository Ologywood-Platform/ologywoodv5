import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'ologywood.ci1gi2qo65oh.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Crewology1',
  database: 'ologywood',
  ssl: false
});

try {
  const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
  const [artists] = await connection.execute('SELECT COUNT(*) as count FROM artist_profiles');
  
  console.log('Current RDS data:');
  console.log(`  Users: ${users[0].count}`);
  console.log(`  Artists: ${artists[0].count}`);
  
  if (artists[0].count > 0) {
    const [artistList] = await connection.execute('SELECT artistName, location FROM artist_profiles');
    console.log('\nArtists in RDS:');
    artistList.forEach(a => console.log(`  - ${a.artistName} (${a.location})`));
  }
} finally {
  await connection.end();
}
