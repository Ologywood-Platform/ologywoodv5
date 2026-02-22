import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Parse DATABASE_URL or use individual env vars
let connectionConfig;
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  connectionConfig = {
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    port: url.port || 3306,
    ssl: {},
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
} else {
  connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ologywood',
    ssl: process.env.DB_HOST?.includes('tidbcloud') ? {} : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

console.log(`📡 Connecting to database at ${connectionConfig.host}...`);
const pool = mysql.createPool(connectionConfig);

// 6 Sample Artists
const mockArtists = [
  {
    artistName: 'Luna Echo',
    genre: JSON.stringify(['indie', 'pop']),
    bio: 'Ethereal indie-pop artist known for captivating live performances.',
    location: 'Los Angeles, CA',
    feeRangeMin: 1500,
    feeRangeMax: 3500,
    touringPartySize: 2,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    websiteUrl: 'https://lunaecho.music',
    socialLinks: JSON.stringify({ instagram: '@lunaecho', twitter: '@lunaecho' }),
  },
  {
    artistName: 'The Jazz Collective',
    genre: JSON.stringify(['jazz', 'soul']),
    bio: 'Contemporary jazz ensemble bringing smooth vibes to every venue.',
    location: 'New York, NY',
    feeRangeMin: 2000,
    feeRangeMax: 5000,
    touringPartySize: 5,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    websiteUrl: 'https://jazzcolective.com',
    socialLinks: JSON.stringify({ instagram: '@jazzcolective', spotify: 'jazzcolective' }),
  },
  {
    artistName: 'Electric Dreams',
    genre: JSON.stringify(['electronic', 'dance']),
    bio: 'High-energy electronic music producer and live performer.',
    location: 'Miami, FL',
    feeRangeMin: 2500,
    feeRangeMax: 6000,
    touringPartySize: 3,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=400&fit=crop',
    websiteUrl: 'https://electricdreams.dj',
    socialLinks: JSON.stringify({ instagram: '@electricdreams', soundcloud: 'electricdreams' }),
  },
  {
    artistName: 'Country Roads',
    genre: JSON.stringify(['country', 'folk']),
    bio: 'Authentic country music with heartfelt storytelling.',
    location: 'Nashville, TN',
    feeRangeMin: 1200,
    feeRangeMax: 3000,
    touringPartySize: 2,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
    websiteUrl: 'https://countryroads.band',
    socialLinks: JSON.stringify({ instagram: '@countryroads', youtube: 'countryroads' }),
  },
  {
    artistName: 'Soul Harmony',
    genre: JSON.stringify(['r&b', 'soul']),
    bio: 'Smooth R&B vocals with live band accompaniment.',
    location: 'Atlanta, GA',
    feeRangeMin: 1800,
    feeRangeMax: 4500,
    touringPartySize: 4,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
    websiteUrl: 'https://soulharmony.com',
    socialLinks: JSON.stringify({ instagram: '@soulharmony', tiktok: '@soulharmony' }),
  },
  {
    artistName: 'Rock Legends',
    genre: JSON.stringify(['rock', 'alternative']),
    bio: 'Classic rock covers and original compositions.',
    location: 'Austin, TX',
    feeRangeMin: 1500,
    feeRangeMax: 4000,
    touringPartySize: 4,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=400&fit=crop',
    websiteUrl: 'https://rocklegends.band',
    socialLinks: JSON.stringify({ instagram: '@rocklegends', youtube: 'rocklegends' }),
  },
];

// 6 Sample Venues
const mockVenues = [
  {
    venueName: 'The Grand Ballroom',
    location: 'Los Angeles, CA',
    capacity: 500,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1519671482677-e6e0c3b5971d?w=400&h=400&fit=crop',
    description: 'Elegant venue perfect for concerts and events.',
    websiteUrl: 'https://grandbballroom.com',
    city: 'Los Angeles',
  },
  {
    venueName: 'Brooklyn Music Hall',
    location: 'New York, NY',
    capacity: 300,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
    description: 'Intimate venue with excellent acoustics.',
    websiteUrl: 'https://brooklynmusichall.com',
    city: 'New York',
  },
  {
    venueName: 'Miami Beach Club',
    location: 'Miami, FL',
    capacity: 800,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
    description: 'Beachfront venue with state-of-the-art sound system.',
    websiteUrl: 'https://miamibeachclub.com',
    city: 'Miami',
  },
  {
    venueName: 'Nashville Honky Tonk',
    location: 'Nashville, TN',
    capacity: 400,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    description: 'Classic honky tonk with live music every night.',
    websiteUrl: 'https://nashvillehonkytonk.com',
    city: 'Nashville',
  },
  {
    venueName: 'Atlanta Event Center',
    location: 'Atlanta, GA',
    capacity: 1000,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=400&fit=crop',
    description: 'Large multipurpose event space.',
    websiteUrl: 'https://atlantaeventcenter.com',
    city: 'Atlanta',
  },
  {
    venueName: 'Austin Live Stage',
    location: 'Austin, TX',
    capacity: 600,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    description: 'Premier live music venue in downtown Austin.',
    websiteUrl: 'https://austinlivestage.com',
    city: 'Austin',
  },
];

async function seedDatabase() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🌱 Starting database seed...\n');

    // Clear existing data
    console.log('🗑️  Clearing existing artists and venues...');
    await connection.execute('DELETE FROM artistProfiles');
    await connection.execute('DELETE FROM venueProfiles');
    await connection.execute('DELETE FROM users WHERE role IN ("artist", "venue")');

    // Insert Artists
    console.log('👨‍🎤 Inserting 6 sample artists...');
    for (const artist of mockArtists) {
      // Create user account for artist
      const userId = `artist_${artist.artistName.toLowerCase().replace(/\s+/g, '_')}`;
      const openId = `openid_${Math.random().toString(36).substr(2, 9)}`;
      
      await connection.execute(
        'INSERT IGNORE INTO users (openId, email, role, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())',
        [openId, `${userId}@ologywood.com`, 'artist']
      );

      // Get the user ID
      const [userResult] = await connection.execute(
        'SELECT id FROM users WHERE openId = ?',
        [openId]
      );

      if (userResult.length > 0) {
        const userId = userResult[0].id;
        
        // Insert artist profile
        await connection.execute(
          `INSERT INTO artistProfiles (
            userId, artistName, genre, bio, location, feeRangeMin, feeRangeMax,
            touringPartySize, profilePhotoUrl, websiteUrl, socialLinks, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            userId,
            artist.artistName,
            artist.genre,
            artist.bio,
            artist.location,
            artist.feeRangeMin,
            artist.feeRangeMax,
            artist.touringPartySize,
            artist.profilePhotoUrl,
            artist.websiteUrl,
            artist.socialLinks,
          ]
        );
        console.log(`  ✓ ${artist.artistName}`);
      }
    }

    // Insert Venues
    console.log('\n🏛️  Inserting 6 sample venues...');
    for (const venue of mockVenues) {
      // Create user account for venue
      const userId = `venue_${venue.venueName.toLowerCase().replace(/\s+/g, '_')}`;
      const openId = `openid_${Math.random().toString(36).substr(2, 9)}`;
      
      await connection.execute(
        'INSERT IGNORE INTO users (openId, email, role, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())',
        [openId, `${userId}@ologywood.com`, 'venue']
      );

      // Get the user ID
      const [userResult] = await connection.execute(
        'SELECT id FROM users WHERE openId = ?',
        [openId]
      );

      if (userResult.length > 0) {
        const userId = userResult[0].id;
        
        // Insert venue profile
        await connection.execute(
          `INSERT INTO venueProfiles (
            userId, venueName, location, capacity, profilePhotoUrl, description,
            websiteUrl, city, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            userId,
            venue.venueName,
            venue.location,
            venue.capacity,
            venue.profilePhotoUrl,
            venue.description,
            venue.websiteUrl,
            venue.city,
          ]
        );
        console.log(`  ✓ ${venue.venueName}`);
      }
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('📊 Summary:');
    console.log('   - 6 Artists created');
    console.log('   - 6 Venues created');
    console.log('   - Ready for testing all endpoints');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

seedDatabase().catch(console.error);
