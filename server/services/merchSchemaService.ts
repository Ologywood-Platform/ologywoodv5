import { sql } from 'drizzle-orm';

type MerchSchemaDb = {
  execute: (...args: any[]) => Promise<any>;
};

const HYBRID_MERCH_COLUMNS = [
  { name: 'sellingMethod', definition: "enum('ologywood','external') DEFAULT 'external' NOT NULL" },
  { name: 'priceInCents', definition: 'int NULL' },
  // TiDB rejects expression defaults when adding JSON columns. The create
  // procedure always writes an explicit [] value, so a nullable repair column
  // is compatible with both legacy rows and all new records.
  { name: 'variants', definition: 'json NULL' },
  { name: 'trackInventory', definition: 'boolean DEFAULT false NOT NULL' },
  { name: 'inventoryQuantity', definition: 'int NULL' },
  { name: 'shippingAvailable', definition: 'boolean DEFAULT true NOT NULL' },
  { name: 'pickupAvailable', definition: 'boolean DEFAULT false NOT NULL' },
  { name: 'shippingAmountCents', definition: 'int DEFAULT 0 NOT NULL' },
  { name: 'fulfillmentTime', definition: 'varchar(100) NULL' },
] as const;

let schemaReadyPromise: Promise<void> | null = null;

function rowsFromResult(result: unknown): any[] {
  if (Array.isArray(result) && Array.isArray(result[0])) return result[0] as any[];
  return [];
}

/**
 * Repairs partially migrated merch_items tables without changing existing rows.
 * Some runtime environments contain the original external-link merch columns
 * but not the later native-checkout columns. The first merch read or create
 * safely adds only missing fields and makes externalUrl optional.
 */
export function ensureMerchItemsSchema(db: MerchSchemaDb): Promise<void> {
  if (schemaReadyPromise) return schemaReadyPromise;

  schemaReadyPromise = (async () => {
    const columnResult = await db.execute(sql`SHOW COLUMNS FROM merch_items`);
    const columns = new Map(
      rowsFromResult(columnResult).map((row) => [String(row.Field ?? row.field), row]),
    );

    for (const column of HYBRID_MERCH_COLUMNS) {
      if (columns.has(column.name)) continue;
      await db.execute(sql.raw(
        `ALTER TABLE \`merch_items\` ADD COLUMN \`${column.name}\` ${column.definition}`,
      ));
    }

    const externalUrl = columns.get('externalUrl');
    const externalUrlType = String(externalUrl?.Type ?? externalUrl?.type ?? '').toLowerCase();
    const externalUrlNullable = String(externalUrl?.Null ?? externalUrl?.null ?? '').toUpperCase() === 'YES';
    if (externalUrl && (externalUrlType !== 'varchar(2048)' || !externalUrlNullable)) {
      await db.execute(sql.raw(
        'ALTER TABLE `merch_items` MODIFY COLUMN `externalUrl` varchar(2048) NULL',
      ));
    }
  })().catch((error) => {
    schemaReadyPromise = null;
    throw error;
  });

  return schemaReadyPromise;
}

export function resetMerchSchemaCheckForTests() {
  schemaReadyPromise = null;
}
