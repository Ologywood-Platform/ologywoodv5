/**
 * Seed the inaugural blog post: "Introducing White Label Releases"
 * Run: node server/seed-blog.mjs
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const content = `We're thrilled to announce **White Label Releases** — a brand-new way for artists on Ologywood to sell their music directly to fans, right from their artist profile.

## What Are White Label Releases?

White Label Releases let you upload a single, set your own price (or let fans pay what they want), and sell it directly through your Ologywood profile. No middlemen, no complicated distribution deals, no waiting weeks for approval.

Your fans can discover, preview, and purchase your music in seconds — all without leaving the platform they already use to book you for gigs.

## Why We Built This

We've heard from hundreds of artists that selling music independently is either too expensive or too complicated. Traditional distribution platforms charge between 15% and 30% of every sale. We think that's too much.

**Ologywood charges just 1%.** That means on a $1.00 single, you keep $0.99. On a $10.00 EP, you keep $9.90. It's that simple.

## How It Works

Getting started takes less than five minutes:

1. **Upload your track** — drag and drop your audio file (MP3 or WAV) from your Release Manager
2. **Add artwork** — upload cover art that represents your release
3. **Set your price** — choose a fixed price or enable Pay What You Want (PWYW) with a minimum
4. **Publish** — your release goes live on your profile instantly

Fans can purchase with any major credit or debit card through our secure Stripe-powered checkout. After purchase, they receive an instant download link.

## What's Included by Tier

We've designed White Label Releases to work across all subscription tiers:

- **Free tier** — White Label Releases are not available on the free plan, but you can upgrade anytime
- **Starter ($9.99/mo)** — Upload and sell up to 2 singles per month
- **Professional ($24.99/mo)** — Unlimited releases with Pay What You Want pricing enabled

## Secure, Transparent, and Artist-First

Every transaction is processed through Stripe with full encryption. You can track your sales, revenue, and download counts from your Release Manager dashboard. Payouts are handled through our existing artist payout system — no extra setup required.

## Get Started Today

If you already have an Ologywood artist account, head to your **Release Manager** in the dashboard to upload your first track. If you're new to Ologywood, [create a free account](/get-started) and upgrade to Starter or Professional to start selling.

We can't wait to hear what you release.

---

*Have questions about White Label Releases? Check out our [Sell Your Music](/sell-music) page or reach out to our support team.*`;

const excerpt = 'Sell your singles directly from your Ologywood profile with just a 1% platform fee. Upload, price, and publish in under five minutes.';

async function seed() {
  // Parse DATABASE_URL
  const url = new URL(DATABASE_URL);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || '3306'),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  });

  // Check if post already exists
  const [existing] = await connection.execute(
    'SELECT id FROM blog_posts WHERE slug = ?',
    ['introducing-white-label-releases']
  );

  if (Array.isArray(existing) && existing.length > 0) {
    console.log('Blog post already exists, skipping seed.');
    await connection.end();
    return;
  }

  // Get admin user (authorId)
  const [admins] = await connection.execute(
    "SELECT id, name FROM users WHERE role = 'admin' LIMIT 1"
  );
  const admin = Array.isArray(admins) && admins.length > 0 ? admins[0] : { id: 1, name: 'Ologywood Team' };

  await connection.execute(
    `INSERT INTO blog_posts (slug, title, excerpt, content, coverImageUrl, authorId, authorName, category, tags, status, publishedAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
    [
      'introducing-white-label-releases',
      'Introducing White Label Releases: Sell Your Music for Just 1%',
      excerpt,
      content,
      null,
      admin.id,
      admin.name || 'Ologywood Team',
      'announcement',
      JSON.stringify(['white-label', 'releases', 'music', 'artist', 'feature-launch']),
      'published',
    ]
  );

  console.log('Blog post seeded successfully!');
  await connection.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
