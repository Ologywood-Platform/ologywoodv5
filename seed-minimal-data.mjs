import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import * as schema from './drizzle/schema.js';

dotenv.config();

// Parse DATABASE_URL or use individual env vars
let connectionConfig;
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    connectionConfig = {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port || 3306,
      ssl: url.protocol === 'mysql+ssl:' ? {} : undefined,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
  } catch (e) {
    console.error('Invalid DATABASE_URL format, using individual env vars');
    connectionConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ologywood',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
  }
} else {
  connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ologywood',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

console.log(`📡 Connecting to database at ${connectionConfig.host}:${connectionConfig.port}/${connectionConfig.database}...`);

const pool = mysql.createPool(connectionConfig);
const db = drizzle(pool, { schema });

const mockArtists = [
  {
    artistName: 'Luna Echo',
    genre: ['indie', 'pop'],
    bio: 'Ethereal indie-pop artist known for captivating live performances.',
    location: 'Los Angeles, CA',
    feeRangeMin: 1500,
    feeRangeMax: 3500,
    touringPartySize: 2,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    websiteUrl: 'https://lunaecho.music',
    socialLinks: { instagram: '@lunaecho', spotify: 'luna-echo' }
  },
  {
    artistName: 'The Midnight Collective',
    genre: ['electronic', 'dance'],
    bio: 'High-energy electronic band with cutting-edge production.',
    location: 'New York, NY',
    feeRangeMin: 2000,
    feeRangeMax: 5000,
    touringPartySize: 4,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    websiteUrl: 'https://midnightcollective.live',
    socialLinks: { instagram: '@midnightcollective', twitter: '@MidnightLive' }
  },
  {
    artistName: 'Jazz Legends Quartet',
    genre: ['jazz', 'blues'],
    bio: 'Award-winning jazz quartet with sophisticated improvisation.',
    location: 'New Orleans, LA',
    feeRangeMin: 1200,
    feeRangeMax: 2800,
    touringPartySize: 4,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=400&fit=crop',
    websiteUrl: 'https://jazzlegends.com',
    socialLinks: { instagram: '@jazzlegends', spotify: 'jazz-legends-quartet' }
  },
  {
    artistName: 'Acoustic Soul Sessions',
    genre: ['folk', 'acoustic', 'soul'],
    bio: 'Intimate acoustic performances with original compositions.',
    location: 'Nashville, TN',
    feeRangeMin: 800,
    feeRangeMax: 2000,
    touringPartySize: 1,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
    websiteUrl: 'https://acousticsoul.live',
    socialLinks: { instagram: '@acousticsoul', youtube: '@AcousticSoulSessions' }
  },
  {
    artistName: 'Retro Vibes Band',
    genre: ['funk', 'soul', 'disco'],
    bio: 'Groovy funk and soul band with infectious energy.',
    location: 'Austin, TX',
    feeRangeMin: 1800,
    feeRangeMax: 4000,
    touringPartySize: 5,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop',
    websiteUrl: 'https://retrovibesband.com',
    socialLinks: { instagram: '@retrovibesband', facebook: 'RetroVibeBand' }
  },
  {
    artistName: 'Urban Beats Collective',
    genre: ['hip-hop', 'rap'],
    bio: 'Dynamic hip-hop collective with high-energy performances.',
    location: 'Atlanta, GA',
    feeRangeMin: 1500,
    feeRangeMax: 3500,
    touringPartySize: 3,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    websiteUrl: 'https://urbanbeats.live',
    socialLinks: { instagram: '@urbanbeatscollective', twitter: '@UrbanBeatsLive' }
  }
];

const mockVenues = [
  {
    venueName: 'The Grand Theater',
    capacity: 1500,
    city: 'Los Angeles',
    state: 'CA',
    location: 'Los Angeles, CA',
    venueType: 'Theater',
    bio: 'Historic theater hosting world-class performances.',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
    websiteUrl: 'https://thegrandtheater.com',
    socialLinks: { instagram: '@thegrandtheater', twitter: '@GrandTheater' }
  },
  {
    venueName: 'Brooklyn Music Hall',
    capacity: 800,
    city: 'New York',
    state: 'NY',
    location: 'New York, NY',
    venueType: 'Music Hall',
    bio: 'Intimate music venue in the heart of Brooklyn.',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    websiteUrl: 'https://brooklynmusichall.com',
    socialLinks: { instagram: '@brooklynmusichall', twitter: '@BrooklynMusic' }
  },
  {
    venueName: 'Jazz Club New Orleans',
    capacity: 300,
    city: 'New Orleans',
    state: 'LA',
    location: 'New Orleans, LA',
    venueType: 'Jazz Club',
    bio: 'Legendary jazz club with authentic New Orleans atmosphere.',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=400&fit=crop',
    websiteUrl: 'https://jazzclubneworleans.com',
    socialLinks: { instagram: '@jazzclubno', facebook: 'JazzClubNewOrleans' }
  },
  {
    venueName: 'Nashville Ryman Auditorium',
    capacity: 2300,
    city: 'Nashville',
    state: 'TN',
    location: 'Nashville, TN',
    venueType: 'Auditorium',
    bio: 'Historic auditorium - Mother Church of Country Music.',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
    websiteUrl: 'https://ryman.com',
    socialLinks: { instagram: '@rymanaudi', twitter: '@RymanAuditorium' }
  },
  {
    venueName: 'Austin Live Music Venue',
    capacity: 600,
    city: 'Austin',
    state: 'TX',
    location: 'Austin, TX',
    venueType: 'Live Music Venue',
    bio: 'Premier live music destination in Austin.',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop',
    websiteUrl: 'https://austinlivemusic.com',
    socialLinks: { instagram: '@austinlivemusic', twitter: '@AustinLive' }
  },
  {
    venueName: 'Atlanta State Farm Arena',
    capacity: 20000,
    city: 'Atlanta',
    state: 'GA',
    location: 'Atlanta, GA',
    venueType: 'Arena',
    bio: 'Large-scale arena for major concerts and events.',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    websiteUrl: 'https://statefarmarenatl.com',
    socialLinks: { instagram: '@statefarmarenatl', twitter: '@StateFarmArena' }
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Create test users for artists and venues
    const testUsers = [];
    
    // Create artist users
    for (let i = 0; i < 6; i++) {
      const user = await db.insert(schema.users).values({
        email: `artist${i + 1}@ologywood.test`,
        name: mockArtists[i].artistName,
        role: 'artist',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      testUsers.push({ id: user[0].insertId, role: 'artist' });
    }

    // Create venue users
    for (let i = 0; i < 6; i++) {
      const user = await db.insert(schema.users).values({
        email: `venue${i + 1}@ologywood.test`,
        name: mockVenues[i].venueName,
        role: 'venue',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      testUsers.push({ id: user[0].insertId, role: 'venue' });
    }

    console.log(`✅ Created ${testUsers.length} test users\n`);

    // Create artist profiles
    const artistIds = testUsers.filter(u => u.role === 'artist').map(u => u.id);
    for (let i = 0; i < mockArtists.length; i++) {
      await db.insert(schema.artistProfiles).values({
        userId: artistIds[i],
        ...mockArtists[i],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    console.log(`✅ Created ${mockArtists.length} artist profiles\n`);

    // Create venue profiles
    const venueIds = testUsers.filter(u => u.role === 'venue').map(u => u.id);
    for (let i = 0; i < mockVenues.length; i++) {
      await db.insert(schema.venueProfiles).values({
        userId: venueIds[i],
        ...mockVenues[i],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    console.log(`✅ Created ${mockVenues.length} venue profiles\n`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${mockArtists.length} Artists created`);
    console.log(`   - ${mockVenues.length} Venues created`);
    console.log(`   - ${testUsers.length} Test users created`);
    console.log('\n🔐 Test Credentials:');
    console.log('   Artists: artist1@ologywood.test - artist6@ologywood.test');
    console.log('   Venues: venue1@ologywood.test - venue6@ologywood.test');
    console.log('   Password: (Use OAuth login or set your own)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
