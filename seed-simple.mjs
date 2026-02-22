import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
  user: '2uXaD1wbYUFqiqF.root',
  password: 'cwRgelpxV28lX0k5',
  database: 'test',
  ssl: {},
});

// Clear existing test data
await connection.execute('DELETE FROM artist_profiles WHERE artistName LIKE "Test Artist%"');

// Seed 6 Production Artists
const artists = [
  {
    userId: 101,
    artistName: 'Luna Moonlight',
    bio: 'Ethereal vocalist with a passion for indie folk and acoustic performances',
    genre: JSON.stringify(['Indie Folk', 'Acoustic', 'Singer-Songwriter']),
    location: 'Nashville, TN',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    feeRangeMin: 400,
    feeRangeMax: 800,
  },
  {
    userId: 102,
    artistName: 'The Velvet Collective',
    bio: 'High-energy jazz fusion band perfect for corporate events and weddings',
    genre: JSON.stringify(['Jazz', 'Funk', 'Soul']),
    location: 'New York, NY',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
    feeRangeMin: 1200,
    feeRangeMax: 2000,
  },
  {
    userId: 103,
    artistName: 'G.Chizo',
    bio: 'Award-winning hip-hop producer and performer with international experience',
    genre: JSON.stringify(['Hip-Hop', 'Rap', 'Electronic']),
    location: 'Los Angeles, CA',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    feeRangeMin: 1500,
    feeRangeMax: 3000,
  },
  {
    userId: 104,
    artistName: 'Sofia Strings',
    bio: 'Classical violinist and composer specializing in contemporary arrangements',
    genre: JSON.stringify(['Classical', 'Contemporary', 'Chamber Music']),
    location: 'Boston, MA',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400',
    feeRangeMin: 600,
    feeRangeMax: 1200,
  },
  {
    userId: 105,
    artistName: 'The Rhythm Kings',
    bio: 'Energetic reggae and world music ensemble bringing Caribbean vibes',
    genre: JSON.stringify(['Reggae', 'World Music', 'Caribbean']),
    location: 'Miami, FL',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400',
    feeRangeMin: 900,
    feeRangeMax: 1800,
  },
  {
    userId: 106,
    artistName: 'Aurora Electronica',
    bio: 'Electronic music producer and DJ specializing in ambient and downtempo sets',
    genre: JSON.stringify(['Electronic', 'Ambient', 'Downtempo']),
    location: 'Portland, OR',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
    feeRangeMin: 700,
    feeRangeMax: 1400,
  },
];

for (const artist of artists) {
  try {
    await connection.execute(
      `INSERT INTO artist_profiles (userId, artistName, bio, genre, location, profilePhotoUrl, feeRangeMin, feeRangeMax, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [artist.userId, artist.artistName, artist.bio, artist.genre, artist.location, artist.profilePhotoUrl, artist.feeRangeMin, artist.feeRangeMax]
    );
    console.log(`✅ Seeded: ${artist.artistName}`);
  } catch (error) {
    console.error(`❌ Error seeding ${artist.artistName}:`, error.message);
  }
}

console.log('\n✅ Artist seeding complete!');

await connection.end();
