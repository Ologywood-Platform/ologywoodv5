import { db } from '../server/db.js';
import { events } from '../drizzle/schema.js';

async function main() {
  const rows = await db.select().from(events);
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}
main();
