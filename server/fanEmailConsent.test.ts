import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  getPool: vi.fn(),
  ensureFanEmailSchema: vi.fn(),
  getEmailPreferences: vi.fn(),
  createEmailPreferences: vi.fn(),
  updateEmailPreferences: vi.fn(),
  deleteEmailPreferences: vi.fn(),
  insertUnsubscribeFeedback: vi.fn(),
}));

vi.mock('./db', () => ({
  getDb: mocks.getDb,
  getPool: mocks.getPool,
  getEmailPreferences: mocks.getEmailPreferences,
  createEmailPreferences: mocks.createEmailPreferences,
  updateEmailPreferences: mocks.updateEmailPreferences,
  deleteEmailPreferences: mocks.deleteEmailPreferences,
  insertUnsubscribeFeedback: mocks.insertUnsubscribeFeedback,
}));
vi.mock('./services/fanEmailSchemaService', () => ({ ensureFanEmailSchema: mocks.ensureFanEmailSchema }));

import {
  FAN_EMAIL_CONSENT_VERSION,
  FanEmailConsentConflictError,
  createFanUnsubscribeToken,
  getEligibleFanEmailCount,
  getFanEmailConsent, hashFanEmail, FanEmailConsentEligibilityError,
  getEligibleFanEmailRecipients,
  setFanEmailConsent,
  verifyFanUnsubscribeToken,
  withEligibleFanEmailRecipient,
  withFanEmailUserLock,
} from './services/fanEmailConsentService';
import { emailPreferencesRouter } from './routers/emailPreferences';

const verifiedUser = { id: 7, name: 'Fan', email: 'fan@example.test', emailVerified: 1 };
const allowedPreference = { frequency: 'weekly', unsubscribedAt: null, fanUpdates: 1 };

function connectionWith(handler: (query: string, values?: unknown[]) => unknown): any {
  return {
    execute: vi.fn(async (query: string, values?: unknown[]) => [await handler(query, values), []]),
    beginTransaction: vi.fn(async () => undefined),
    commit: vi.fn(async () => undefined),
    rollback: vi.fn(async () => undefined),
    release: vi.fn(),
  };
}

beforeEach(() => {
  process.env.JWT_SECRET = 'fan-email-focused-test-secret';
  mocks.getDb.mockReset().mockResolvedValue({});
  mocks.getPool.mockReset();
  mocks.ensureFanEmailSchema.mockReset().mockResolvedValue(undefined);
  mocks.getEmailPreferences.mockReset();
  mocks.createEmailPreferences.mockReset();
  mocks.updateEmailPreferences.mockReset().mockResolvedValue({ userId: 7 });
  mocks.deleteEmailPreferences.mockReset();
  mocks.insertUnsubscribeFeedback.mockReset();
});

