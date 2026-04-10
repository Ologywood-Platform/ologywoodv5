import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function check() {
  const a11 = await db.execute(sql`SELECT id, user_id, artist_name, genre, location, bio, profile_photo_url, social_links FROM artist_profiles WHERE id = 11`);
  const a3 = await db.execute(sql`SELECT id, user_id, artist_name, genre, location, bio, profile_photo_url, social_links FROM artist_profiles WHERE id = 3`);
  
  console.log('=== Adonis (11) ===');
  console.log(JSON.stringify(a11.rows?.[0] || a11[0], null, 2));
  console.log('\n=== G.Chizo (3) ===');
  console.log(JSON.stringify(a3.rows?.[0] || a3[0], null, 2));
  
  // Also check if there are releases for artist 11
  const releases11 = await db.execute(sql`SELECT id, title FROM releases WHERE artist_id = 11`);
  console.log('\n=== Adonis releases ===');
  console.log(JSON.stringify(releases11.rows || releases11, null, 2));
  
  const releases3 = await db.execute(sql`SELECT id, title FROM releases WHERE artist_id = 3`);
  console.log('\n=== G.Chizo releases ===');
  console.log(JSON.stringify(releases3.rows || releases3, null, 2));
  
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
