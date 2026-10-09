type GrantSchemaDb = { execute: (sql: string) => Promise<any> };
let checks = new WeakMap<GrantSchemaDb, Promise<void>>();
export const COMPLIMENTARY_ACCESS_DDL = [
  `CREATE TABLE IF NOT EXISTS \`complimentary_access_grants\` (
    \`userId\` int NOT NULL PRIMARY KEY,
    \`tier\` enum('starter','professional','enterprise') NOT NULL,
    \`status\` enum('active','revoked') NOT NULL,
    \`expiresAt\` timestamp NULL,
    \`reason\` varchar(500) NOT NULL,
    \`grantedByUserId\` int NOT NULL,
    \`grantedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`revision\` int NOT NULL,
    \`revokedAt\` timestamp NULL,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS \`complimentary_access_events\` (
    \`id\` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    \`userId\` int NOT NULL,
    \`actorUserId\` int NOT NULL,
    \`action\` enum('grant','revoke') NOT NULL,
    \`tier\` enum('starter','professional','enterprise') NOT NULL,
    \`reason\` varchar(500) NOT NULL,
    \`expiresAt\` timestamp NULL,
    \`revision\` int NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY \`idx_comp_access_user_history\` (\`userId\`,\`id\`)
  )`,
] as const;
export function ensureComplimentaryAccessSchema(db: GrantSchemaDb) {
  const existing = checks.get(db); if (existing) return existing;
  const check = (async () => { for (const ddl of COMPLIMENTARY_ACCESS_DDL) await db.execute(ddl); })().catch(error => { checks.delete(db); throw error; });
  checks.set(db, check); return check;
}
export function resetComplimentaryAccessSchemaForTests() { checks = new WeakMap(); }
