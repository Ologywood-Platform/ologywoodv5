import type { Pool } from 'mysql2/promise';

type SchemaExecutor = Pick<Pool, 'execute'>;
let ready: Promise<void> | null = null;

const timingColumns: Record<string, string> = {
  scheduleStartAt: 'bigint NULL', scheduleEndAt: 'bigint NULL', scheduleTimezone: 'varchar(100) NULL',
  scheduleAllDay: 'boolean NULL', preparationMinutes: 'int NOT NULL DEFAULT 0', travelMinutes: 'int NOT NULL DEFAULT 0',
};

async function addMissingColumns(db: SchemaExecutor, table: string, definitions: Record<string, string>, optional = false) {
  let columns: any;
  try { [columns] = await db.execute(`SHOW COLUMNS FROM \`${table}\``); }
  catch (error: any) {
    if (optional && (error?.code === 'ER_NO_SUCH_TABLE' || error?.errno === 1146)) return;
    throw error;
  }
  const present = new Set((columns as any[]).map(column => column.Field));
  for (const [name, definition] of Object.entries(definitions)) {
    if (present.has(name)) continue;
    try { await db.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${name}\` ${definition}`); }
    catch (error: any) {
      // A second application process can race the explicit SHOW check.
      if (error?.code !== 'ER_DUP_FIELDNAME' && error?.errno !== 1060) throw error;
    }
  }
}

async function initialize(db: SchemaExecutor) {
  await addMissingColumns(db, 'bookings', timingColumns);
  // The existing declared Live slot table is absent on some legacy deployments. Only restore its schema.
  // Never backfill slots or change a booking/experience row. Remaining failed sources still fail closed.
  await db.execute(`CREATE TABLE IF NOT EXISTS \`ology_live_time_slots\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`experienceId\` int NOT NULL, \`talentId\` int NOT NULL,
    \`startTime\` timestamp NOT NULL, \`endTime\` timestamp NOT NULL,
    \`scheduleTimezone\` varchar(100) NULL,
    \`spotsTotal\` int NOT NULL DEFAULT 1, \`spotsTaken\` int NOT NULL DEFAULT 0,
    \`isAvailable\` boolean NOT NULL DEFAULT true,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY \`idx_ology_live_slots_experience\` (\`experienceId\`),
    KEY \`idx_ology_live_slots_talent\` (\`talentId\`),
    KEY \`idx_ology_live_slots_start\` (\`startTime\`),
    KEY \`idx_ology_live_slots_available\` (\`isAvailable\`)
  )`);
  await addMissingColumns(db, 'ology_live_time_slots', { scheduleTimezone: 'varchar(100) NULL' }, true);
  await db.execute(`CREATE TABLE IF NOT EXISTS \`schedule_appointments\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`ownerUserId\` int NOT NULL, \`createdByUserId\` int NOT NULL,
    \`title\` varchar(200) NOT NULL, \`category\` varchar(40) NOT NULL,
    \`startAt\` bigint NOT NULL, \`endAt\` bigint NOT NULL, \`timezone\` varchar(100) NOT NULL,
    \`allDay\` boolean NOT NULL DEFAULT false, \`date\` date NOT NULL,
    \`preparationMinutes\` int NOT NULL DEFAULT 0, \`travelMinutes\` int NOT NULL DEFAULT 0,
    \`location\` varchar(500), \`notes\` text, \`reminderMinutes\` int,
    \`revision\` int NOT NULL DEFAULT 1, \`status\` varchar(20) NOT NULL DEFAULT 'active',
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY \`idx_schedule_appointments_owner_time\` (\`ownerUserId\`, \`startAt\`),
    KEY \`idx_schedule_appointments_owner_status\` (\`ownerUserId\`, \`status\`)
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS \`schedule_reminder_receipts\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY, \`ownerUserId\` int NOT NULL,
    \`source\` varchar(20) NOT NULL, \`sourceId\` int NOT NULL, \`revision\` varchar(64) NOT NULL,
    \`dueAt\` bigint NOT NULL, \`dedupKey\` varchar(190) NOT NULL UNIQUE, \`notificationId\` int,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY \`idx_schedule_receipts_owner_source\` (\`ownerUserId\`, \`source\`, \`sourceId\`)
  )`);
}

/** Only approved additive schema repair. No migrations, backfills, or existing row changes. */
export function ensureScheduleSchema(override?: SchemaExecutor): Promise<void> {
  if (override) return initialize(override);
  if (!ready) {
    ready = (async () => {
      const { getDb, getPool } = await import('../db');
      if (!getPool()) await getDb();
      const pool = getPool();
      if (!pool) throw new Error('Schedule storage unavailable');
      await initialize(pool);
    })().catch(error => { ready = null; throw error; });
  }
  return ready;
}
export function resetScheduleSchemaForTests() { ready = null; }
