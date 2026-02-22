import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
  user: '2uXaD1wbYUFqiqF.root',
  password: 'cwRgelpxV28lX0k5',
  database: 'test',
  ssl: {},
});

// Seed 6 Production Venues
const venues = [
  {
    userId: 201,
    venueName: 'The Grand Ballroom',
    bio: 'Elegant 500-person capacity venue perfect for weddings and galas',
    location: 'Chicago, IL',
    capacity: 500,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1519167758481-83f19106048c?w=400',
  },
  {
    userId: 202,
    venueName: 'Blue Note Jazz Club',
    bio: 'Intimate 200-seat jazz venue with world-class acoustics',
    location: 'New York, NY',
    capacity: 200,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
  },
  {
    userId: 203,
    venueName: 'Sunset Amphitheater',
    bio: 'Outdoor venue with 1000+ capacity, perfect for festivals and large concerts',
    location: 'Los Angeles, CA',
    capacity: 1200,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  },
  {
    userId: 204,
    venueName: 'The Riverside Pavilion',
    bio: 'Scenic riverside venue with 300 capacity, ideal for intimate celebrations',
    location: 'Austin, TX',
    capacity: 300,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1519167758481-83f19106048c?w=400',
  },
  {
    userId: 205,
    venueName: 'Downtown Theater',
    bio: 'Historic 800-seat theater with full technical support for performances',
    location: 'Boston, MA',
    capacity: 800,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
  },
  {
    userId: 206,
    venueName: 'Beachside Resort',
    bio: 'Luxury beachfront venue with 600 capacity and premium amenities',
    location: 'Miami, FL',
    capacity: 600,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400',
  },
];

for (const venue of venues) {
  try {
    await connection.execute(
      `INSERT INTO venue_profiles (userId, venueName, bio, location, capacity, profilePhotoUrl, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [venue.userId, venue.venueName, venue.bio, venue.location, venue.capacity, venue.profilePhotoUrl]
    );
    console.log(`✅ Seeded: ${venue.venueName}`);
  } catch (error) {
    console.error(`❌ Error seeding ${venue.venueName}:`, error.message);
  }
}

console.log('\n✅ Venue seeding complete!');

await connection.end();
