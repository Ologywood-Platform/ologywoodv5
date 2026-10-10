import type { Pool } from 'mysql2/promise';
import type { User } from '../../drizzle/schema';
import { ENV } from '../_core/env';
import { requireGrantOwner } from './complimentaryAccessService';
import { getGrantStatus, hasPotentiallyBillingSubscription } from '../../shared/complimentaryAccess';
import { buildComplimentaryAccessEmail, sendComplimentaryAccessEmail, type ComplimentaryEmailInput } from './complimentaryAccessEmail';
import type { ComplimentaryEmailOutcome } from '../../shared/complimentaryAccessEmail';

export type ComplimentaryEmailResult = { outcome: ComplimentaryEmailOutcome };
export type GrantEmailDependencies = {
  getPool(): Promise<Pool>;
  configured(): boolean;
  send(input: ComplimentaryEmailInput): Promise<boolean>;
};
const dependencies: GrantEmailDependencies = {
  async getPool() {
    const db = await import('../db');
    await db.getDb();
    const pool = db.getPool();
    if (!pool) throw new Error('Email database unavailable');
    return pool;
  },
  configured: () => !!ENV.sendgridApiKey && !!ENV.sendgridFromEmail,
  send: sendComplimentaryAccessEmail,
};

/** Same reservation path for automatic post-grant delivery and explicit owner backfills.
 * A provider timeout/crash is ambiguous: never automatically retry that revision.
 * Only the grant mutation calls this automatically; there is no polling/startup sender.
 */
export async function notifyComplimentaryGrant(
  actor: User,
  userId: number,
  expectedRevision: number | null,
  dryRun = false,
  deps: GrantEmailDependencies = dependencies,
): Promise<ComplimentaryEmailResult> {
  requireGrantOwner(actor);
  if (!Number.isInteger(userId) || userId < 1 || (expectedRevision !== null && (!Number.isInteger(expectedRevision) || expectedRevision < 1))) {
    throw new Error('Invalid grant email target');
  }
  let pool: Pool;
  let reservation: { id: number; input: ComplimentaryEmailInput };
  try {
    pool = await deps.getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // Grant and revoke operations lock the same user first. This serializes both
      // senders and observes the grant committed by the original mutation.
      await conn.execute('SELECT id FROM users WHERE id=? FOR UPDATE', [userId]);
      const [rows]: any = await conn.execute(`SELECT g.*,u.name,u.email,u.emailVerified,p.frequency,p.unsubscribedAt,s.status AS billingStatus,s.stripeSubscriptionId,s.currentPeriodEnd FROM complimentary_access_grants g JOIN users u ON u.id=g.userId LEFT JOIN email_preferences p ON p.userId=g.userId LEFT JOIN user_subscriptions s ON s.userId=g.userId WHERE g.userId=? FOR UPDATE`, [userId]);
      const row = rows[0];
      let skip: ComplimentaryEmailOutcome | null = null;
      if (!row || row.grantedByUserId !== actor.id || getGrantStatus(row) !== 'active') skip = 'skipped_inactive';
      else if (expectedRevision !== null && row.revision !== expectedRevision) skip = 'skipped_stale_revision';
      else if (hasPotentiallyBillingSubscription({ status: row.billingStatus, stripeSubscriptionId: row.stripeSubscriptionId, currentPeriodEnd: row.currentPeriodEnd })) skip = 'skipped_billing_conflict';
      else if (!row.emailVerified || !row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) skip = 'skipped_invalid_or_unverified_email';
      else if (row.frequency === 'never' || row.unsubscribedAt) skip = 'skipped_opt_out';
      if (skip) {
        await conn.rollback();
        return { outcome: skip };
      }
      // Preserve the pre-existing manual sender key so previous recipients do not
      // get duplicate confirmations when automatic delivery is published.
      const emailType = `complimentary_access_r${row.revision}`;
      const [prior]: any = await conn.execute('SELECT id,status FROM email_logs WHERE userId=? AND emailType=? LIMIT 1', [userId, emailType]);
      if (prior.length) {
        await conn.rollback();
        return { outcome: 'skipped_already_attempted' };
      }
      const input: ComplimentaryEmailInput = { email: row.email, name: row.name, tier: row.tier, expiresAt: row.expiresAt ? new Date(row.expiresAt) : null };
      const email = buildComplimentaryAccessEmail(input);
      if (dryRun || !deps.configured()) {
        await conn.rollback();
        return { outcome: dryRun ? 'ready' : 'not_configured' };
      }
      const [insert]: any = await conn.execute(`INSERT INTO email_logs (recipientEmail,recipientName,subject,emailType,userId,status,failureReason) VALUES (?,?,?,?,?,'failed',?)`, [row.email, row.name, email.subject, emailType, userId, 'Send reserved; provider acceptance not yet confirmed. Do not automatically resend.']);
      await conn.commit();
      reservation = { id: insert.insertId, input };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[ComplimentaryEmail] Reservation unavailable', { userId, revision: expectedRevision, error: error instanceof Error ? error.name : 'UnknownError' });
    return { outcome: 'error' };
  }
  let accepted = false;
  try {
    accepted = await deps.send(reservation.input);
  } catch {
    // The committed reservation remains, even if the provider's result is unknown.
  }
  try {
    await pool.execute('UPDATE email_logs SET status=?,failureReason=? WHERE id=?', [accepted ? 'sent' : 'failed', accepted ? null : 'Provider did not confirm acceptance. Review SendGrid before manually retrying.', reservation.id]);
  } catch (error) {
    console.error('[ComplimentaryEmail] Delivery audit needs review', { userId, revision: expectedRevision, accepted, error: error instanceof Error ? error.name : 'UnknownError' });
  }
  return { outcome: accepted ? 'provider_accepted' : 'provider_unconfirmed' };
}
