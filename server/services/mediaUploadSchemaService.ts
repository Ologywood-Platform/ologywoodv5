import { sql } from 'drizzle-orm';

type SchemaDb = { execute: (query: any, values?: readonly unknown[]) => Promise<any> };

let readyChecks = new WeakMap<SchemaDb, Promise<void>>();

const REQUIRED_JOB_COLUMNS = [
  'id', 'ownerUserId', 'requestId', 'fingerprint', 'storageNonce', 'purpose', 'releaseId',
  'fileName', 'mimeType', 'fileSizeBytes', 'chunkBytes', 'chunkCount', 'state',
  'attempts', 'leaseToken', 'leaseExpiresAt', 'expiresAt', 'result', 'error',
  'createdAt', 'updatedAt',
] as const;
const REQUIRED_RECEIPT_COLUMNS = ['id', 'uploadId', 'chunkIndex', 'sha256', 'byteSize', 'createdAt'] as const;

/**
 * Installs only missing new tables, then verifies their physical shape. It never
 * alters an existing table: a partial/old table is unsafe to use and therefore
 * fails closed until the reviewed migration is applied.
 */
export function ensureMediaUploadSchema(db: SchemaDb): Promise<void> {
  const existing = readyChecks.get(db);
  if (existing) return existing;
  const check = (async () => {
    await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS \`media_upload_jobs\` (
      \`id\` varchar(36) NOT NULL,
      \`ownerUserId\` int NOT NULL,
      \`requestId\` varchar(36) NOT NULL,
      \`fingerprint\` varchar(64) NOT NULL,
      \`storageNonce\` varchar(36) NOT NULL,
      \`purpose\` enum('content-preview','content-cover','music-audio','music-cover') NOT NULL,
      \`releaseId\` int NULL,
      \`fileName\` varchar(255) NOT NULL,
      \`mimeType\` varchar(100) NOT NULL,
      \`fileSizeBytes\` int NOT NULL,
      \`chunkBytes\` int NOT NULL,
      \`chunkCount\` int NOT NULL,
      \`state\` enum('uploading','queued','processing','done','failed') NOT NULL DEFAULT 'uploading',
      \`attempts\` int NOT NULL DEFAULT 0,
      \`leaseToken\` varchar(36) NULL,
      \`leaseExpiresAt\` timestamp NULL,
      \`expiresAt\` timestamp NOT NULL,
      \`result\` json NULL,
      \`error\` varchar(255) NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uniq_media_upload_owner_request\` (\`ownerUserId\`, \`requestId\`),
      KEY \`idx_media_upload_jobs_owner_state\` (\`ownerUserId\`, \`state\`),
      KEY \`idx_media_upload_jobs_lease\` (\`state\`, \`leaseExpiresAt\`)
    )`));
    await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS \`media_upload_chunk_receipts\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`uploadId\` varchar(36) NOT NULL,
      \`chunkIndex\` int NOT NULL,
      \`sha256\` varchar(64) NOT NULL,
      \`byteSize\` int NOT NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uniq_media_upload_chunk\` (\`uploadId\`, \`chunkIndex\`),
      KEY \`idx_media_upload_chunk_upload\` (\`uploadId\`)
    )`));

    await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS media_upload_worker_slots (id int NOT NULL PRIMARY KEY, leaseToken varchar(36) NULL, leaseExpiresAt timestamp NULL)`));
    const [slots] = await db.execute('SHOW COLUMNS FROM `media_upload_worker_slots`');
    if (!Array.isArray(slots) || ['id','leaseToken','leaseExpiresAt'].some(field => !slots.some((row: any) => String(row.Field ?? row.field) === field))) throw new Error('Media worker lease schema is incomplete');
    const [jobRows] = await db.execute('SHOW COLUMNS FROM `media_upload_jobs`');
    const [receiptRows] = await db.execute('SHOW COLUMNS FROM `media_upload_chunk_receipts`');
    if (!Array.isArray(jobRows) || !Array.isArray(receiptRows)) throw new Error('Media upload schema inspection failed');
    const jobColumns = new Set(jobRows.map((row: any) => String(row.Field ?? row.field)));
    const receiptColumns = new Set(receiptRows.map((row: any) => String(row.Field ?? row.field)));
    if (REQUIRED_JOB_COLUMNS.some(column => !jobColumns.has(column)) || REQUIRED_RECEIPT_COLUMNS.some(column => !receiptColumns.has(column))) {
      throw new Error('Media upload schema is incomplete; apply the reviewed migration');
    }
    const [jobIndexes] = await db.execute('SHOW INDEX FROM `media_upload_jobs`');
    const [receiptIndexes] = await db.execute('SHOW INDEX FROM `media_upload_chunk_receipts`');
    const [slotIndexes] = await db.execute('SHOW INDEX FROM `media_upload_worker_slots`');
    const unique = (items: any[], fields: string[]) => {
      if (!Array.isArray(items)) return false;
      const groups = new Map<string, Array<{ seq: number; field: string }>>();
      for (const row of items) {
        if (Number(row.Non_unique ?? row.non_unique) !== 0) continue;
        const name = String(row.Key_name ?? row.key_name);
        const values = groups.get(name) ?? [];
        values.push({ seq: Number(row.Seq_in_index ?? row.seq_in_index), field: String(row.Column_name ?? row.column_name) });
        groups.set(name, values);
      }
      return [...groups.values()].some(group => group.sort((a,b)=>a.seq-b.seq).map(item=>item.field).join(',') === fields.join(','));
    };
    if (!unique(slotIndexes, ['id']) || !unique(jobIndexes, ['id']) || !unique(jobIndexes, ['ownerUserId','requestId']) || !unique(receiptIndexes, ['uploadId','chunkIndex'])) {
      throw new Error('Media upload unique indexes are incomplete; apply the reviewed migration');
    }
  })().catch(error => {
    readyChecks.delete(db);
    throw error;
  });
  readyChecks.set(db, check);
  return check;
}

export function resetMediaUploadSchemaForTests(): void {
  readyChecks = new WeakMap();
}
