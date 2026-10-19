import { getDb, getPool } from '../db';

type SchemaExecutor = { execute: (query: string, values?: unknown[]) => Promise<any> };

const REQUIRED_COLUMNS = ['id', 'profileId', 'kind', 'orderedIds', 'revision', 'updatedAt'] as const;
let readyCheck: Promise<void> | null = null;

/**
 * Checks only the additive migration-0118 metadata. This intentionally never
 * creates or changes schema: migration application remains an explicit deploy
 * operation rather than a request-path side effect.
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
  const [rows] = await executor.execute(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ?`,
    ['profile_release_orders'],
  );
  if (!Array.isArray(rows)) throw new Error('Could not inspect release-order schema');
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
