import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'ologywood.ci1gi2qo65oh.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Crewology1',
  database: 'ologywood',
  ssl: false
});

try {
  const [artists] = await connection.execute(
    'SELECT id, artistName, profilePhotoUrl FROM artist_profiles ORDER BY id'
  );
  
  console.log('Current artist images in RDS:\n');
  artists.forEach(a => {
    console.log(`${a.id}. ${a.artistName}`);
    console.log(`   URL: ${a.profilePhotoUrl}\n`);
  });
} finally {
  await connection.end();
}
