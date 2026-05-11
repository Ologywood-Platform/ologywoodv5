/**
 * Insert the touring feature blog post into the database
 */

const blogContent = `
## The Problem Every Indie Artist Knows Too Well

You've got a show on Friday. You're confirming details with the venue in one app, updating your availability calendar in another, sending your rider requirements via email, selling tickets through a third-party platform, and trying to keep your fans in the loop through social media.

That's five different tools for one gig. Now multiply that across a tour.

Indie artists have been forced to stitch together a patchwork of platforms just to do what should be simple: perform live and get paid. The booking app doesn't talk to the ticketing platform. The contract lives in a PDF somewhere in your inbox. Your fans have no idea you're coming to their city.

**We built Ologywood to end that.**

## More Than a Booking Platform

When we launched Ologywood, we started with the core: a place where artists and venues could find each other, send booking requests, and handle the business side of live music. But we always knew that was just the beginning.

Today, Ologywood is an **artist's true hub** — the one place where your entire live music career connects.

Here's what that means:

### Touring That Actually Works

Our new touring feature lets you set your availability, mark the cities you're visiting, and instantly become visible to every venue in those areas. No more cold emails. No more "do you know anyone who books shows in Austin?"

When you turn on touring, venues see your **"On Tour" badge** and can book you directly. You set your terms. You keep control. No agents taking 20% off the top.

### White Label Releases — Your Music, Your Way

We launched [White Label Releases](/blog/introducing-white-label-releases) so artists can sell singles directly from their Ologywood profile. Just a 1% platform fee. Upload, price, and publish in under five minutes.

This isn't a streaming platform where you earn fractions of a penny. This is direct-to-fan sales. Your music. Your price. Your revenue.

Combined with touring, it means fans who discover you at a show can buy your music right from the same profile they found you on. One ecosystem. No friction.

### Riders & Contracts Without the Headache

Every artist knows the pain: you get booked, then spend days going back and forth about technical requirements, sound specs, hospitality needs, and payment terms.

On Ologywood, your rider is built into your profile. When a venue books you, they already know what you need. Contracts are generated automatically with e-signatures built in. No PDFs. No printing. No "I'll send that over next week."

### Ticketing That's Actually Fair

Sell tickets directly to your fans with transparent pricing. No hidden fees that make a $20 ticket cost $35. QR code check-in, promo codes, and ticket transfers are all built in.

Your fans pay what you set. You see exactly what you earn. That's it.

### Your Fan Base, Connected

When fans follow you on Ologywood, they get notified when you're touring near them, when you drop new music, and when you have upcoming shows. You can message your followers directly.

This isn't an algorithm deciding who sees your posts. This is a direct line to the people who care about your music.

## The Future of Independent Music

The music industry has spent decades building systems that work for labels, promoters, and platforms — not for artists. We're building the opposite.

Ologywood is where:
- **Artists** own their career — bookings, music, fans, and revenue in one place
- **Venues** find incredible talent without middlemen inflating costs
- **Fans** discover artists, buy tickets, and support musicians directly

We're not trying to be everything to everyone. We're building the one platform that indie artists actually need — so you can stop managing tools and start making music.

## Get Started

If you're an artist juggling multiple platforms to manage your live career, [create your profile](/get-started) and see what it feels like when everything just works together.

If you're a venue looking for touring artists in your area, [browse artists](/browse) and filter by touring availability.

**The future of independent music is here. And it's built for you.**
`;

// Insert via direct SQL since we need to bypass tRPC auth
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  const slug = 'more-than-booking-your-all-in-one-touring-hub';
  const title = 'More Than Booking: Why Ologywood Is Your All-in-One Touring Hub';
  const excerpt = 'Indie artists use 3-4 different tools to plan tours. Ologywood brings booking, touring, contracts, ticketing, music sales, and fan engagement into one platform — so you can focus on performing, not admin.';
  const category = 'announcement';
  const tags = JSON.stringify(['touring', 'artist-hub', 'booking', 'white-label', 'ticketing', 'fan-engagement', 'feature-launch']);
  const status = 'published';
  const authorName = 'Ologywood Team';
  const authorId = 7; // Owner/admin user
  const publishedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Check if post already exists
  const [existing] = await connection.execute(
    'SELECT id FROM blog_posts WHERE slug = ?',
    [slug]
  );
  
  if (existing.length > 0) {
    console.log('Blog post already exists, updating...');
    await connection.execute(
      `UPDATE blog_posts SET title = ?, excerpt = ?, content = ?, category = ?, tags = ?, status = ?, authorName = ?, publishedAt = ?, updatedAt = NOW() WHERE slug = ?`,
      [title, excerpt, blogContent.trim(), category, tags, status, authorName, publishedAt, slug]
    );
    console.log('Blog post updated successfully!');
  } else {
    await connection.execute(
      `INSERT INTO blog_posts (slug, title, excerpt, content, category, tags, status, authorId, authorName, publishedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [slug, title, excerpt, blogContent.trim(), category, tags, status, authorId, authorName, publishedAt]
    );
    console.log('Blog post inserted successfully!');
  }

  await connection.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
