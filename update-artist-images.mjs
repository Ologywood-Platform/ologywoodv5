import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'ologywood.ci1gi2qo65oh.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Crewology1',
  database: 'ologywood',
  ssl: false
});

const artistImages = [
  {
    id: 1,
    name: 'Luna Moonlight',
    url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop'
  },
  {
    id: 2,
    name: 'The Velvet Collective',
    url: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=500&h=500&fit=crop'
  },
  {
    id: 3,
    name: 'G.Chizo',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop'
  },
  {
    id: 4,
    name: 'Sofia Strings',
    url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&h=500&fit=crop'
  },
  {
    id: 5,
    name: 'The Rhythm Kings',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop'
  },
  {
    id: 6,
    name: 'Aurora Electronica',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop'
  }
];

try {
  for (const artist of artistImages) {
    await connection.execute(
      'UPDATE artist_profiles SET profilePhotoUrl = ? WHERE id = ?',
      [artist.url, artist.id]
    );
    console.log(`✓ Updated ${artist.name}`);
  }
  console.log('\n✓ All artist images updated');
} catch (error) {
  console.error('Error updating images:', error.message);
} finally {
  await connection.end();
}
