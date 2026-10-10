import { beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
import type { Pool } from 'mysql2/promise';
import type { User } from '../drizzle/schema';
import { notifyComplimentaryGrant, type GrantEmailDependencies } from './services/complimentaryAccessEmailDelivery';

const priorOwner = process.env.OWNER_OPEN_ID;
const actor = { id: 1, openId: 'email-test-owner', emailVerified: true } as User;
const grantRow = () => ({ userId: 2, grantedByUserId: 1, status: 'active', revision: 3, tier: 'enterprise', expiresAt: null, name: 'Recipient', email: 'recipient@example.test', emailVerified: 1, frequency: 'weekly', unsubscribedAt: null, billingStatus: null, stripeSubscriptionId: null, currentPeriodEnd: null });
function fixture(overrides: Record<string, unknown> = {}) {
  const row: any = { ...grantRow(), ...overrides };
  const logs: any[] = [];
  const steps: string[] = [];
  let lock: Promise<void> = Promise.resolve();
  let failCommit = false;
  let failAudit = false;
  const pool = {
    async getConnection() {
      let unlock: (() => void) | undefined;
      let pendingLog: any;
      return {
        async beginTransaction() { steps.push('begin'); },
        async execute(sql: string, params: any[]) {
          if (sql.startsWith('SELECT id FROM users')) {
            const previous = lock;
            lock = new Promise(resolve => { unlock = resolve; });
            await previous;
            return [[{ id: 2 }]];
          }
          if (sql.startsWith('SELECT g.*')) return [[row]];
          if (sql.startsWith('SELECT id,status')) return [logs.filter(l => l.userId === params[0] && l.emailType === params[1])];
          if (sql.startsWith('INSERT INTO email_logs')) {
            pendingLog = { id: logs.length + 1, userId: params[4], emailType: params[3], status: 'failed' };
            return [{ insertId: pendingLog.id }];
          }
          throw new Error('Unexpected SQL');
        },
        async commit() {
          if (failCommit) throw new Error('commit failed');
          if (pendingLog) logs.push(pendingLog);
          steps.push('commit');
        },
        async rollback() { steps.push('rollback'); },
        release() { steps.push('release'); unlock?.(); },
      };
    },
    async execute(sql: string, params: any[]) {
      if (!sql.startsWith('UPDATE email_logs')) throw new Error('Unexpected write');
      if (failAudit) throw new Error('audit failed');
      const log = logs.find(l => l.id === params[2]);
      log.status = params[0];
      steps.push('audit');
      return [{}];
    },
  };
  const send = vi.fn(async () => { steps.push('send'); return true; });
  const deps: GrantEmailDependencies = { getPool: async () => pool as unknown as Pool, configured: () => true, send };
  return { row, logs, steps, send, deps, setFailCommit: () => { failCommit = true; }, setFailAudit: () => { failAudit = true; } };
}
beforeEach(() => { process.env.OWNER_OPEN_ID = 'email-test-owner'; });
afterAll(() => { if (priorOwner === undefined) delete process.env.OWNER_OPEN_ID; else process.env.OWNER_OPEN_ID = priorOwner; });

describe('Complimentary grant email delivery reservations', () => {
  it('commits and releases a reservation before sending the exact current plan', async () => {
    const f = fixture();
    expect(await notifyComplimentaryGrant(actor, 2, 3, false, f.deps)).toEqual({ outcome: 'provider_accepted' });
    expect(f.steps).toEqual(['begin', 'commit', 'release', 'send', 'audit']);
    expect(f.send).toHaveBeenCalledWith({ email: 'recipient@example.test', name: 'Recipient', tier: 'enterprise', expiresAt: null });
    expect(f.logs).toEqual([{ id: 1, userId: 2, emailType: 'complimentary_access_r3', status: 'sent' }]);
  });
  it('shares the legacy manual key and prevents duplicate manual/automatic sends', async () => {
    const f = fixture();
    await notifyComplimentaryGrant(actor, 2, null, false, f.deps);
    expect(await notifyComplimentaryGrant(actor, 2, 3, false, f.deps)).toEqual({ outcome: 'skipped_already_attempted' });
    expect(f.send).toHaveBeenCalledTimes(1);
    expect(f.logs).toHaveLength(1);
  });
  it('serializes concurrent manual and automatic reservation attempts', async () => {
    const f = fixture();
    const results = await Promise.all([notifyComplimentaryGrant(actor, 2, 3, false, f.deps), notifyComplimentaryGrant(actor, 2, null, false, f.deps)]);
    expect(results.map(r => r.outcome).sort()).toEqual(['provider_accepted', 'skipped_already_attempted']);
    expect(f.send).toHaveBeenCalledTimes(1);
  });
  it('allows one new confirmation for a replacement revision, not for the old revision', async () => {
    const f = fixture();
    await notifyComplimentaryGrant(actor, 2, 3, false, f.deps);
    f.row.revision = 4; f.row.tier = 'professional';
    expect(await notifyComplimentaryGrant(actor, 2, 3, false, f.deps)).toEqual({ outcome: 'skipped_stale_revision' });
    expect(await notifyComplimentaryGrant(actor, 2, 4, false, f.deps)).toEqual({ outcome: 'provider_accepted' });
    expect(f.logs).toHaveLength(2);
    expect(f.send.mock.calls[1][0]).toMatchObject({ tier: 'professional' });
  });
  it.each([
    [{ status: 'revoked' }, 'skipped_inactive'],
    [{ expiresAt: new Date('2000-01-01') }, 'skipped_inactive'],
    [{ grantedByUserId: 99 }, 'skipped_inactive'],
    [{ revision: 4 }, 'skipped_stale_revision'],
    [{ billingStatus: 'active', stripeSubscriptionId: 'sub_fixture' }, 'skipped_billing_conflict'],
    [{ billingStatus: 'cancelled', stripeSubscriptionId: 'sub_fixture', currentPeriodEnd: new Date('2037-01-01') }, 'skipped_billing_conflict'],
    [{ emailVerified: 0 }, 'skipped_invalid_or_unverified_email'],
    [{ email: 'not-an-email' }, 'skipped_invalid_or_unverified_email'],
    [{ frequency: 'never' }, 'skipped_opt_out'],
    [{ unsubscribedAt: new Date() }, 'skipped_opt_out'],
  ])('skips unsafe/ineligible state %j with %s', async (overrides, outcome) => {
    const f = fixture(overrides);
    expect(await notifyComplimentaryGrant(actor, 2, 3, false, f.deps)).toEqual({ outcome });
    expect(f.send).not.toHaveBeenCalled();
    expect(f.logs).toHaveLength(0);
    expect(f.steps).toContain('rollback');
  });
  it('checks opt-outs even if an earlier revision has a reservation', async () => {
    const f = fixture();
    await notifyComplimentaryGrant(actor, 2, 3, false, f.deps);
    f.row.revision = 4; f.row.frequency = 'never';
    expect(await notifyComplimentaryGrant(actor, 2, 4, false, f.deps)).toEqual({ outcome: 'skipped_opt_out' });
    expect(f.logs).toHaveLength(1);
  });
  it('dry run never logs or sends an email', async () => {
    const f = fixture();
    expect(await notifyComplimentaryGrant(actor, 2, null, true, f.deps)).toEqual({ outcome: 'ready' });
    expect(f.send).not.toHaveBeenCalled(); expect(f.logs).toHaveLength(0);
  });
  it('missing provider configuration does not create a reservation or change access', async () => {
    const f = fixture(); f.deps.configured = () => false;
    expect(await notifyComplimentaryGrant(actor, 2, 3, false, f.deps)).toEqual({ outcome: 'not_configured' });
    expect(f.logs).toHaveLength(0); expect(f.row.status).toBe('active');
  });
  it('failed transaction sends nothing', async () => {
    const f = fixture(); f.setFailCommit();
    expect(await notifyComplimentaryGrant(actor, 2, 3, false, f.deps)).toEqual({ outcome: 'error' });
    expect(f.send).not.toHaveBeenCalled(); expect(f.logs).toHaveLength(0);
  });
  it.each([false, 'throw'])('an uncertain provider result %s retains the reservation and never retries blindly', async outcome => {
    const f = fixture();
    f.deps.send = vi.fn(async () => { if (outcome === 'throw') throw new Error('provider timeout'); return false; });
    expect(await notifyComplimentaryGrant(actor, 2, 3, false, f.deps)).toEqual({ outcome: 'provider_unconfirmed' });
    expect(await notifyComplimentaryGrant(actor, 2, 3, false, f.deps)).toEqual({ outcome: 'skipped_already_attempted' });
    expect(f.deps.send).toHaveBeenCalledTimes(1); expect(f.row.status).toBe('active');
  });
  it('provider acceptance remains truthful if the follow-up audit update fails; reservation still deduplicates', async () => {
    const f = fixture(); f.setFailAudit();
    expect(await notifyComplimentaryGrant(actor, 2, 3, false, f.deps)).toEqual({ outcome: 'provider_accepted' });
    expect(await notifyComplimentaryGrant(actor, 2, 3, false, f.deps)).toEqual({ outcome: 'skipped_already_attempted' });
    expect(f.logs[0].status).toBe('failed'); expect(f.send).toHaveBeenCalledTimes(1);
  });
  it('owner authorization precedes any DB or provider work', async () => {
    const f = fixture(); f.deps.getPool = vi.fn(f.deps.getPool);
    await expect(notifyComplimentaryGrant({ ...actor, openId: 'ordinary-admin', role: 'admin' }, 2, 3, false, f.deps)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(f.deps.getPool).not.toHaveBeenCalled(); expect(f.send).not.toHaveBeenCalled();
  });
});
