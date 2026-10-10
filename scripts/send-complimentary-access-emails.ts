import 'dotenv/config';
import * as db from '../server/db';
import { hasComplimentaryOwnerAccess } from '../server/services/ownerSubscriptionAccess';
import { notifyComplimentaryGrant } from '../server/services/complimentaryAccessEmailDelivery';

/** Explicit owner backfill; normal future grant emails run in the grant API.
 * Dry run by default. Shares existing revision-based reservations with that API.
 */
async function main() {
  const sending = process.argv.includes('--send');
  const targetArgument = process.argv.find(arg => arg.startsWith('--user-id='));
  const targetUserId = targetArgument ? Number(targetArgument.split('=')[1]) : null;
  if (targetUserId !== null && (!Number.isInteger(targetUserId) || targetUserId < 1)) throw new Error('Invalid target user ID');
  await db.getDb();
  const pool = db.getPool();
  if (!pool) throw new Error('Database unavailable');
  const [actors]: any = await pool.execute('SELECT id,openId,email,emailVerified,name,role FROM users');
  const owner = actors.find((row: any) => hasComplimentaryOwnerAccess({ ...row, emailVerified: !!row.emailVerified }));
  if (!owner) throw new Error('Verified platform owner not found');
  owner.emailVerified = !!owner.emailVerified;
  const [targets]: any = await pool.execute('SELECT userId FROM complimentary_access_grants WHERE grantedByUserId=? ORDER BY userId', [owner.id]);
  const results: Array<{ userId: number; outcome: string }> = [];
  for (const target of targets) {
    if (targetUserId !== null && target.userId !== targetUserId) continue;
    const result = await notifyComplimentaryGrant(owner, target.userId, null, !sending);
    results.push({ userId: target.userId, outcome: result.outcome });
    if (sending) console.log(JSON.stringify(results[results.length - 1]));
  }
  console.log(JSON.stringify({ mode: sending ? 'send' : 'dry_run', results, providerAccepted: results.filter(r => r.outcome === 'provider_accepted').length, ready: results.filter(r => r.outcome === 'ready').length }));
}
main().catch(error => { console.error('Complimentary email operation failed:', error instanceof Error ? error.message : 'unknown error'); process.exitCode = 1; }).finally(async () => { await db.getPool()?.end(); });