describe('fan email consent', () => {
  it('signs only scoped opaque claims and rejects tampering or a missing secret', () => {
    const token = createFanUnsubscribeToken({
      fanId: 7,
      creatorId: 9,
      revision: 4,
      emailHash: 'a'.repeat(64),
    });
    expect(token).not.toContain('@');
    expect(token).not.toContain('fan@example.test');
    expect(verifyFanUnsubscribeToken(token)).toEqual({
      fanId: 7,
      creatorId: 9,
      revision: 4,
      emailHash: 'a'.repeat(64),
      purpose: 'creator_updates',
      v: 1,
    });
    expect(verifyFanUnsubscribeToken(`${token}x`)).toBeNull();
    const saved = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    expect(verifyFanUnsubscribeToken(token)).toBeNull();
    process.env.JWT_SECRET = saved;
  });

  it('serializes an explicit opt-in on the recipient row and persists current version/address binding', async () => {
    const executed: Array<{ query: string; values?: unknown[] }> = [];
    const conn = connectionWith((query, values) => {
      executed.push({ query, values });
      if (query.includes('SELECT id FROM users')) return [{ id: 7 }];
      if (query.includes('SELECT id, name, email')) return [verifiedUser];
      if (query.includes('FROM fan_email_consents')) return [];
      if (query.includes('FROM follows')) return [{ id: 99 }];
      if (query.includes('FROM email_preferences')) return [allowedPreference];
      return [];
    });
    mocks.getPool.mockReturnValue({ getConnection: vi.fn().mockResolvedValue(conn) });

    const state = await setFanEmailConsent(7, 9, { optIn: true, expectedRevision: 0 });
    expect(state).toEqual({ optedIn: true, revision: 1, isFollowing: true, globallyBlocked: false, emailVerified: true });
    expect(conn.execute.mock.calls[1][0]).toContain('SELECT id FROM users WHERE id = ? FOR UPDATE');
    const insert = executed.find(call => call.query.includes('INSERT INTO fan_email_consents'));
    expect(insert?.values).toEqual([7, 9, 1, FAN_EMAIL_CONSENT_VERSION, expect.stringMatching(/^[a-f0-9]{64}$/)]);
    expect(conn.commit).toHaveBeenCalledOnce();
  });

  it('rejects stale UI revisions before any consent mutation', async () => {
    const conn = connectionWith(query => {
      if (query.includes('SELECT id FROM users')) return [{ id: 7 }];
      if (query.includes('SELECT id, name, email')) return [verifiedUser];
      if (query.includes('FROM fan_email_consents')) return [{
        id: 44, followerUserId: 7, creatorUserId: 9, optIn: 1,
        revision: 3, consentVersion: FAN_EMAIL_CONSENT_VERSION, emailHash: 'a'.repeat(64),
      }];
      return [];
    });
    mocks.getPool.mockReturnValue({ getConnection: vi.fn().mockResolvedValue(conn) });

    await expect(setFanEmailConsent(7, 9, { optIn: false, expectedRevision: 2 })).rejects.toBeInstanceOf(FanEmailConsentConflictError);
    expect(conn.execute.mock.calls.some((call: any[]) => String(call[0]).startsWith('UPDATE fan_email_consents'))).toBe(false);
    expect(conn.rollback).toHaveBeenCalledOnce();
  });

  it('keeps the user-row transaction lock through recipient work and rechecks the exact revision', async () => {
    const events: string[] = [];
    const conn = connectionWith(query => {
      if (query.startsWith('SELECT id FROM users')) return [{ id: 7 }];
      if (query.includes('FROM fan_email_consents')) return [{
        id: 7, name: 'Fan', email: 'fan@example.test', followedAt: new Date('2026-01-01T00:00:00Z'), consentRevision: 2,
      }];
      return [];
    });
    conn.commit.mockImplementation(async () => { events.push('commit'); });
    mocks.getPool.mockReturnValue({ getConnection: vi.fn().mockResolvedValue(conn) });

    const result = await withEligibleFanEmailRecipient(9, 7, 2, async (recipient, url) => {
      events.push('work');
      expect(recipient.consentRevision).toBe(2);
      expect(url).toContain('/unsubscribe?fanToken=');
      expect(conn.commit).not.toHaveBeenCalled();
      return 'accepted';
    });
    expect(result).toEqual({ eligible: true, value: 'accepted' });
    expect(events).toEqual(['work', 'commit']);
    const eligibilityQuery = conn.execute.mock.calls.find((call: any[]) => String(call[0]).includes('c.revision = ?'))?.[0];
    expect(eligibilityQuery).toContain('FOR UPDATE');
  });

  it('fails closed on recipient/count source failures and emits a deduplicating query', async () => {
    mocks.ensureFanEmailSchema.mockRejectedValueOnce(new Error('source unavailable')).mockRejectedValueOnce(new Error('source unavailable'));
    await expect(getEligibleFanEmailRecipients(9)).rejects.toThrow("temporarily unavailable");
    await expect(getEligibleFanEmailCount(9)).rejects.toThrow("temporarily unavailable");

    const pool = { execute: vi.fn(async () => [[], []]) };
    mocks.ensureFanEmailSchema.mockResolvedValue(undefined);
    mocks.getPool.mockReturnValue(pool);
    await getEligibleFanEmailRecipients(9, 10, 0);
    const query = pool.execute.mock.calls[0][0] as string;
    expect(query).toContain('MIN(createdAt) AS followedAt');
    expect(query).toContain('GROUP BY followerId, followingId');
    expect(query).toContain('c.consentVersion = ?');
    expect(query).toContain('p.fanUpdates = TRUE');
  });

  it('establishes READ COMMITTED and a users-row FOR UPDATE lock before caller work', async () => {
    const events: string[] = [];
    const conn = connectionWith(query => {
      events.push(query);
      return query.includes('SELECT id FROM users') ? [{ id: 7 }] : [];
    });
    conn.beginTransaction.mockImplementation(async () => { events.push('begin'); });
    mocks.getPool.mockReturnValue({ getConnection: vi.fn().mockResolvedValue(conn) });

    await withFanEmailUserLock(7, async () => {
      events.push('work');
      return 'done';
    });
    expect(events).toEqual([
      'SET TRANSACTION ISOLATION LEVEL READ COMMITTED',
      'begin',
      'SELECT id FROM users WHERE id = ? FOR UPDATE',
      'work',
    ]);
    expect(conn.commit).toHaveBeenCalledOnce();
  });

  it('transitions global fanUpdates with unsubscribe/resubscribe without creating scoped opt-ins', async () => {
    const caller = emailPreferencesRouter.createCaller({
      user: { id: 7, email: 'fan@example.test' },
      req: {},
      res: {},
    } as any);

    await caller.updatePreferences({ fanUpdates: false });
    expect(mocks.updateEmailPreferences).toHaveBeenLastCalledWith(7, { fanUpdates: false });

    await caller.unsubscribeAll();
    expect(mocks.updateEmailPreferences).toHaveBeenLastCalledWith(7, expect.objectContaining({
      frequency: 'never',
      fanUpdates: false,
    }));

    await caller.resubscribe();
    expect(mocks.updateEmailPreferences).toHaveBeenLastCalledWith(7, expect.objectContaining({
      frequency: 'weekly',
      fanUpdates: true,
    }));
    // These global category transitions never call the creator-specific writer.
    expect(mocks.getPool).not.toHaveBeenCalled();
  });
});

