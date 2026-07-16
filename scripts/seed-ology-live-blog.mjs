/**
 * Seed script: Insert the Ology Live announcement blog post
 * Run with: node scripts/seed-ology-live-blog.mjs
 */
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const content = `
## The Future of Fan-Talent Engagement Is Here

We're thrilled to announce **Ology Live** — a virtual experience marketplace built directly into the Ologywood platform. For the first time, artists, athletes, and creators can host paid live sessions and connect with fans in real time, from anywhere in the world.

## What Is Ology Live?

Ology Live lets talent create and sell virtual experiences across 10 categories:

- **Gaming** — Play with fans on Twitch or Discord
- **Music / Listening Party** — Debut new tracks, host listening sessions
- **Fitness / Workout** — Lead training sessions and challenges
- **Q&A / AMA** — Answer fan questions live in an intimate setting
- **Workshop / Tutorial** — Teach skills, share knowledge
- **Photography** — Photo walks, editing sessions, portfolio reviews
- **Film / Content Review** — Break down film, review fan content
- **Creative Session** — Art, design, writing — create together
- **Brand Building** — Coach fans on personal branding and growth
- **Other** — Anything else you can imagine

Talent chooses their platform — Twitch, Discord, Zoom, FaceTime, Google Meet, or YouTube Live — and sets their own price, duration (15–120 minutes), and capacity type (one-on-one, small group, or broadcast).

## How It Works for Fans

1. **Browse** — Discover available sessions by category, talent, and price from the Ology Live page
2. **Book** — Pick a time slot that works for you and confirm your booking
3. **Ask Questions** — Submit up to 5 questions before or during the session for the talent to answer live
4. **Join Live** — A countdown timer tracks your session, and a Join button activates 5 minutes before start time

## How It Works for Talent

1. **Create an Experience** — Choose a category, write a description, set your price and capacity
2. **Add Time Slots** — Schedule when you're available for sessions
3. **Manage Bookings** — See who's booked, review their questions, and share the session link
4. **Earn** — Track your Ology Live earnings separately with charts and analytics in your dashboard

## The Game-Changer: Submit a Question

What makes Ology Live truly special is the **Submit a Question** feature. Fans don't just watch — they participate. Before and during a session, fans can submit up to 5 questions (5–500 characters each). Talent sees all questions in their dashboard and can mark them as answered during the live session.

This creates a structured, interactive Q&A experience that makes every session personal and memorable. No more shouting into a chat. No more missed questions. Every fan feels heard.

## Why This Changes Everything

Traditional fan engagement is one-directional. Fans watch content, maybe leave a comment, and hope for a reply. Ology Live flips that model:

- **Direct access** — Fans interact with talent in real time, not through algorithms
- **Monetizable** — Talent earns on their own terms with flexible pricing
- **Scalable** — From intimate 1-on-1 sessions to broadcast events with unlimited attendees
- **Platform-agnostic** — Use whatever video platform you're already comfortable with
- **Question-driven** — Structured Q&A ensures meaningful interaction, not chaos

## Get Started Today

**Talent:** Head to your Dashboard → Ology Live to create your first experience. Set your price, pick your platform, and start earning from virtual sessions.

**Fans:** Browse Ology Live from the navigation menu to discover sessions from your favorite artists, athletes, and creators. Book a slot, submit your questions, and get ready to connect.

---

*Ology Live is available now for all talent on Ologywood. No additional subscription required — just create, schedule, and earn.*
`;

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);

  // Check if the post already exists
  const [existing] = await connection.execute(
    "SELECT id FROM blog_posts WHERE slug = ?",
    ["introducing-ology-live"]
  );

  if (existing.length > 0) {
    console.log("Blog post already exists, updating...");
    await connection.execute(
      `UPDATE blog_posts SET title = ?, excerpt = ?, content = ?, category = ?, tags = ?, status = ?, publishedAt = NOW(), updatedAt = NOW() WHERE slug = ?`,
      [
        "Introducing Ology Live: Virtual Sessions That Change the Game for Talent Engagement",
        "Ology Live lets artists, athletes, and creators host paid virtual experiences — gaming, Q&A, music listening parties, fitness workouts, and more. Fans book, submit questions, and interact live. The future of fan-talent engagement is here.",
        content.trim(),
        "announcement",
        JSON.stringify(["ology-live", "virtual-sessions", "fan-engagement", "q-and-a", "live-streaming", "talent"]),
        "published",
        "introducing-ology-live",
      ]
    );
    console.log("Blog post updated successfully!");
  } else {
    // Get the owner user ID (first user with a name)
    const [users] = await connection.execute(
      "SELECT id, name FROM users WHERE name IS NOT NULL AND name != '' ORDER BY id ASC LIMIT 1"
    );
    const authorId = users.length > 0 ? users[0].id : 1;
    const authorName = (users.length > 0 && users[0].name) ? users[0].name : "Ologywood Team";

    await connection.execute(
      `INSERT INTO blog_posts (slug, title, excerpt, content, authorId, authorName, category, tags, status, publishedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [
        "introducing-ology-live",
        "Introducing Ology Live: Virtual Sessions That Change the Game for Talent Engagement",
        "Ology Live lets artists, athletes, and creators host paid virtual experiences — gaming, Q&A, music listening parties, fitness workouts, and more. Fans book, submit questions, and interact live. The future of fan-talent engagement is here.",
        content.trim(),
        authorId,
        authorName,
        "announcement",
        JSON.stringify(["ology-live", "virtual-sessions", "fan-engagement", "q-and-a", "live-streaming", "talent"]),
        "published",
      ]
    );
    console.log("Blog post created successfully!");
  }

  await connection.end();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
