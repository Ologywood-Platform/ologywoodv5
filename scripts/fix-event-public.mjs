import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { events } from '../drizzle/schema.ts';
import { eq } from 'drizzle-orm';

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  // Check before
  const [before] = await connection.execute('SELECT id, isPublic FROM events WHERE id = 1');
  console.log('Before:', JSON.stringify(before));

  // Update using drizzle (this will use the correct boolean mapping)
  await db.update(events).set({ isPublic: true }).where(eq(events.id, 1));

  // Check after
  const [after] = await connection.execute('SELECT id, isPublic FROM events WHERE id = 1');
  console.log('After:', JSON.stringify(after));

  // Verify drizzle can find it
  const publicEvents = await db.select().from(events).where(eq(events.isPublic, true));
  console.log('Public events count:', publicEvents.length);
  if (publicEvents.length > 0) {
    console.log('First public event:', publicEvents[0].eventTitle);
  }

  await connection.end();
  process.exit(0);
}

main().catch(console.error);
