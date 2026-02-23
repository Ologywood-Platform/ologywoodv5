import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'ologywood.ci1gi2qo65oh.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Crewology1',
  database: 'ologywood',
  ssl: false
});

try {
  // Check total artists
  const [total] = await connection.execute('SELECT COUNT(*) as count FROM artist_profiles');
  console.log(`Total artists in RDS: ${total[0].count}`);
  
  // Get all artist details
  const [artists] = await connection.execute(
    'SELECT id, userId, artistName, genre, location, feeRangeMin, feeRangeMax FROM artist_profiles'
  );
  
  console.log('\nArtist details:');
  artists.forEach(a => {
    console.log(`  ID: ${a.id}, User: ${a.userId}, Name: ${a.artistName}, Genre: ${a.genre}, Location: ${a.location}, Fee: $${a.feeRangeMin}-$${a.feeRangeMax}`);
  });
  
  // Check if any artists have NULL values
  const [nullCheck] = await connection.execute(
    'SELECT id, artistName FROM artist_profiles WHERE artistName IS NULL OR genre IS NULL OR location IS NULL'
  );
  
  if (nullCheck.length > 0) {
    console.log('\n⚠ Artists with NULL values:');
    nullCheck.forEach(a => console.log(`  - ${a.id}: ${a.artistName}`));
  } else {
    console.log('\n✓ All artists have complete data');
  }
  
} finally {
  await connection.end();
}
