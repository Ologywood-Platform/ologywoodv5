import mysql from 'mysql2/promise';

const blogContent = `
## Atlanta's DIY Scene Deserves Better Infrastructure

Atlanta has always been a city that breeds musical talent. From the legendary venues like 529 and The Earl to the countless house shows and pop-up events happening every weekend, the DIY scene here is alive and thriving. But there's a problem — the infrastructure hasn't kept up.

### The Gap Between Talent and Opportunity

Independent artists in Atlanta are doing incredible work. They're writing, recording, performing, and building audiences from the ground up. But when it comes to actually booking gigs, managing their calendar, and getting paid fairly — they're stuck using group chats, DMs, and handshake deals.

Venues face the same challenge in reverse. They need to fill their calendar with quality acts, but discovering local talent and managing bookings is a manual, time-consuming process.

### Free Booking Tools for Indie Venues & Artists

That's why we built Ologywood — to give Atlanta's independent music community the professional tools they deserve, without the professional price tag.

**For Artists:**
- Create a professional profile showcasing your music, videos, and availability
- Set your booking rates and rider requirements upfront
- Manage your calendar and avoid double-bookings
- Get discovered by venues actively looking for talent
- Track your earnings and get paid directly through Stripe

**For Venues:**
- Browse and filter local artists by genre, availability, and price range
- Send booking requests with all the details in one place
- Manage your event calendar and lineup
- Handle contracts and payments through the platform
- Build relationships with artists for repeat bookings

### Why Free?

Because we believe the DIY scene shouldn't have to pay for basic infrastructure. The tools that help artists get booked and venues fill their stages should be accessible to everyone — from the band playing their first show at a house party to the venue owner juggling 20 acts a month.

Ologywood's free tier gives you everything you need to book and get booked. No hidden fees. No trial periods. Just the tools you need to keep the music going.

### Built in Atlanta, For Atlanta (and Beyond)

We started here because we know this scene. We've been to the shows, we've seen the talent, and we've felt the frustration of a system that wasn't built for independent artists and venues.

But this isn't just an Atlanta story. Every city has a DIY scene that deserves better. We're starting here, and we're growing from here.

### Get Started Today

Whether you're an artist looking for your next gig or a venue looking for your next act — [sign up for free](/get-started) and join the community that's building better infrastructure for independent music.

---

*The DIY scene doesn't need permission. It just needs better tools.*
`.trim();

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  const slug = 'atlantas-diy-scene-deserves-better-infrastructure';
  const title = "Atlanta's DIY Scene Deserves Better Infrastructure";
  const excerpt = "Independent artists and venues in Atlanta deserve professional booking tools without the professional price tag. Free booking infrastructure for the DIY music community.";
  const coverImageUrl = '/manus-storage/instagram_post_6dbdbf46.png';
  const authorId = 7;
  const authorName = 'Ologywood';
  const category = 'announcement';
  const tags = JSON.stringify(['atlanta', 'diy', 'venues', 'booking', 'indie']);
  const status = 'published';
  const publishedAt = '2026-02-24 12:00:00';
  
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
