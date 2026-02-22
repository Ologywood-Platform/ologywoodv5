import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

// Mock data for artists
const mockArtists = [
  {
    artistName: 'Luna Echo',
    genre: JSON.stringify(['indie', 'pop']),
    bio: 'Ethereal indie-pop artist known for captivating live performances and emotional storytelling through music.',
    location: 'Los Angeles, CA',
    feeRangeMin: 1500,
    feeRangeMax: 3500,
    touringPartySize: 2,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    websiteUrl: 'https://lunaecho.music',
    socialLinks: JSON.stringify({ instagram: '@lunaecho', spotify: 'lunaecho' }),
  },
  {
    artistName: 'The Jazz Collective',
    genre: JSON.stringify(['jazz', 'blues']),
    bio: 'Award-winning jazz ensemble bringing sophisticated improvisation and soulful melodies to every performance.',
    location: 'New York, NY',
    feeRangeMin: 2000,
    feeRangeMax: 5000,
    touringPartySize: 5,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    websiteUrl: 'https://jazzcolective.com',
    socialLinks: JSON.stringify({ instagram: '@jazzcolective', facebook: 'thejazzcollective' }),
  },
  {
    artistName: 'Electric Pulse',
    genre: JSON.stringify(['electronic', 'edm']),
    bio: 'Electronic music producer and DJ creating high-energy performances with cutting-edge production.',
    location: 'Berlin, Germany',
    feeRangeMin: 1000,
    feeRangeMax: 4000,
    touringPartySize: 1,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    websiteUrl: 'https://electricpulse.music',
    socialLinks: JSON.stringify({ instagram: '@electricpulse', soundcloud: 'electricpulse' }),
  },
  {
    artistName: 'Country Roads',
    genre: JSON.stringify(['country', 'folk']),
    bio: 'Authentic country artist with heartfelt lyrics and traditional instrumentation.',
    location: 'Nashville, TN',
    feeRangeMin: 800,
    feeRangeMax: 2500,
    touringPartySize: 3,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    websiteUrl: 'https://countryroads.music',
    socialLinks: JSON.stringify({ instagram: '@countryroads', youtube: 'countryroads' }),
  },
  {
    artistName: 'Soul Harmony',
    genre: JSON.stringify(['soul', 'r&b']),
    bio: 'Soulful vocalist delivering powerful emotional performances with live band accompaniment.',
    location: 'Atlanta, GA',
    feeRangeMin: 1200,
    feeRangeMax: 3000,
    touringPartySize: 4,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    websiteUrl: 'https://soulharmony.music',
    socialLinks: JSON.stringify({ instagram: '@soulharmony', spotify: 'soulharmony' }),
  },
];

// Mock data for venues
const mockVenues = [
  {
    organizationName: 'The Grand Theater',
    contactName: 'John Smith',
    contactPhone: '+1-555-0101',
    location: 'Downtown Los Angeles',
    city: 'Los Angeles',
    capacity: 500,
    bio: 'Historic theater hosting live music, theater, and cultural events.',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
  },
  {
    organizationName: 'Jazz Club Midnight',
    contactName: 'Sarah Johnson',
    contactPhone: '+1-555-0102',
    location: 'Greenwich Village',
    city: 'New York',
    capacity: 150,
    bio: 'Intimate jazz club featuring local and touring jazz artists.',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
  },
  {
    organizationName: 'Electric Arena',
    contactName: 'Mike Chen',
    contactPhone: '+1-555-0103',
    location: 'Kreuzberg',
    city: 'Berlin',
    capacity: 2000,
    bio: 'Large venue specializing in electronic music and EDM events.',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
  },
];

async function seedDatabase() {
  try {
    // Create connection pool
    const pool = await mysql.createPool({
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const db = drizzle(pool, { schema });

    console.log('🌱 Starting database seed...');

    // Create test users for artists
    console.log('👤 Creating artist users...');
    const artistUsers = [];
    for (let i = 0; i < mockArtists.length; i++) {
      const result = await db.insert(schema.users).values({
        name: mockArtists[i].artistName,
        email: `artist${i + 1}@ologywood.test`,
        role: 'artist',
        emailVerified: true,
        loginMethod: 'oauth',
      });
      artistUsers.push(result);
    }

    // Create artist profiles
    console.log('🎤 Creating artist profiles...');
    for (let i = 0; i < mockArtists.length; i++) {
      await db.insert(schema.artistProfiles).values({
        userId: artistUsers[i][0].insertId,
        ...mockArtists[i],
      });
    }

    // Create test users for venues
    console.log('🏢 Creating venue users...');
    const venueUsers = [];
    for (let i = 0; i < mockVenues.length; i++) {
      const result = await db.insert(schema.users).values({
        name: mockVenues[i].organizationName,
        email: `venue${i + 1}@ologywood.test`,
        role: 'venue',
        emailVerified: true,
        loginMethod: 'oauth',
      });
      venueUsers.push(result);
    }

    // Create venue profiles
    console.log('🎭 Creating venue profiles...');
    for (let i = 0; i < mockVenues.length; i++) {
      await db.insert(schema.venueProfiles).values({
        userId: venueUsers[i][0].insertId,
        ...mockVenues[i],
      });
    }

    console.log('✅ Database seed completed successfully!');
    console.log(`✨ Created ${mockArtists.length} artists and ${mockVenues.length} venues`);

    await pool.end();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedDatabase();
