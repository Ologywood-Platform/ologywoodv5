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

const artists = [
  {
    name: 'Luna Moonlight',
    genres: JSON.stringify(['Indie Folk', 'Acoustic']),
    bio: 'Ethereal indie folk artist from Los Angeles with a dreamy, atmospheric sound. Specializes in intimate acoustic performances and emotional storytelling through music.',
    location: 'Los Angeles, CA',
    feeMin: 500,
    feeMax: 1500,
    photoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop',
  },
  {
    name: 'The Velvet Collective',
    genres: JSON.stringify(['Jazz', 'Funk', 'Soul']),
    bio: 'A sophisticated ensemble blending jazz, funk, and soul. Known for smooth grooves, intricate arrangements, and captivating live performances in New York.',
    location: 'New York, NY',
    feeMin: 800,
    feeMax: 2500,
    photoUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=500&h=500&fit=crop',
  },
  {
    name: 'G.Chizo',
    genres: JSON.stringify(['Hip-Hop', 'Rap', 'Electronic']),
    bio: 'Dynamic hip-hop and rap artist from Miami with electronic production influences. Known for high-energy performances and innovative beats.',
    location: 'Miami, FL',
    feeMin: 600,
    feeMax: 1800,
    photoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop',
  },
  {
    name: 'Sofia Strings',
    genres: JSON.stringify(['Classical', 'Contemporary']),
    bio: 'Virtuoso classical musician from Nashville performing contemporary classical pieces. Combines traditional classical training with modern compositions.',
    location: 'Nashville, TN',
    feeMin: 700,
    feeMax: 2000,
    photoUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&h=500&fit=crop',
  },
  {
    name: 'The Rhythm Kings',
    genres: JSON.stringify(['Reggae', 'World Music']),
    bio: 'Vibrant reggae and world music ensemble from Miami. Brings infectious rhythms, positive vibes, and cultural fusion to every performance.',
    location: 'Miami, FL',
    feeMin: 900,
    feeMax: 1800,
    photoUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/AJErdIfRnZIimfZO.jpg',
  },
  {
    name: 'Aurora Electronica',
    genres: JSON.stringify(['Electronic', 'Ambient']),
    bio: 'Electronic and ambient music producer from San Francisco. Creates immersive soundscapes and atmospheric electronic experiences.',
    location: 'San Francisco, CA',
    feeMin: 400,
    feeMax: 1200,
    photoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop',
  },
];

async function seedArtists() {
  const connection = await mysql.createConnection(config);
  
  try {
    console.log('Connecting to TiDB Cloud...');
    console.log('✓ Connected\n');
    
    // Clear existing artists (optional - comment out to keep existing data)
    console.log('Clearing existing artists...');
    await connection.execute('DELETE FROM artist_profiles');
    await connection.execute('DELETE FROM users WHERE role = "artist"');
    console.log('✓ Cleared\n');
    
    console.log('Seeding 6 production artists...\n');
    
    for (const artist of artists) {
      try {
        // Create user account for artist
        const [userResult] = await connection.execute(
          `INSERT INTO users (openId, name, email, loginMethod, role) VALUES (?, ?, ?, ?, ?)`,
          [
            `artist_${artist.name.toLowerCase().replace(/\s+/g, '_')}`,
            artist.name,
            `${artist.name.toLowerCase().replace(/\s+/g, '.')}@ologywood.com`,
            'oauth',
            'artist'
          ]
        );
        
        const userId = userResult.insertId;
        
        // Create artist profile
        await connection.execute(
          `INSERT INTO artist_profiles 
           (userId, artistName, genre, bio, location, feeRangeMin, feeRangeMax, profilePhotoUrl) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            artist.name,
            artist.genres,
            artist.bio,
            artist.location,
            artist.feeMin,
            artist.feeMax,
            artist.photoUrl
          ]
        );
        
        console.log(`✓ ${artist.name}`);
        console.log(`  Location: ${artist.location}`);
        console.log(`  Rate: $${artist.feeMin} - $${artist.feeMax}`);
        console.log(`  Genres: ${JSON.parse(artist.genres).join(', ')}\n`);
      } catch (error) {
        console.error(`✗ Failed to seed ${artist.name}: ${error.message}`);
      }
    }
    
    console.log('✓ Seeding complete!');
    
    // Verify seeding
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM artist_profiles');
    console.log(`\nDatabase now contains ${count[0].total} artists`);
  } finally {
    await connection.end();
  }
}

seedArtists().catch(err => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
