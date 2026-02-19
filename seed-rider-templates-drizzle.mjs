import { drizzle } from 'drizzle-orm/mysql2/driver';
import mysql from 'mysql2/promise';
import { riderTemplates } from './dist/server/db/schema.js';

// Create connection pool
const poolConnection = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = drizzle(poolConnection);

// Sample rider templates for different artist types
const sampleTemplates = [
  {
    artistId: 1,
    templateName: 'Small Venue Rider',
    templateData: JSON.stringify({
      sections: [
        {
          title: 'Technical Requirements',
          items: [
            { label: 'Sound System', value: 'Basic PA system required' },
            { label: 'Microphone', value: '1x vocal mic + 1x backup' },
            { label: 'Lighting', value: 'Basic stage lighting' },
          ],
        },
        {
          title: 'Hospitality',
          items: [
            { label: 'Green Room', value: 'Private space for artist' },
            { label: 'Refreshments', value: 'Water, soft drinks, light snacks' },
            { label: 'Parking', value: 'Free parking for artist vehicle' },
          ],
        },
      ],
    }),
  },
  {
    artistId: 2,
    templateName: 'Medium Venue Rider',
    templateData: JSON.stringify({
      sections: [
        {
          title: 'Technical Requirements',
          items: [
            { label: 'Sound System', value: 'Professional PA system (3000W+)' },
            { label: 'Microphones', value: '2x vocal mics + 2x instrument mics' },
            { label: 'Lighting', value: 'Full stage lighting with color control' },
            { label: 'Stage Setup', value: '20x16 ft minimum stage' },
          ],
        },
        {
          title: 'Hospitality',
          items: [
            { label: 'Green Room', value: 'Comfortable green room with seating' },
            { label: 'Catering', value: 'Hot and cold food options' },
            { label: 'Beverages', value: 'Full bar access for artist' },
            { label: 'Parking', value: 'VIP parking near venue entrance' },
          ],
        },
        {
          title: 'Accommodation',
          items: [
            { label: 'Hotel', value: 'Hotel accommodation if required' },
            { label: 'Transportation', value: 'Ground transportation provided' },
          ],
        },
      ],
    }),
  },
  {
    artistId: 3,
    templateName: 'Large Festival Rider',
    templateData: JSON.stringify({
      sections: [
        {
          title: 'Technical Requirements',
          items: [
            { label: 'Sound System', value: 'Professional festival-grade PA (5000W+)' },
            { label: 'Microphones', value: '4x vocal mics + 6x instrument mics' },
            { label: 'Lighting', value: 'Full production lighting with effects' },
            { label: 'Stage Setup', value: '40x30 ft stage with full production' },
            { label: 'Monitors', value: 'In-ear monitoring system for all band members' },
          ],
        },
        {
          title: 'Hospitality',
          items: [
            { label: 'Green Room', value: 'Luxury green room with full amenities' },
            { label: 'Catering', value: 'Full meal service for band and crew' },
            { label: 'Beverages', value: 'Premium beverages and bar service' },
            { label: 'Parking', value: 'VIP parking with security' },
          ],
        },
        {
          title: 'Accommodation',
          items: [
            { label: 'Hotel', value: '5-star hotel accommodation' },
            { label: 'Transportation', value: 'Private transportation for band and crew' },
            { label: 'Security', value: 'Personal security provided' },
          ],
        },
        {
          title: 'Special Requests',
          items: [
            { label: 'Dressing Room', value: 'Separate dressing rooms for band members' },
            { label: 'Merchandise', value: 'Merchandise sales area provided' },
            { label: 'Press', value: 'Press area and photo pit access' },
          ],
        },
      ],
    }),
  },
];

async function seedRiderTemplates() {
  try {
    console.log('🌱 Starting rider template seeding...');

    for (const template of sampleTemplates) {
      await db.insert(riderTemplates).values({
        artistId: template.artistId,
        templateName: template.templateName,
        templateData: template.templateData,
      });
      console.log(`✅ Created template: ${template.templateName}`);
    }

    console.log('\n✨ Rider templates seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding rider templates:', error);
    process.exit(1);
  } finally {
    await poolConnection.end();
  }
}

seedRiderTemplates();
