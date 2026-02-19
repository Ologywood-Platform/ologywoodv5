import mysql from 'mysql2/promise';

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

// Sample rider templates for different artist types
const sampleTemplates = [
  {
    artistId: 1, // Admin user
    templateName: 'Standard Solo Artist Rider',
    templateData: JSON.stringify({
      baseTemplate: 'standard',
      sections: [
        {
          id: 'sound_system',
          title: 'Sound System Requirements',
          items: [
            { id: 'pa_system', label: 'PA System', value: 'Professional PA system with minimum 2000W output' },
            { id: 'microphone', label: 'Microphone', value: 'Wireless handheld microphone (Shure SM58 or equivalent)' },
            { id: 'monitors', label: 'Monitor Speakers', value: '2 floor monitors with independent mixing' }
          ]
        },
        {
          id: 'lighting',
          title: 'Lighting Requirements',
          items: [
            { id: 'stage_lights', label: 'Stage Lighting', value: 'Basic stage lighting with color wash capability' },
            { id: 'spotlight', label: 'Spotlight', value: 'One spotlight for featured performance' }
          ]
        },
        {
          id: 'hospitality',
          title: 'Hospitality',
          items: [
            { id: 'green_room', label: 'Green Room', value: 'Private green room with seating and refreshments' },
            { id: 'meals', label: 'Meals', value: 'One meal for artist and one guest' }
          ]
        }
      ],
      editableFields: ['pa_system', 'microphone', 'monitors', 'stage_lights', 'spotlight', 'green_room', 'meals'],
      requiredFields: ['pa_system', 'microphone']
    })
  },
  {
    artistId: 2, // First seeded artist
    templateName: 'DJ Performance Rider',
    templateData: JSON.stringify({
      baseTemplate: 'standard',
      sections: [
        {
          id: 'technical',
          title: 'Technical Setup',
          items: [
            { id: 'turntables', label: 'Equipment', value: 'DJ booth with 2 turntables or CDJs' },
            { id: 'mixer', label: 'Mixer', value: 'Professional DJ mixer with effects' },
            { id: 'headphones', label: 'Headphones', value: 'DJ headphones provided' }
          ]
        },
        {
          id: 'sound',
          title: 'Sound System',
          items: [
            { id: 'speakers', label: 'Main Speakers', value: 'Professional main PA system' },
            { id: 'subwoofer', label: 'Subwoofer', value: 'Subwoofer for bass response' }
          ]
        },
        {
          id: 'lighting',
          title: 'Lighting',
          items: [
            { id: 'dancefloor_lights', label: 'Dance Floor Lighting', value: 'Programmable LED dance floor lights' }
          ]
        }
      ],
      editableFields: ['turntables', 'mixer', 'speakers', 'subwoofer', 'dancefloor_lights'],
      requiredFields: ['turntables', 'mixer']
    })
  },
  {
    artistId: 3, // Second seeded artist
    templateName: 'Band Performance Rider',
    templateData: JSON.stringify({
      baseTemplate: 'band',
      sections: [
        {
          id: 'stage',
          title: 'Stage Requirements',
          items: [
            { id: 'stage_size', label: 'Stage Size', value: 'Minimum 20x16 feet stage' },
            { id: 'drum_riser', label: 'Drum Riser', value: '3-foot elevated drum riser' },
            { id: 'stage_monitors', label: 'Stage Monitors', value: '4 independent monitor mixes' }
          ]
        },
        {
          id: 'instruments',
          title: 'Instrument Support',
          items: [
            { id: 'drum_kit', label: 'Drum Kit', value: 'Provided by venue or artist brings own' },
            { id: 'bass_amp', label: 'Bass Amplifier', value: 'Minimum 300W bass amplifier' },
            { id: 'guitar_amps', label: 'Guitar Amplifiers', value: '2x 100W guitar amplifiers' }
          ]
        },
        {
          id: 'hospitality',
          title: 'Hospitality',
          items: [
            { id: 'green_room', label: 'Green Room', value: 'Large green room for 5+ people' },
            { id: 'meals', label: 'Meals', value: 'Meals for all band members' },
            { id: 'drinks', label: 'Beverages', value: 'Complimentary beverages throughout event' }
          ]
        }
      ],
      editableFields: ['stage_size', 'drum_riser', 'stage_monitors', 'drum_kit', 'bass_amp', 'guitar_amps', 'green_room', 'meals', 'drinks'],
      requiredFields: ['stage_size', 'stage_monitors']
    })
  },
  {
    artistId: 4, // Third seeded artist
    templateName: 'Minimal Technical Rider',
    templateData: JSON.stringify({
      baseTemplate: 'minimal',
      sections: [
        {
          id: 'basic',
          title: 'Basic Requirements',
          items: [
            { id: 'microphone', label: 'Microphone', value: 'One wireless microphone' },
            { id: 'speaker', label: 'Speaker System', value: 'Basic venue PA system' }
          ]
        }
      ],
      editableFields: ['microphone', 'speaker'],
      requiredFields: ['microphone']
    })
  }
];

console.log('🌱 Seeding sample rider templates...');

for (const template of sampleTemplates) {
  try {
    const query = `
      INSERT INTO rider_templates (artistId, templateName, templateData, createdAt, updatedAt)
      VALUES (?, ?, ?, NOW(), NOW())
    `;
    
    const [result] = await db.execute(query, [
      template.artistId,
      template.templateName,
      template.templateData
    ]);
    
    console.log(`✅ Added: "${template.templateName}" for artist ${template.artistId}`);
  } catch (error) {
    console.error(`❌ Error adding template: ${error.message}`);
  }
}

console.log('\n✨ Sample rider templates seeded successfully!');
await db.end();
