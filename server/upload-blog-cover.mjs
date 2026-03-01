/**
 * Upload the branded cover image to S3 and update the White Label Releases blog post
 * Run: node server/upload-blog-cover.mjs
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const DATABASE_URL = process.env.DATABASE_URL;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

if (!DATABASE_URL || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error('Missing required env vars: DATABASE_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
  process.exit(1);
}

// Read the generated cover image
const imagePath = path.resolve('/home/ubuntu/ologywood-blog-cover.png');
const imageBuffer = fs.readFileSync(imagePath);
const mimeType = 'image/png';

async function upload() {
  // Upload to S3
  const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  const timestamp = Date.now();
  const fileKey = `blog-covers/white-label-releases-${timestamp}.png`;
  // Determine bucket from env or use default pattern
  const bucketName = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || 'manus-storage';

  // Try using the storagePut approach from the app
  // First, let's check what storage module exports
  try {
    // Direct S3 upload
    const { storagePut } = await import('./storage.js');
    const { url } = await storagePut(fileKey, imageBuffer, mimeType);
    console.log('Uploaded to S3:', url);

    // Update database
    const dbUrl = new URL(DATABASE_URL);
    const connection = await mysql.createConnection({
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port || '3306'),
      user: dbUrl.username,
      password: dbUrl.password,
      database: dbUrl.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
    });

    await connection.execute(
      'UPDATE blog_posts SET coverImageUrl = ? WHERE slug = ?',
      [url, 'introducing-white-label-releases']
    );

    console.log('Blog post updated with cover image!');
    await connection.end();
  } catch (err) {
    console.error('storagePut import failed, trying direct DB update with CDN URL...');
    
    // Use the CDN URL from the generate_image output
    const cdnUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663275372790/mP6FLm6cHUyVdEMNViNuZS/ologywood-blog-cover-WKmHSvFiZ8GZznq9LdukyC.png';
    
    const dbUrl = new URL(DATABASE_URL);
    const connection = await mysql.createConnection({
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port || '3306'),
      user: dbUrl.username,
      password: dbUrl.password,
      database: dbUrl.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
    });

    await connection.execute(
      'UPDATE blog_posts SET coverImageUrl = ? WHERE slug = ?',
      [cdnUrl, 'introducing-white-label-releases']
    );

    console.log('Blog post updated with CDN cover image URL:', cdnUrl);
    await connection.end();
  }
}

upload().catch((err) => {
  console.error('Upload failed:', err);
  process.exit(1);
});