function consentFixture(options: { user?: any; consent?: any; preference?: any; following?: boolean; preferenceFailure?: boolean } = {}) {
  const user = options.user ?? verifiedUser;
  const conn = connectionWith(query => {
    if (query.includes('SELECT id FROM users')) return [{ id: 7 }];
    if (query.includes('SELECT id, name, email')) return [user];
    if (query.includes('FROM fan_email_consents')) return options.consent ? [options.consent] : [];
    if (query.includes('FROM follows')) return options.following === false ? [] : [{ id: 99 }];
    if (query.includes('FROM email_preferences')) {
      if (options.preferenceFailure) throw new Error('Preference source failure');
      return options.preference === null ? [] : [options.preference ?? allowedPreference];
    }
    return [];
  });
  mocks.getPool.mockReturnValue({ execute: conn.execute, getConnection: vi.fn().mockResolvedValue(conn) });
  return conn;
}

const currentConsent = () => ({ id: 44, followerUserId: 7, creatorUserId: 9, optIn: 1, revision: 4, consentVersion: FAN_EMAIL_CONSENT_VERSION, emailHash: hashFanEmail(verifiedUser.email) });

describe('Consent prerequisites and recovery', () => {
  it('legacy followers with no consent remain opted out, and reading creates no records', async () => {
    const conn = consentFixture();
    expect(await getFanEmailConsent(7, 9)).toMatchObject({ optedIn: false, revision: 0, isFollowing: true });
    expect(conn.execute.mock.calls.some(([sql]: any) => /^(INSERT|UPDATE|DELETE)/.test(sql))).toBe(false);
  });
  it.each([
    { ...verifiedUser, emailVerified: 0 },
    { ...verifiedUser, email: 'invalid-address' },
    { ...verifiedUser, email: '' },
  ])('rejects explicit opt-in for unverified/invalid address %j', async user => {
    const conn = consentFixture({ user });
    await expect(setFanEmailConsent(7, 9, { optIn: true, expectedRevision: 0 })).rejects.toBeInstanceOf(FanEmailConsentEligibilityError);
    expect(conn.execute.mock.calls.some(([sql]: any) => /^(INSERT|UPDATE)/.test(sql))).toBe(false);
    expect(conn.rollback).toHaveBeenCalledOnce();
  });
  it.each([
    { ...allowedPreference, frequency: 'never' },
    { ...allowedPreference, unsubscribedAt: new Date('2026-10-17T00:00:00Z') },
    { ...allowedPreference, fanUpdates: false },
  ])('honors every existing global suppression %j', async preference => {
    const conn = consentFixture({ preference });
    await expect(setFanEmailConsent(7, 9, { optIn: true, expectedRevision: 0 })).rejects.toBeInstanceOf(FanEmailConsentEligibilityError);
    expect(conn.execute.mock.calls.some(([sql]: any) => /^(INSERT|UPDATE)/.test(sql))).toBe(false);
  });
  it('rejects creator opt-in without a current artist follow', async () => {
    consentFixture({ following: false });
    await expect(setFanEmailConsent(7, 9, { optIn: true, expectedRevision: 0 })).rejects.toThrow('Follow this creator');
  });
  it('missing global preference rows do not themselves grant any creator consent', async () => {
    consentFixture({ preference: null });
    expect(await getFanEmailConsent(7, 9)).toMatchObject({ optedIn: false, globallyBlocked: false });
  });
  it('a changed email address invalidates old permission rather than transferring it', async () => {
    consentFixture({ consent: currentConsent(), user: { ...verifiedUser, email: 'new@example.test' } });
    expect(await getFanEmailConsent(7, 9)).toMatchObject({ optedIn: false, revision: 4 });
  });
  it('old disclosure versions never remain current opt-in', async () => {
    consentFixture({ consent: { ...currentConsent(), consentVersion: 'old-version' } });
    expect(await getFanEmailConsent(7, 9)).toMatchObject({ optedIn: false });
  });
  it('read outages produce a retryable error rather than permissive or invented state', async () => {
    mocks.ensureFanEmailSchema.mockRejectedValue(new Error('Unavailable'));
    await expect(getFanEmailConsent(7, 9)).rejects.toThrow('temporarily unavailable');
  });
  it('revocation preserves the current follow and global block instead of clearing them', async () => {
    const conn = consentFixture({ consent: currentConsent(), preference: { ...allowedPreference, fanUpdates: false } });
    expect(await setFanEmailConsent(7, 9, { optIn: false, expectedRevision: 4 })).toMatchObject({ optedIn: false, revision: 5, isFollowing: true, globallyBlocked: true });
    expect(conn.execute.mock.calls.some(([sql]: any) => String(sql).startsWith('UPDATE email_preferences'))).toBe(false);
  });
  it('revocation remains committed if the optional global state read is unavailable', async () => {
    const conn = consentFixture({ consent: currentConsent(), preferenceFailure: true });
    expect(await setFanEmailConsent(7, 9, { optIn: false, expectedRevision: 4 })).toMatchObject({ optedIn: false, revision: 5, globallyBlocked: true });
    expect(conn.commit).toHaveBeenCalledOnce(); expect(conn.rollback).not.toHaveBeenCalled();
  });
  it('missing recipient rows prevent locked delivery work from running', async () => {
    const conn = connectionWith(query => query.startsWith('SELECT id FROM users') ? [] : []);
    mocks.getPool.mockReturnValue({ getConnection: vi.fn().mockResolvedValue(conn) });
    const work = vi.fn();
    await expect(withEligibleFanEmailRecipient(9, 7, 4, work)).rejects.toThrow('not found');
    expect(work).not.toHaveBeenCalled(); expect(conn.rollback).toHaveBeenCalledOnce(); expect(conn.release).toHaveBeenCalledOnce();
  });
  it('rolls back and releases the shared recipient lock when bounded provider work throws', async () => {
    const conn = connectionWith(query => query.startsWith('SELECT id FROM users') ? [{ id: 7 }] : query.includes('FROM fan_email_consents') ? [{ id: 7, name: 'Fan', email: verifiedUser.email, followedAt: new Date('2026-10-17T00:00:00Z'), consentRevision: 4 }] : []);
    mocks.getPool.mockReturnValue({ getConnection: vi.fn().mockResolvedValue(conn) });
    await expect(withEligibleFanEmailRecipient(9, 7, 4, async () => { throw new Error('Provider timeout'); })).rejects.toThrow('Provider timeout');
    expect(conn.rollback).toHaveBeenCalledOnce(); expect(conn.commit).not.toHaveBeenCalled(); expect(conn.release).toHaveBeenCalledOnce();
  });
  it.each(['updatePreferences', 'unsubscribeAll', 'resubscribe'])('%s cannot report successful persistence after an unavailable result', async procedure => {
    mocks.updateEmailPreferences.mockResolvedValue(null);
    const caller = emailPreferencesRouter.createCaller({ user: { id: 7 }, req: {}, res: {} } as any);
    await expect(procedure === 'updatePreferences' ? caller.updatePreferences({ fanUpdates: false }) : procedure === 'unsubscribeAll' ? caller.unsubscribeAll() : caller.resubscribe()).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });
  it('does not manufacture default preferences when both read and creation are unavailable', async () => {
    mocks.getEmailPreferences.mockResolvedValue(null); mocks.createEmailPreferences.mockResolvedValue(null);
    await expect(emailPreferencesRouter.createCaller({ user: { id: 7 }, req: {}, res: {} } as any).getPreferences()).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });
});
