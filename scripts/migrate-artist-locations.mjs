/**
 * Migration script: Parse existing artist freeform location data into structured city/state fields.
 * Run with: node scripts/migrate-artist-locations.mjs
 */
import mysql from 'mysql2/promise';

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

function parseLocation(location) {
  if (!location) return { city: null, state: null };
  
  // Normalize: trim, remove extra spaces
  const loc = location.trim();
  
  // Try "City, State" or "City State" patterns
  // Split by comma first
  const commaParts = loc.split(',').map(p => p.trim());
  
  if (commaParts.length >= 2) {
    const city = commaParts[0];
    const stateStr = commaParts[1];
    const state = matchState(stateStr);
    if (state) return { city, state };
  }
  
  // Try splitting by space and checking last word(s) for state
  const words = loc.split(/\s+/);
  
  // Check if last word is a state code (2 letters)
  if (words.length >= 2) {
    const lastWord = words[words.length - 1];
    const state = matchState(lastWord);
    if (state) {
      const city = words.slice(0, -1).join(' ');
      return { city, state };
    }
    
    // Check last two words for full state name
    if (words.length >= 3) {
      const lastTwo = words.slice(-2).join(' ');
      const state2 = matchState(lastTwo);
      if (state2) {
        const city = words.slice(0, -2).join(' ');
        return { city, state: state2 };
      }
    }
  }
  
  // If only one word, check if it's a state
  const singleState = matchState(loc);
  if (singleState) return { city: null, state: singleState };
  
  // If only one word and not a state, treat as city
  if (words.length === 1) return { city: loc, state: null };
  
  // Fallback: treat entire string as city
  return { city: loc, state: null };
}

function matchState(str) {
  if (!str) return null;
  const s = str.trim().toUpperCase();
  
  // Exact match on code
  const byCode = US_STATES.find(st => st.code === s);
  if (byCode) return byCode.code;
  
  // Match on full name (case-insensitive)
  const byName = US_STATES.find(st => st.name.toUpperCase() === s);
  if (byName) return byName.code;
  
  // Common abbreviations
  const abbrevMap = {
    'CALI': 'CA', 'CALIF': 'CA', 'FLA': 'FL', 'PENN': 'PA',
    'MASS': 'MA', 'MICH': 'MI', 'MINN': 'MN', 'MISS': 'MS',
    'TENN': 'TN', 'WASH': 'WA', 'WISC': 'WI', 'CONN': 'CT',
  };
  if (abbrevMap[s]) return abbrevMap[s];
  
  return null;
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  
  const connection = await mysql.createConnection(dbUrl);
  
  // Get all artists with a location
  const [rows] = await connection.execute(
    'SELECT id, location FROM artist_profiles WHERE location IS NOT NULL AND location != ""'
  );
  
  console.log(`Found ${rows.length} artists to migrate`);
  
  let migrated = 0;
  let skipped = 0;
  
  for (const row of rows) {
    const { city, state } = parseLocation(row.location);
    
    if (city || state) {
      await connection.execute(
        'UPDATE artist_profiles SET city = ?, state = ?, country = ? WHERE id = ?',
        [city, state, 'US', row.id]
      );
      migrated++;
      console.log(`  [${row.id}] "${row.location}" → city="${city}", state="${state}"`);
    } else {
      skipped++;
      console.log(`  [${row.id}] "${row.location}" → SKIPPED (could not parse)`);
    }
  }
  
  console.log(`\nDone: ${migrated} migrated, ${skipped} skipped`);
  await connection.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
