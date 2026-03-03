import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { events } from '../drizzle/schema.ts';
import { eq, and, sql } from 'drizzle-orm';

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  // Raw query first
  const [rawRows] = await connection.execute('SELECT id, eventTitle, isPublic FROM events');
  console.log('Raw SQL results:', JSON.stringify(rawRows, null, 2));

  // Drizzle query without filter
  const allEvents = await db.select().from(events);
  console.log('\nDrizzle all events count:', allEvents.length);
  if (allEvents.length > 0) {
    console.log('First event isPublic:', allEvents[0].isPublic, typeof allEvents[0].isPublic);
  }

  // Drizzle query with isPublic filter
  const publicEvents = await db.select().from(events).where(eq(events.isPublic, true));
  console.log('\nDrizzle public events count:', publicEvents.length);

  await connection.end();
  process.exit(0);
}

main().catch(console.error);
