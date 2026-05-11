/**
 * Update the touring blog post cover image URL
 */
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  const coverUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663275372790/mP6FLm6cHUyVdEMNViNuZS/blog-cover-touring-Dd3jDduqEBnPe32nQ5uzsm.webp';
  const slug = 'more-than-booking-your-all-in-one-touring-hub';

  const [result] = await connection.execute(
    'UPDATE blog_posts SET coverImageUrl = ? WHERE slug = ?',
    [coverUrl, slug]
  );
  
  console.log('Update result:', result);
  
  // Verify
  const [rows] = await connection.execute(
    'SELECT id, slug, coverImageUrl FROM blog_posts WHERE slug = ?',
    [slug]
  );
  console.log('Verified:', rows);

  await connection.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
