import mysql from 'mysql2/promise';

const blogContent = `
## Sell Your Music Directly to Fans — Keep 99%

We're excited to introduce **White Label Releases** on Ologywood — a simple, powerful way for artists to sell their singles and EPs directly from their profile page.

No middlemen. No complicated distribution. Just upload, price, and publish.

### How It Works

1. **Upload your track** — Go to your Artist Dashboard → Releases → Add New Release
2. **Set your price** — Choose any price point that works for you
3. **Publish** — Your release goes live on your profile immediately
4. **Get paid** — When fans purchase, money goes directly to your connected Stripe account

### Why White Label?

We call it "White Label" because it's YOUR release, YOUR brand, YOUR audience. Ologywood simply provides the storefront and handles the transaction. We take just a **1% platform fee** — you keep 99% of every sale.

Compare that to other platforms:
- Streaming services: fractions of a penny per play
- Traditional distributors: 15-30% cut
- **Ologywood White Label: just 1%**

### What You Can Sell

- Singles
- EPs
- Exclusive tracks
- Live recordings
- Remixes
- Unreleased demos

### Getting Started

If you already have an Ologywood artist profile:

1. Connect your Stripe account on the **Earnings & Payouts** page (takes about 2 minutes)
2. Navigate to **Releases** in your dashboard
3. Click **Add New Release**
4. Upload your audio file, add cover art, set your price
5. Hit **Publish**

That's it. Your fans can now purchase directly from your profile, and the money flows straight to your bank account on your schedule.

### Built for Independent Artists

White Label Releases is designed for artists who want to maintain full control over their music and revenue. Whether you're dropping a surprise single, selling exclusive content to your most dedicated fans, or testing new material before a wider release — this is your space.

No gatekeepers. No algorithms deciding your worth. Just you and your audience.

---

*Ready to sell your first release? Head to your [Artist Dashboard](/dashboard) and get started today.*
`.trim();

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  const slug = 'introducing-white-label-releases';
  const title = 'Introducing White Label Releases: Sell Your Music. Keep 99%.';
  const excerpt = 'Upload your singles and EPs directly to your Ologywood profile. Set your price, publish instantly, and keep 99% of every sale with just a 1% platform fee.';
  const coverImageUrl = '/manus-storage/ologywood-blog-cover-G7KR6h39ZWChUo8rSZNsfC_9a0878e9.webp';
  const authorId = 7;
  const authorName = 'Ologywood';
  const category = 'announcement';
  const tags = JSON.stringify(['releases', 'music', 'earnings', 'white-label']);
  const status = 'published';
  const publishedAt = '2026-02-28 12:00:00';
  
  // Check if it already exists
  const [existing] = await conn.execute('SELECT id FROM blog_posts WHERE slug = ?', [slug]);
  
  if (existing.length > 0) {
    console.log('Blog post already exists, updating...');
    await conn.execute(
      `UPDATE blog_posts SET title = ?, excerpt = ?, content = ?, coverImageUrl = ?, category = ?, tags = ?, status = ?, authorId = ?, authorName = ?, publishedAt = ?, updatedAt = NOW() WHERE slug = ?`,
      [title, excerpt, blogContent, coverImageUrl, category, tags, status, authorId, authorName, publishedAt, slug]
    );
    console.log('Blog post updated!');
  } else {
    await conn.execute(
      `INSERT INTO blog_posts (slug, title, excerpt, content, coverImageUrl, category, tags, status, authorId, authorName, publishedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [slug, title, excerpt, blogContent, coverImageUrl, category, tags, status, authorId, authorName, publishedAt]
    );
    console.log('Blog post inserted successfully!');
  }
  
  // Verify
  const [posts] = await conn.execute('SELECT id, title, slug, status FROM blog_posts ORDER BY id');
  console.log('\nAll blog posts:', JSON.stringify(posts, null, 2));
  
  await conn.end();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
