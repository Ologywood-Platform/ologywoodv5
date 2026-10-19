import { getDb, getPool } from '../db';

type SchemaExecutor = { execute: (query: string, values?: unknown[]) => Promise<any> };

const REQUIRED_COLUMNS = ['id', 'profileId', 'kind', 'orderedIds', 'revision', 'updatedAt'] as const;
let readyCheck: Promise<void> | null = null;

/**
 * Checks migration-0118 in the actual application database. Managed migration
 * tools may target a different database. Restore only this absent additive table;
 * never alter an existing table, rewrite data, or apply unrelated migrations.
 */
export async function ensureReleaseOrderSchema(executor?: SchemaExecutor): Promise<void> {
  if (executor) {
    await inspect(executor);
    return;
  }
  if (readyCheck) return readyCheck;
  readyCheck = (async () => {
    await getDb();
    const pool = getPool();
    if (!pool) throw new Error('Release ordering is temporarily unavailable');
    await inspect(pool as unknown as SchemaExecutor);
  })().catch(error => {
    readyCheck = null;
    throw error;
  });
  return readyCheck;
}

async function inspect(executor: SchemaExecutor): Promise<void> {
  const readColumns = () => executor.execute(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ?`,
    ['profile_release_orders'],
  );
  let [rows] = await readColumns();
  if (!Array.isArray(rows)) throw new Error('Could not inspect release-order schema');
  if (rows.length === 0) {
    const [tables] = await executor.execute(
      'SELECT 1 FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=? LIMIT 1',
      ['profile_release_orders'],
    );
    if (!Array.isArray(tables)) throw new Error('Could not inspect release-order schema');
    if (tables.length > 0) throw new Error('Release-order migration is not available');
    try {
      await executor.execute(`CREATE TABLE IF NOT EXISTS \`profile_release_orders\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`profileId\` int NOT NULL,
        \`kind\` enum('music','content_singles') NOT NULL,
        \`orderedIds\` json,
        \`revision\` int NOT NULL DEFAULT 0,
        \`updatedAt\` bigint NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uniq_profile_release_order_scope\` (\`profileId\`,\`kind\`)
      )`);
    } catch (error: any) {
      if ((error?.code ?? error?.cause?.code) !== 'ER_TABLE_EXISTS_ERROR') throw error;
    }
    [rows] = await readColumns();
    if (!Array.isArray(rows)) throw new Error('Could not inspect release-order schema');
  }
  const columns = new Set(rows.map((row: any) => String(row.column_name ?? row.COLUMN_NAME ?? row.Field ?? row.field)));
  if (!REQUIRED_COLUMNS.every(column => columns.has(column))) {
    throw new Error('Release-order migration is not available');
  }
  const [indexes] = await executor.execute(
    `SELECT index_name, column_name, non_unique, seq_in_index
       FROM information_schema.statistics
      WHERE table_schema = DATABASE() AND table_name = ?
      ORDER BY index_name, seq_in_index`,
    ['profile_release_orders'],
  );
  if (!Array.isArray(indexes)) throw new Error('Could not inspect release-order schema');
  const scope = indexes
    .filter((row: any) => Number(row.non_unique ?? row.NON_UNIQUE) === 0
      && String(row.index_name ?? row.INDEX_NAME) === 'uniq_profile_release_order_scope')
    .sort((a: any, b: any) => Number(a.seq_in_index ?? a.SEQ_IN_INDEX) - Number(b.seq_in_index ?? b.SEQ_IN_INDEX))
    .map((row: any) => String(row.column_name ?? row.COLUMN_NAME));
  if (scope.length !== 2 || scope[0] !== 'profileId' || scope[1] !== 'kind') {
    throw new Error('Release-order migration is not available');
  }
}

export function resetReleaseOrderSchemaForTests(): void {
  readyCheck = null;
}
