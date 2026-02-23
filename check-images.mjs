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
    'SELECT artistName, profilePhotoUrl FROM artist_profiles'
  );
  
  console.log('Artist images in database:\n');
  artists.forEach(a => {
    console.log(`${a.artistName}:`);
    console.log(`  URL: ${a.profilePhotoUrl}`);
    console.log();
  });
} finally {
  await connection.end();
}
