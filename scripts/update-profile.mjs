import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
console.log('Connecting to DB...');

const conn = await mysql.createConnection(dbUrl);

const bio = `Multi-platinum recording artist and performer Adonis has been captivating audiences worldwide for over a decade. Known for his genre-defying fusion of R&B, Soul, Hip-Hop, and Rock, Adonis delivers electrifying live performances that leave lasting impressions. With 3 studio albums, 15+ singles, and collaborations with industry heavyweights, he has headlined festivals from Coachella to Essence Fest. His 2025 album "Soul on Fire" debuted at #4 on the Billboard 200. Whether performing an intimate 200-seat jazz club or a 20,000-seat arena, Adonis brings raw energy, flawless vocals, and a world-class touring band that guarantees an unforgettable experience.`;

const genres = JSON.stringify(["R&B", "Soul", "Hip-Hop", "Rock", "Blues"]);
const socialLinks = JSON.stringify({
  instagram: "https://instagram.com/adonis",
  youtube: "https://www.youtube.com/@GChizo",
  spotify: "https://open.spotify.com/artist/adonis",
  twitter: "https://twitter.com/adonis",
  facebook: "https://facebook.com/adonismusic"
});

const [result] = await conn.execute(
  `UPDATE artist_profiles SET 
    genre = ?,
    bio = ?,
    location = ?,
    feeRangeMin = ?,
    feeRangeMax = ?,
    touringPartySize = ?,
    websiteUrl = ?,
    socialLinks = ?
  WHERE userId = ?`,
  [genres, bio, 'Atlanta, GA', 5000, 25000, 8, 'https://www.adonismusic.com', socialLinks, 7]
);

console.log('Update result:', JSON.stringify(result));

// Verify
const [rows] = await conn.execute('SELECT * FROM artist_profiles WHERE userId = 7');
console.log('Updated profile:', JSON.stringify(rows[0], null, 2));

await conn.end();
