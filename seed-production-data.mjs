import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Parse DATABASE_URL or use individual env vars
let connectionConfig;
if (process.env.DATABASE_URL) {
  // Parse MySQL connection URL: mysql://user:password@host:port/database
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

const mockArtists = [
  {
    artistName: 'Luna Echo',
    genre: ['indie', 'pop'],
    bio: 'Ethereal indie-pop artist known for captivating live performances and emotional storytelling through music.',
    location: 'Los Angeles, CA',
    feeRangeMin: 1500,
    feeRangeMax: 3500,
    touringPartySize: 2,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    websiteUrl: 'https://lunaecho.music',
    socialLinks: {
      instagram: '@lunaecho',
      spotify: 'luna-echo',
      youtube: '@LunaEchoMusic'
    }
  },
  {
    artistName: 'The Midnight Collective',
    genre: ['electronic', 'dance'],
    bio: 'High-energy electronic band that brings cutting-edge production and infectious beats to every venue.',
    location: 'New York, NY',
    feeRangeMin: 2000,
    feeRangeMax: 5000,
    touringPartySize: 4,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    websiteUrl: 'https://midnightcollective.live',
    socialLinks: {
      instagram: '@midnightcollective',
      twitter: '@MidnightLive',
      youtube: '@MidnightCollective'
    }
  },
  {
    artistName: 'Jazz Legends Quartet',
    genre: ['jazz', 'blues'],
    bio: 'Award-winning jazz quartet delivering sophisticated improvisation and timeless standards with modern flair.',
    location: 'New Orleans, LA',
    feeRangeMin: 1200,
    feeRangeMax: 2800,
    touringPartySize: 4,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=400&fit=crop',
    websiteUrl: 'https://jazzlegends.com',
    socialLinks: {
      instagram: '@jazzlegends',
      spotify: 'jazz-legends-quartet'
    }
  },
  {
    artistName: 'Acoustic Soul Sessions',
    genre: ['folk', 'acoustic', 'soul'],
    bio: 'Intimate acoustic performances featuring original compositions and soulful covers that connect with audiences.',
    location: 'Nashville, TN',
    feeRangeMin: 800,
    feeRangeMax: 2000,
    touringPartySize: 1,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
    websiteUrl: 'https://acousticsoul.live',
    socialLinks: {
      instagram: '@acousticsoul',
      youtube: '@AcousticSoulSessions'
    }
  },
  {
    artistName: 'Retro Vibes Band',
    genre: ['funk', 'soul', 'disco'],
    bio: 'Groovy funk and soul band bringing the best of 70s and 80s music to modern audiences with infectious energy.',
    location: 'Austin, TX',
    feeRangeMin: 1800,
    feeRangeMax: 4000,
    touringPartySize: 5,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop',
    websiteUrl: 'https://retrovibesband.com',
    socialLinks: {
      instagram: '@retrovibesband',
      facebook: 'RetroVibeBand'
    }
  },
  {
    artistName: 'Classical Strings Ensemble',
    genre: ['classical', 'chamber'],
    bio: 'Professional chamber ensemble specializing in classical and contemporary string arrangements for events.',
    location: 'Boston, MA',
    feeRangeMin: 2500,
    feeRangeMax: 6000,
    touringPartySize: 6,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop',
    websiteUrl: 'https://classicalstrings.org',
    socialLinks: {
      instagram: '@classicalstrings',
      youtube: '@ClassicalStringsEnsemble'
    }
  },
  {
    artistName: 'Urban Beats Collective',
    genre: ['hip-hop', 'rap'],
    bio: 'Dynamic hip-hop collective known for high-energy performances and engaging crowd interaction.',
    location: 'Atlanta, GA',
    feeRangeMin: 1500,
    feeRangeMax: 3500,
    touringPartySize: 3,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    websiteUrl: 'https://urbanbeats.live',
    socialLinks: {
      instagram: '@urbanbeatscollective',
      twitter: '@UrbanBeatsLive',
      spotify: 'urban-beats-collective'
    }
  },
  {
    artistName: 'Indie Folk Duo',
    genre: ['indie', 'folk'],
    bio: 'Intimate two-person acoustic folk act with beautiful harmonies and heartfelt original songs.',
    location: 'Portland, OR',
    feeRangeMin: 600,
    feeRangeMax: 1500,
    touringPartySize: 2,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
    websiteUrl: 'https://indiefolkduo.com',
    socialLinks: {
      instagram: '@indiefolkduo',
      youtube: '@IndieFolkDuo'
    }
  },
  {
    artistName: 'Reggae Vibes',
    genre: ['reggae', 'world'],
    bio: 'Feel-good reggae band bringing positive vibes and island rhythms to venues across the country.',
    location: 'Miami, FL',
    feeRangeMin: 1200,
    feeRangeMax: 2500,
    touringPartySize: 4,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop',
    websiteUrl: 'https://reggaevibes.live',
    socialLinks: {
      instagram: '@reggaevibes',
      facebook: 'ReggaeVibesOfficial'
    }
  },
  {
    artistName: 'Synth Wave Collective',
    genre: ['electronic', 'synthwave'],
    bio: 'Retro-futuristic electronic music collective creating immersive synth-driven soundscapes.',
    location: 'Los Angeles, CA',
    feeRangeMin: 1800,
    feeRangeMax: 4000,
    touringPartySize: 2,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    websiteUrl: 'https://synthwavecollective.com',
    socialLinks: {
      instagram: '@synthwavecollective',
      twitter: '@SynthwaveMusic'
    }
  },
  {
    artistName: 'Gospel Voices',
    genre: ['gospel', 'soul'],
    bio: 'Uplifting gospel choir bringing joy and spiritual music to audiences of all backgrounds.',
    location: 'Chicago, IL',
    feeRangeMin: 1000,
    feeRangeMax: 2500,
    touringPartySize: 8,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=400&fit=crop',
    websiteUrl: 'https://gospelvoices.org',
    socialLinks: {
      instagram: '@gospelvoices',
      youtube: '@GospelVoicesChoir'
    }
  },
  {
    artistName: 'Rock Revival',
    genre: ['rock', 'alternative'],
    bio: 'Powerful rock band channeling classic rock energy with modern production and original material.',
    location: 'Seattle, WA',
    feeRangeMin: 1500,
    feeRangeMax: 3500,
    touringPartySize: 4,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop',
    websiteUrl: 'https://rockrevival.live',
    socialLinks: {
      instagram: '@rockrevivalband',
      twitter: '@RockRevivalLive'
    }
  },
  {
    artistName: 'Latin Rhythms Orchestra',
    genre: ['latin', 'salsa'],
    bio: 'Full orchestra bringing authentic Latin rhythms and high-energy dance music to every event.',
    location: 'Miami, FL',
    feeRangeMin: 2500,
    feeRangeMax: 5500,
    touringPartySize: 10,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    websiteUrl: 'https://latinrhythms.live',
    socialLinks: {
      instagram: '@latinrhythmsorch',
      facebook: 'LatinRhythmsOrchestra'
    }
  },
  {
    artistName: 'Country Storytellers',
    genre: ['country', 'americana'],
    bio: 'Authentic country band telling stories through music with genuine acoustic instrumentation.',
    location: 'Nashville, TN',
    feeRangeMin: 1200,
    feeRangeMax: 3000,
    touringPartySize: 4,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
    websiteUrl: 'https://countrystorytellers.com',
    socialLinks: {
      instagram: '@countrystorytellers',
      youtube: '@CountryStorytellersOfficial'
    }
  },
  {
    artistName: 'DJ Pulse',
    genre: ['electronic', 'dance'],
    bio: 'Professional DJ with extensive music library and experience reading crowds to create perfect atmosphere.',
    location: 'Las Vegas, NV',
    feeRangeMin: 1000,
    feeRangeMax: 3000,
    touringPartySize: 1,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    websiteUrl: 'https://djpulse.live',
    socialLinks: {
      instagram: '@djpulseofficial',
      twitter: '@DJPulseLive'
    }
  }
];

const mockVenues = [
  {
    organizationName: 'The Velvet Lounge',
    contactName: 'Sarah Mitchell',
    contactPhone: '(213) 555-0101',
    location: 'Los Angeles, CA',
    bio: 'Intimate upscale lounge featuring live music, craft cocktails, and sophisticated ambiance for discerning guests.'
  },
  {
    organizationName: 'Grand Ballroom Events',
    contactName: 'Michael Chen',
    contactPhone: '(212) 555-0102',
    location: 'New York, NY',
    bio: 'Premium event venue hosting corporate galas, weddings, and large-scale productions with state-of-the-art facilities.'
  },
  {
    organizationName: 'Jazz Club Heritage',
    contactName: 'Antoine Dubois',
    contactPhone: '(504) 555-0103',
    location: 'New Orleans, LA',
    bio: 'Historic jazz venue celebrating musical tradition with nightly performances and authentic New Orleans atmosphere.'
  },
  {
    organizationName: 'Riverside Music Hall',
    contactName: 'Emily Rodriguez',
    contactPhone: '(615) 555-0104',
    location: 'Nashville, TN',
    bio: 'Mid-size concert venue hosting diverse musical acts with excellent acoustics and welcoming community vibe.'
  },
  {
    organizationName: 'The Warehouse',
    contactName: 'James Taylor',
    contactPhone: '(512) 555-0105',
    location: 'Austin, TX',
    bio: 'Industrial-chic event space perfect for concerts, festivals, and large gatherings with flexible configurations.'
  },
  {
    organizationName: 'Symphony Hall Boston',
    contactName: 'Dr. Patricia Moore',
    contactPhone: '(617) 555-0106',
    location: 'Boston, MA',
    bio: 'World-class concert hall hosting classical performances, orchestras, and prestigious musical events.'
  },
  {
    organizationName: 'Urban Lofts Atlanta',
    contactName: 'DeShawn Williams',
    contactPhone: '(404) 555-0107',
    location: 'Atlanta, GA',
    bio: 'Contemporary loft space ideal for intimate performances, private events, and emerging artist showcases.'
  },
  {
    organizationName: 'The Garden Amphitheater',
    contactName: 'Lisa Anderson',
    contactPhone: '(503) 555-0108',
    location: 'Portland, OR',
    bio: 'Outdoor amphitheater surrounded by nature, perfect for summer concerts and community gatherings.'
  },
  {
    organizationName: 'Beachside Resort & Spa',
    contactName: 'Carlos Hernandez',
    contactPhone: '(305) 555-0109',
    location: 'Miami, FL',
    bio: 'Luxury resort venue offering oceanfront settings for weddings, corporate events, and destination celebrations.'
  },
  {
    organizationName: 'The Neon Room',
    contactName: 'Alex Kim',
    contactPhone: '(206) 555-0110',
    location: 'Seattle, WA',
    bio: 'Trendy nightclub featuring electronic music, cutting-edge sound system, and vibrant nightlife atmosphere.'
  },
  {
    organizationName: 'Sunset Terrace Weddings',
    contactName: 'Jennifer Lopez',
    contactPhone: '(702) 555-0111',
    location: 'Las Vegas, NV',
    bio: 'Elegant wedding venue with stunning views, customizable packages, and professional event coordination.'
  },
  {
    organizationName: 'Downtown Concert Series',
    contactName: 'Robert Thompson',
    contactPhone: '(303) 555-0112',
    location: 'Denver, CO',
    bio: 'Community-focused venue hosting diverse musical performances and supporting local artists.'
  },
  {
    organizationName: 'The Emerald Theater',
    contactName: 'Victoria Sterling',
    contactPhone: '(415) 555-0113',
    location: 'San Francisco, CA',
    bio: 'Historic theater with ornate architecture hosting concerts, theater productions, and cultural events.'
  },
  {
    organizationName: 'Lakeside Pavilion',
    contactName: 'David Johnson',
    contactPhone: '(206) 555-0114',
    location: 'Seattle, WA',
    bio: 'Scenic outdoor venue perfect for summer festivals, weddings, and community celebrations.'
  },
  {
    organizationName: 'The Crimson Room',
    contactName: 'Amanda White',
    contactPhone: '(617) 555-0115',
    location: 'Boston, MA',
    bio: 'Intimate performance space ideal for acoustic sets, poetry readings, and experimental music.'
  }
];

async function seedDatabase() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🌱 Starting database seeding...\n');

    // Create mock users and artists
    console.log('📝 Creating mock artists...');
    const artistIds = [];
    for (let i = 0; i < mockArtists.length; i++) {
      const artist = mockArtists[i];
      // Create user for artist
      const openId = `seed-artist-${i}-${Date.now()}`;
      const userResult = await connection.query(
        `INSERT INTO users (openId, name, email, role, emailVerified, loginMethod) 
         VALUES (?, ?, ?, 'artist', true, 'seed')`,
        [openId, artist.artistName, `${artist.artistName.toLowerCase().replace(/\s+/g, '.')}@ologywood.com`]
      );
      const userId = userResult[0].insertId;

      // Create artist profile
      const profileResult = await connection.query(
        `INSERT INTO artist_profiles 
         (userId, artistName, genre, bio, location, feeRangeMin, feeRangeMax, touringPartySize, profilePhotoUrl, websiteUrl, socialLinks) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          artist.artistName,
          JSON.stringify(artist.genre),
          artist.bio,
          artist.location,
          artist.feeRangeMin,
          artist.feeRangeMax,
          artist.touringPartySize,
          artist.profilePhotoUrl,
          artist.websiteUrl,
          JSON.stringify(artist.socialLinks)
        ]
      );
      artistIds.push(userId);
      console.log(`  ✓ ${artist.artistName}`);
    }

    // Create mock users and venues
    console.log('\n🏢 Creating mock venues...');
    const venueIds = [];
    for (let i = 0; i < mockVenues.length; i++) {
      const venue = mockVenues[i];
      // Create user for venue
      const openId = `seed-venue-${i}-${Date.now()}`;
      const userResult = await connection.query(
        `INSERT INTO users (openId, name, email, role, emailVerified, loginMethod) 
         VALUES (?, ?, ?, 'venue', true, 'seed')`,
        [openId, venue.organizationName, `${venue.organizationName.toLowerCase().replace(/\s+/g, '.')}@ologywood.com`]
      );
      const userId = userResult[0].insertId;

      // Create venue profile
      const profileResult = await connection.query(
        `INSERT INTO venue_profiles 
         (userId, organizationName, contactName, contactPhone, location, bio, isListed) 
         VALUES (?, ?, ?, ?, ?, ?, true)`,
        [
          userId,
          venue.organizationName,
          venue.contactName,
          venue.contactPhone,
          venue.location,
          venue.bio
        ]
      );
      venueIds.push(userId);
      console.log(`  ✓ ${venue.organizationName}`);
    }

    // Create sample events for artists
    console.log('\n🎪 Creating sample events...');
    const eventTypes = ['wedding', 'corporate', 'festival', 'bar_gig', 'private_party', 'concert', 'other'];
    const audienceTypes = ['corporate', 'wedding', 'general_public', 'private'];
    
    for (let i = 0; i < artistIds.length; i++) {
      const artistId = artistIds[i];
      const eventCount = Math.floor(Math.random() * 3) + 1; // 1-3 events per artist
      
      for (let j = 0; j < eventCount; j++) {
        const daysFromNow = Math.floor(Math.random() * 180) + 7; // 7-187 days from now
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() + daysFromNow);
        
        const eventHour = Math.floor(Math.random() * 12) + 18; // 6 PM - 6 AM
        const eventTime = `${String(eventHour).padStart(2, '0')}:00`;
        const eventEndTime = `${String((eventHour + 2) % 24).padStart(2, '0')}:00`;
        
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const rate = Math.floor(Math.random() * 4000) + 500; // $500-$4500
        
        await connection.query(
          `INSERT INTO events 
           (artistId, eventTitle, eventType, eventDate, eventTime, eventEndTime, location, capacity, audienceType, rate, description, isPublic, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, 'available')`,
          [
            artistId,
            `${mockArtists[i].artistName} - ${eventType.replace(/_/g, ' ')}`,
            eventType,
            eventDate.toISOString().split('T')[0],
            eventTime,
            eventEndTime,
            mockArtists[i].location,
            Math.floor(Math.random() * 500) + 50, // 50-550 capacity
            audienceTypes[Math.floor(Math.random() * audienceTypes.length)],
            rate,
            `Live performance by ${mockArtists[i].artistName}. ${mockArtists[i].bio}`,
          ]
        );
      }
      console.log(`  ✓ Created ${eventCount} event(s) for ${mockArtists[i].artistName}`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`  • ${mockArtists.length} artists created`);
    console.log(`  • ${mockVenues.length} venues created`);
    console.log(`  • Sample events created for all artists`);
    console.log('\n🚀 The landing page should now display featured artists and events!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await connection.release();
    await pool.end();
  }
}

seedDatabase();
