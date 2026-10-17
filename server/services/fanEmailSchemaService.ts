import { getDb, getPool } from '../db';

type SchemaExecutor = { execute: (query: string, values?: unknown[]) => Promise<any> };

let readyCheck: Promise<void> | null = null;

async function hasTable(executor: SchemaExecutor, tableName: string): Promise<boolean> {
  const [rows] = await executor.execute(
    'SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1',
    [tableName],
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function hasColumn(executor: SchemaExecutor, tableName: string, columnName: string): Promise<boolean> {
  const [rows] = await executor.execute(
    'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1',
    [tableName, columnName],
  );
  return Array.isArray(rows) && rows.length > 0;
}

/**
 * Restores only the additive declarations from migration 0117. It never reads
 * or changes application data. Callers handling an anonymous signed URL must
 * validate its HMAC before calling this guard.
 */
export async function ensureFanEmailSchema(executor?: SchemaExecutor): Promise<void> {
  if (executor) {
    await ensureWithExecutor(executor);
    return;
  }

  if (readyCheck) return readyCheck;
  readyCheck = (async () => {
    await getDb();
    const pool = getPool();
    if (!pool) throw new Error('Fan email schema is temporarily unavailable');
    await ensureWithExecutor(pool as unknown as SchemaExecutor);
  })().catch(error => {
    readyCheck = null;
    throw error;
  });
  return readyCheck;
}

async function ensureWithExecutor(executor: SchemaExecutor): Promise<void> {
  if (!await hasTable(executor, 'fan_email_consents')) {
    try {
      await executor.execute(`CREATE TABLE IF NOT EXISTS \`fan_email_consents\` (
        \`id\` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
        \`followerUserId\` int NOT NULL,
        \`creatorUserId\` int NOT NULL,
        \`optIn\` boolean NOT NULL DEFAULT false,
        \`revision\` int NOT NULL DEFAULT 0,
        \`consentedAt\` timestamp NULL,
        \`revokedAt\` timestamp NULL,
        \`consentVersion\` varchar(64) NOT NULL,
        \`emailHash\` varchar(64),
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY \`uniq_fan_email_consent_scope\` (\`followerUserId\`, \`creatorUserId\`),
        KEY \`idx_fan_email_consent_creator_optin\` (\`creatorUserId\`, \`optIn\`)
      )`);
    } catch (error: any) {
      // Concurrent processes can complete this additive repair first.
      if ((error?.code ?? error?.cause?.code) !== 'ER_TABLE_EXISTS_ERROR') throw error;
    }
  }

  if (!await hasColumn(executor, 'email_preferences', 'fanUpdates')) {
    try {
      await executor.execute('ALTER TABLE `email_preferences` ADD COLUMN `fanUpdates` boolean NOT NULL DEFAULT true');
    } catch (error: any) {
      if ((error?.code ?? error?.cause?.code) !== 'ER_DUP_FIELDNAME') throw error;
    }
  }
}

export function resetFanEmailSchemaForTests(): void {
  readyCheck = null;
}
