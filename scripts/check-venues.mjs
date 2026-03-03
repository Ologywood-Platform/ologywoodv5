import { db } from '../server/db.js';
import { users, venueProfiles } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  const venues = await db.select().from(users).where(eq(users.role, 'venue'));
  console.log('Venue users:', JSON.stringify(venues, null, 2));

  if (venues.length > 0) {
    for (const v of venues) {
      const profiles = await db.select().from(venueProfiles).where(eq(venueProfiles.userId, v.id));
      console.log('Profile for user', v.id, ':', JSON.stringify(profiles, null, 2));
    }
  } else {
    console.log('No venue accounts found.');
  }
  process.exit(0);
}

main();
