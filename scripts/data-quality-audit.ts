import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;
type DuplicateCheck = { table: string; key: string; candidates?: number; error?: string };
type EmailIssue = { table: string; column: string; invalid?: number; duplicateGroups?: number; error?: string };

const quoteIdent = (value: string) => `\`${value.replace(/`/g, '``')}\``;
const countFrom = (rows: unknown) => Number((rows as Row[])[0]?.count ?? 0);

/**
 * Natural-key checks are intentionally conservative. This command is read-only:
 * it reports candidate duplicates and never deletes, merges, or updates records.
 */
const duplicateChecks: Array<[string, string, string]> = [
  ['users', 'openId', 'openId'],
  ['users', 'email', 'LOWER(TRIM(email))'],
  ['artist_profiles', 'userId', 'userId'],
  ['artist_profiles', 'artistName', 'LOWER(TRIM(artistName))'],
  ['venue_profiles', 'userId', 'userId'],
  ['venue_profiles', 'organizationName', 'LOWER(TRIM(organizationName))'],
  ['events', 'artistId+venueId+title+date+time', 'artistId, venueId, eventTitle, eventDate, eventTime'],
  ['bookings', 'artistId+venueId+date+time', 'artistId, venueId, eventDate, eventTime'],
  ['follows', 'followerId+followingId+followingType', 'followerId, followingId, followingType'],
  ['artist_follows', 'followerId+followingId', 'followerId, followingId'],
  ['favorites', 'venueId+artistId', 'venueId, artistId'],
  ['saved_events', 'userId+eventId', 'userId, eventId'],
  ['saved_artists', 'userId+artistId', 'userId, artistId'],
  ['artist_releases', 'artistId+title', 'artistId, LOWER(TRIM(title))'],
  ['releases', 'userId+title', 'userId, LOWER(TRIM(title))'],
  ['profile_release_orders', 'profileId+kind', 'profileId, kind'],
  ['release_purchases', 'stripeCheckoutSessionId', 'stripeCheckoutSessionId'],
  ['content_release_purchases', 'releaseId+userId', 'releaseId, userId'],
  ['ticket_orders', 'orderNumber', 'orderNumber'],
  ['ticket_orders', 'stripeCheckoutSessionId', 'stripeCheckoutSessionId'],
  ['ticket_items', 'ticketCode', 'ticketCode'],
  ['merch_items', 'userId+userType+title', 'userId, userType, LOWER(TRIM(title))'],
  ['merch_orders', 'orderNumber', 'orderNumber'],
  ['merch_orders', 'stripeCheckoutSessionId', 'stripeCheckoutSessionId'],
  ['merch_order_items', 'orderId+merchItemId', 'orderId, merchItemId'],
  ['fan_club_memberships', 'stripeSubscriptionId', 'stripeSubscriptionId'],
  ['fan_club_memberships', 'fanId+talentId+tierId', 'fanUserId, talentUserId, tierId'],
  ['artist_team_invitations', 'artistId+email', 'artistId, LOWER(TRIM(email))'],
  ['schedule_appointments', 'owner+start+end', 'ownerUserId, startAt, endAt'],
];

const main = async () => {
  const db = await getDb();
  if (db == null) throw new Error('database unavailable');

  const [metadata] = await db.execute(sql`SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.columns WHERE TABLE_SCHEMA = DATABASE()`);
  const available = new Set((metadata as Row[]).map((row) => `${String(row.TABLE_NAME)}.${String(row.COLUMN_NAME)}`));
  const duplicateResults: DuplicateCheck[] = [];

  for (const [table, key, expressions] of duplicateChecks) {
    const columns = expressions.split(',').map((part) => part.trim().replace(/^LOWER\(TRIM\(([^)]+)\)\)$/, '$1'));
    if (!columns.every((column) => available.has(`${table}.${column}`))) {
      duplicateResults.push({ table, key, candidates: 0 });
      continue;
    }
    const where = columns.map((column) => `${quoteIdent(column)} IS NOT NULL`).join(' AND ');
    const query = `SELECT COUNT(*) AS count FROM (SELECT ${expressions} FROM ${quoteIdent(table)} WHERE ${where} GROUP BY ${expressions} HAVING COUNT(*) > 1) d`;
    try {
      const [rows] = await db.execute(sql.raw(query));
      duplicateResults.push({ table, key, candidates: countFrom(rows) });
    } catch (error) {
      duplicateResults.push({ table, key, error: error instanceof Error ? error.message.slice(0, 120) : 'query failed' });
    }
  }

  const rawEmailColumns = (metadata as Row[])
    .map((row) => ({ table: String(row.TABLE_NAME), column: String(row.COLUMN_NAME) }))
    .filter(({ column }) => {
      const name = column.toLowerCase();
      return name === 'email' || name.endsWith('email');
    });
  const emailResults: EmailIssue[] = [];
  const emailPattern = "'^[^@[:space:]]+@[^@[:space:]]+\\\\.[^@[:space:]]+$'";

  for (const { table, column } of rawEmailColumns) {
    const tableId = quoteIdent(table);
    const columnId = quoteIdent(column);
    try {
      const [invalidRows] = await db.execute(sql.raw(`SELECT COUNT(*) AS count FROM ${tableId} WHERE ${columnId} IS NOT NULL AND (TRIM(${columnId})='' OR ${columnId} NOT REGEXP ${emailPattern})`));
      const [duplicateRows] = await db.execute(sql.raw(`SELECT COUNT(*) AS count FROM (SELECT LOWER(TRIM(${columnId})) AS k FROM ${tableId} WHERE ${columnId} IS NOT NULL AND TRIM(${columnId})<>'' GROUP BY LOWER(TRIM(${columnId})) HAVING COUNT(*) > 1) d`));
      emailResults.push({ table, column, invalid: countFrom(invalidRows), duplicateGroups: countFrom(duplicateRows) });
    } catch (error) {
      emailResults.push({ table, column, error: error instanceof Error ? error.message.slice(0, 120) : 'query failed' });
    }
  }

  console.log(JSON.stringify({
    duplicateChecksRun: duplicateResults.length,
    duplicateChecksWithCandidates: duplicateResults.filter((row) => (row.candidates ?? 0) > 0 || row.error),
    rawEmailColumnsRun: emailResults.length,
    rawEmailColumnsWithIssues: emailResults.filter((row) => (row.invalid ?? 0) > 0 || (row.duplicateGroups ?? 0) > 0 || row.error),
  }, null, 2));
};

main().catch((error) => {
  console.error('data-quality-audit failed:', error instanceof Error ? error.message : 'unknown error');
  process.exitCode = 1;
});
