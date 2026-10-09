import 'dotenv/config';
import * as db from '../server/db';
import { ENV } from '../server/_core/env';
import { hasComplimentaryOwnerAccess } from '../server/services/ownerSubscriptionAccess';
import { getGrantStatus, hasPotentiallyBillingSubscription } from '../shared/complimentaryAccess';
import { buildComplimentaryAccessEmail, sendComplimentaryAccessEmail } from '../server/services/complimentaryAccessEmail';

/** Explicit owner operation, never invoked by a scheduler or server startup. Dry run by default. */
async function main() {
  const sending = process.argv.includes('--send');
  const targetArgument = process.argv.find(arg => arg.startsWith('--user-id='));
  const targetUserId = targetArgument ? Number(targetArgument.split('=')[1]) : null;
  if (targetUserId !== null && (!Number.isInteger(targetUserId) || targetUserId < 1)) throw new Error('Invalid target user ID');
  await db.getDb();
  const pool = db.getPool();
  if (!pool) throw new Error('Database unavailable');
  if (sending && (!ENV.sendgridApiKey || !ENV.sendgridFromEmail)) throw new Error('Email provider is not configured');
  const [actors]: any = await pool.execute('SELECT id,openId,email,emailVerified,name,role FROM users');
  const owner = actors.find((row: any) => hasComplimentaryOwnerAccess({ ...row, emailVerified: !!row.emailVerified }));
  if (!owner) throw new Error('Verified platform owner not found');
  const [targets]: any = await pool.execute('SELECT userId FROM complimentary_access_grants WHERE grantedByUserId=? ORDER BY userId', [owner.id]);
  const results: Array<{ userId: number; name: string | null; tier?: string; outcome: string }> = [];
  for (const target of targets) {
    if (targetUserId !== null && target.userId !== targetUserId) continue;
    const conn = await pool.getConnection();
    let reserved: any = null;
    try {
      await conn.beginTransaction();
      const [rows]: any = await conn.execute(`SELECT g.*,u.name,u.email,u.emailVerified,p.frequency,p.unsubscribedAt,s.status AS billingStatus,s.stripeSubscriptionId,s.currentPeriodEnd FROM complimentary_access_grants g JOIN users u ON u.id=g.userId LEFT JOIN email_preferences p ON p.userId=g.userId LEFT JOIN user_subscriptions s ON s.userId=g.userId WHERE g.userId=? FOR UPDATE`, [target.userId]);
      const row = rows[0];
      let skip = '';
      if (!row || row.grantedByUserId !== owner.id || getGrantStatus(row) !== 'active') skip = 'skipped_inactive';
      else if (hasPotentiallyBillingSubscription({ status: row.billingStatus, stripeSubscriptionId: row.stripeSubscriptionId, currentPeriodEnd: row.currentPeriodEnd })) skip = 'skipped_billing_conflict';
      else if (!row.emailVerified || !row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) skip = 'skipped_invalid_or_unverified_email';
      else if (row.frequency === 'never' || row.unsubscribedAt) skip = 'skipped_opt_out';
      const emailType = `complimentary_access_r${row?.revision ?? 0}`;
      const [prior]: any = await conn.execute('SELECT id,status,failureReason FROM email_logs WHERE userId=? AND emailType=? LIMIT 1', [target.userId, emailType]);
      if (!skip && prior.length) skip = 'skipped_already_attempted';
      if (skip) {
        await conn.rollback();
        results.push({ userId: target.userId, name: row?.name ?? null, outcome: skip });
        continue;
      }
      const input = { email: row.email, name: row.name, tier: row.tier, expiresAt: row.expiresAt ? new Date(row.expiresAt) : null };
      const email = buildComplimentaryAccessEmail(input);
      if (!sending) {
        await conn.rollback();
        results.push({ userId: row.userId, name: row.name, tier: row.tier, outcome: 'ready' });
        continue;
      }
      // A committed reservation intentionally prevents blind retries even after a crash or
      // uncertain provider response. Review SendGrid before any deliberate resend.
      const [insert]: any = await conn.execute(`INSERT INTO email_logs (recipientEmail,recipientName,subject,emailType,userId,status,failureReason) VALUES (?,?,?,?,?,'failed',?)`, [row.email, row.name, email.subject, emailType, row.userId, 'Send reserved; provider acceptance not yet confirmed. Do not automatically resend.']);
      await conn.commit();
      reserved = { input, id: insert.insertId, userId: row.userId, name: row.name, tier: row.tier };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
    if (!reserved) continue;
    const accepted = await sendComplimentaryAccessEmail(reserved.input);
    await pool.execute('UPDATE email_logs SET status=?,failureReason=? WHERE id=?', [accepted ? 'sent' : 'failed', accepted ? null : 'Provider did not confirm acceptance. Review SendGrid before manually retrying.', reserved.id]);
    results.push({ userId: reserved.userId, name: reserved.name, tier: reserved.tier, outcome: accepted ? 'provider_accepted' : 'provider_unconfirmed' });
    console.log(JSON.stringify(results[results.length - 1]));
  }
  console.log(JSON.stringify({ mode: sending ? 'send' : 'dry_run', results, providerAccepted: results.filter(r => r.outcome === 'provider_accepted').length, ready: results.filter(r => r.outcome === 'ready').length }));
}
main().catch(error => { console.error('Complimentary email operation failed:', error instanceof Error ? error.message : 'unknown error'); process.exitCode = 1; }).finally(async () => { await db.getPool()?.end(); });
