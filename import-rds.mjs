import mysql from 'mysql2/promise';
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('tidb-export.json', 'utf-8'));

const rdsConnection = await mysql.createConnection({
  host: 'ologywood.ci1gi2qo65oh.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Crewology1',
  database: 'ologywood',
  ssl: false
});

try {
  console.log('Importing data to RDS...');
  
  // Import users
  for (const user of data.users) {
    await rdsConnection.execute(
      'INSERT INTO users (id, openId, name, email, loginMethod, role, createdAt, updatedAt, lastSignedIn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [user.id, user.openId, user.name, user.email, user.loginMethod, user.role, user.createdAt, user.updatedAt, user.lastSignedIn]
    );
  }
  console.log(`✓ Imported ${data.users.length} users`);
  
  // Import artists
  for (const artist of data.artists) {
    await rdsConnection.execute(
      'INSERT INTO artist_profiles (id, userId, artistName, genre, bio, location, feeRangeMin, feeRangeMax, touringPartySize, profilePhotoUrl, mediaGallery, websiteUrl, socialLinks, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [artist.id, artist.userId, artist.artistName, artist.genre, artist.bio, artist.location, artist.feeRangeMin, artist.feeRangeMax, artist.touringPartySize, artist.profilePhotoUrl, artist.mediaGallery, artist.websiteUrl, artist.socialLinks, artist.createdAt, artist.updatedAt]
    );
  }
  console.log(`✓ Imported ${data.artists.length} artists`);
  
  console.log('\n✓ All data imported successfully to AWS RDS');
} catch (error) {
  console.error('✗ Import failed:', error.message);
  process.exit(1);
} finally {
  await rdsConnection.end();
}
