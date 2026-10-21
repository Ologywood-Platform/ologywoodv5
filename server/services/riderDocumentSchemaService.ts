type RiderDocumentSchemaDb = {
  execute: (query: string, values?: readonly unknown[]) => Promise<any>;
};

const REQUIRED_COLUMNS: Record<string, readonly string[]> = {
  rider_documents: ['id', 'ownerUserId', 'title', 'currentVersionId', 'revision', 'isDefault', 'archivedAt', 'createdAt', 'updatedAt'],
  rider_document_versions: ['id', 'documentId', 'ownerUserId', 'versionNumber', 'fileName', 'storageKey', 'byteSize', 'pageCount', 'sha256', 'createdAt'],
  booking_rider_document_links: ['id', 'bookingId', 'documentId', 'versionId', 'titleSnapshot', 'attachedByUserId', 'attachedAt'],
};

function resultRows(result: unknown): any[] {
  return Array.isArray(result) && Array.isArray(result[0]) ? result[0] as any[] : [];
}

/**
 * Creates only missing rider-document tables. It deliberately never ALTERs,
 * drops, or updates application rows: a partially incompatible table is a
 * deployment error rather than something this request path attempts to repair.
 * Call before opening a transaction; callers then use their same raw connection
 * for authorization and document mutations.
 */
async function inspectAndInstallRiderDocumentSchema(db: RiderDocumentSchemaDb): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS \`rider_documents\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`ownerUserId\` int NOT NULL,
      \`title\` varchar(255) NOT NULL,
      \`currentVersionId\` int DEFAULT NULL,
      \`revision\` int NOT NULL DEFAULT 1,
      \`isDefault\` boolean NOT NULL DEFAULT false,
      \`archivedAt\` timestamp NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_rider_documents_owner_available\` (\`ownerUserId\`, \`archivedAt\`, \`isDefault\`)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS \`rider_document_versions\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`documentId\` int NOT NULL,
      \`ownerUserId\` int NOT NULL,
      \`versionNumber\` int NOT NULL,
      \`fileName\` varchar(255) NOT NULL,
      \`storageKey\` varchar(1024) NOT NULL,
      \`byteSize\` int NOT NULL,
      \`pageCount\` int NOT NULL,
      \`sha256\` varchar(64) NOT NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uniq_rider_document_versions_document_number\` (\`documentId\`, \`versionNumber\`),
      KEY \`idx_rider_document_versions_document\` (\`documentId\`),
      KEY \`idx_rider_document_versions_owner\` (\`ownerUserId\`)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS \`booking_rider_document_links\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`bookingId\` int NOT NULL,
      \`documentId\` int NOT NULL,
      \`versionId\` int NOT NULL,
      \`titleSnapshot\` varchar(255) NOT NULL,
      \`attachedByUserId\` int NOT NULL,
      \`attachedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uniq_booking_rider_document_link_version\` (\`bookingId\`, \`versionId\`),
      KEY \`idx_booking_rider_document_links_booking\` (\`bookingId\`),
      KEY \`idx_booking_rider_document_links_version\` (\`versionId\`)
    )
  `);

  for (const [tableName, required] of Object.entries(REQUIRED_COLUMNS)) {
    const columns = resultRows(await db.execute(`SHOW COLUMNS FROM \`${tableName}\``));
    const present = new Set(columns.map((row) => String(row.Field ?? row.field)));
    const missing = required.filter((column) => !present.has(column));
    if (missing.length) {
      throw new Error(`Rider document schema is incomplete (${tableName}: ${missing.join(', ')})`);
    }
  }
  const uniqueScopes: Record<string, readonly string[]> = {
    rider_document_versions: ['documentId', 'versionNumber'],
    booking_rider_document_links: ['bookingId', 'versionId'],
  };
  for (const [table, scope] of Object.entries(uniqueScopes)) {
    const indexes = resultRows(await db.execute(`SHOW INDEX FROM \`${table}\``));
    const keys = new Map<string, { sequence: number; column: string }[]>();
    for (const row of indexes) {
      if (Number(row.Non_unique ?? row.non_unique) !== 0) continue;
      const name = String(row.Key_name ?? row.key_name);
      const parts = keys.get(name) ?? [];
      parts.push({ sequence: Number(row.Seq_in_index ?? row.seq_in_index), column: String(row.Column_name ?? row.column_name) });
      keys.set(name, parts);
    }
    if (![...keys.values()].some(parts => parts.sort((a, b) => a.sequence - b.sequence).map(part => part.column).join(',') === scope.join(','))) {
      throw new Error(`Rider document schema unique scope is missing (${table})`);
    }
  }
}

const verifiedPools = new WeakMap<RiderDocumentSchemaDb, Promise<void>>();
export async function ensureRiderDocumentSchema(db: RiderDocumentSchemaDb): Promise<void> {
  let check = verifiedPools.get(db);
  if (!check) {
    check = inspectAndInstallRiderDocumentSchema(db).catch(error => { verifiedPools.delete(db); throw error; });
    verifiedPools.set(db, check);
  }
  await check;
}
