import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const url = new URL(DATABASE_URL);
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false }
  });

  // Get Adonis and G.Chizo profiles
  const [artists] = await conn.execute(
    "SELECT id, userId, artistName, genre, location, profilePhotoUrl FROM artist_profiles WHERE artistName LIKE '%Adonis%' OR artistName LIKE '%Chizo%'"
  );
  console.log('=== Adonis vs G.Chizo ===');
  console.log(JSON.stringify(artists, null, 2));

  // Get all artist IDs and names to check routing
  const [allArtists] = await conn.execute(
    "SELECT id, userId, artistName FROM artist_profiles ORDER BY id"
  );
  console.log('\n=== All Artists (id, userId, name) ===');
  for (const a of allArtists) {
    console.log(`  id=${a.id}, userId=${a.userId}, name=${a.artistName}`);
  }

  await conn.end();
}

main().catch(e => { console.error(e); process.exit(1); });
