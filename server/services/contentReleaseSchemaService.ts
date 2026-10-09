import { sql } from 'drizzle-orm';

type ContentReleaseSchemaDb = { execute: (...args: any[]) => Promise<any> };
let readyChecks = new WeakMap<ContentReleaseSchemaDb, Promise<void>>();

const DISCLOSURE_COLUMNS = [
  { name: 'aiUseDisclosureEnabled', definition: '`aiUseDisclosureEnabled` boolean DEFAULT false NOT NULL' },
  { name: 'aiUseLevel', definition: '`aiUseLevel` varchar(40)' },
  { name: 'aiUseComponents', definition: '`aiUseComponents` json' },
  { name: 'aiUseTools', definition: '`aiUseTools` varchar(300)' },
  { name: 'aiUseNotes', definition: '`aiUseNotes` varchar(1000)' },
] as const;

/** Restore only schema declared in migrations 0102, 0111, and 0113.
 * No release, purchase, payment, or user row is inserted, updated, or removed.
 * MySQL/TiDB require inspection before ADD COLUMN (no IF NOT EXISTS support).
 */
export function ensureContentReleaseSchema(db: ContentReleaseSchemaDb): Promise<void> {
  const existingCheck = readyChecks.get(db);
  if (existingCheck) return existingCheck;
  const check = (async () => {
    await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS \`releases\` (
      \`id\` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
      \`artistProfileId\` int NOT NULL,
      \`userId\` int NOT NULL,
      \`title\` varchar(255) NOT NULL,
      \`description\` text,
      \`releaseType\` varchar(50) NOT NULL,
      \`genre\` varchar(100),
      \`duration\` varchar(50),
      \`thumbnailUrl\` text,
      \`trailerUrl\` text,
      \`hostingPlatform\` varchar(50) NOT NULL,
      \`contentUrl\` text NOT NULL,
      \`accessModel\` varchar(50) NOT NULL DEFAULT 'free',
      \`price\` decimal(10,2),
      \`minPrice\` decimal(10,2),
      \`premiereDate\` timestamp NULL,
      \`isPublished\` boolean NOT NULL DEFAULT false,
      \`includesLiveQA\` boolean NOT NULL DEFAULT false,
      \`includesBonusContent\` boolean NOT NULL DEFAULT false,
      \`bonusContentDescription\` text,
      \`aiUseDisclosureEnabled\` boolean NOT NULL DEFAULT false,
      \`aiUseLevel\` varchar(40),
      \`aiUseComponents\` json,
      \`aiUseTools\` varchar(300),
      \`aiUseNotes\` varchar(1000),
      \`stripeProductId\` varchar(255),
      \`stripePriceId\` varchar(255),
      \`viewCount\` int NOT NULL DEFAULT 0,
      \`purchaseCount\` int NOT NULL DEFAULT 0,
      \`revenue\` decimal(10,2) DEFAULT '0.00',
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY \`idx_content_releases_artist\` (\`artistProfileId\`),
      KEY \`idx_content_releases_user\` (\`userId\`),
      KEY \`idx_content_releases_type\` (\`releaseType\`),
      KEY \`idx_content_releases_published\` (\`isPublished\`)
    )`));
    await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS \`content_release_purchases\` (
      \`id\` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
      \`releaseId\` int NOT NULL,
      \`userId\` int NOT NULL,
      \`amountPaid\` decimal(10,2) NOT NULL,
      \`stripePaymentIntentId\` varchar(255),
      \`paymentStatus\` varchar(20) NOT NULL DEFAULT 'completed',
      \`accessGrantedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY \`uniq_content_release_purchase\` (\`releaseId\`, \`userId\`),
      KEY \`idx_content_purchases_release\` (\`releaseId\`),
      KEY \`idx_content_purchases_user\` (\`userId\`)
    )`));
    const [receiptRows] = await db.execute('SHOW COLUMNS FROM `content_release_purchases`');
    if(!Array.isArray(receiptRows))throw new Error('Could not inspect Content Release receipt schema');
    if(!receiptRows.some(row=>(row.Field??row.field)==='paymentStatus')){
      try {await db.execute("ALTER TABLE `content_release_purchases` ADD COLUMN `paymentStatus` varchar(20) NOT NULL DEFAULT 'completed'");}
      catch(error:any){if((error?.code??error?.cause?.code)!=='ER_DUP_FIELDNAME')throw error;}
    }
    const [rows] = await db.execute('SHOW COLUMNS FROM `releases`');
    if (!Array.isArray(rows)) throw new Error('Could not inspect Content Release schema');
    const columns = new Set(rows.map(row => String(row.Field ?? row.field)));
    for (const column of DISCLOSURE_COLUMNS) {
      if (columns.has(column.name)) continue;
      try {
        await db.execute(`ALTER TABLE \`releases\` ADD COLUMN ${column.definition}`);
      } catch (error: any) {
        // Another instance can complete the same additive repair concurrently.
        if ((error?.code ?? error?.cause?.code) !== 'ER_DUP_FIELDNAME') throw error;
      }
    }
  })().catch(error => {
    readyChecks.delete(db);
    throw error;
  });
  readyChecks.set(db, check);
  return check;
}

export function resetContentReleaseSchemaForTests() {
  readyChecks = new WeakMap();
}
