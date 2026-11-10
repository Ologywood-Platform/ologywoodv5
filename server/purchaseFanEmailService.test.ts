import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), getPool: vi.fn(), ensureFanEmailSchema: vi.fn() }));
vi.mock('./db', () => ({ getDb: mocks.getDb, getPool: mocks.getPool }));
vi.mock('./_core/env', () => ({ ENV: { cookieSecret: 'purchase-consent-test-only', baseUrl: 'https://example.test' } }));
vi.mock('./services/fanEmailSchemaService', () => ({ ensureFanEmailSchema: mocks.ensureFanEmailSchema }));

import {
  FAN_EMAIL_CONSENT_VERSION, hashFanEmail, revokeAllFanEmailConsentsForUser,
  setFanEmailConsent, withFanEmailUserLock,
} from './services/fanEmailConsentService';
import { followUser, unfollowUser } from './services/followService';
import { capturePurchaseFanEmailOptIn, createPurchaseFanEmailOptInMetadata } from './services/purchaseFanEmailService';

/** Real service SQL is interpreted in memory; no DB, Stripe, or email client runs. */
function fixture(options: { following?: boolean; emailVerified?: boolean; globallyBlocked?: boolean } = {}) {
  const state = {
    user: { id: 20, name: 'Buyer', email: 'buyer@example.test', emailVerified: options.emailVerified ?? true },
    following: options.following ?? false,
    consent: null as any,
    preference: { frequency: 'weekly', unsubscribedAt: null, fanUpdates: !options.globallyBlocked },
  };
  const timeline: string[] = [];
  let tail = Promise.resolve();
  let failGrant = false;
  let rejectWrite = false;
  const connections: any[] = [];
  const pool = {
    getConnection: vi.fn(async () => {
      let unlock!: () => void;
      let backup: typeof state;
      const prior = tail;
      tail = new Promise<void>(resolve => { unlock = resolve; });
      let locked = false;
      const connection = {
        execute: vi.fn(async (query: string, values: any[] = []) => {
          const sql = query.replace(/\s+/g, ' ').trim();
          if (sql === 'SET TRANSACTION ISOLATION LEVEL READ COMMITTED') return [[], []];
          if (sql === 'SELECT id FROM users WHERE id = ? FOR UPDATE') {
            await prior;
            locked = true;
            backup = structuredClone(state);
            timeline.push('lock');
            return [[{ id: 20 }], []];
          }
          if (!locked) throw new Error('SQL executed without recipient lock');
          timeline.push(sql);
          if (sql.startsWith('SELECT id, name, email')) return [[{ ...state.user }], []];
          if (sql.includes('FROM email_preferences')) return [[{ ...state.preference }], []];
          if (sql.startsWith('SELECT') && sql.includes('FROM fan_email_consents')) return [state.consent ? [{ ...state.consent }] : [], []];
          if (sql.startsWith('SELECT') && sql.includes('FROM follows')) return [state.following ? [{ id: 1 }] : [], []];
          if (sql.startsWith('INSERT INTO follows')) { state.following = true; return [{ affectedRows: 1 }, []]; }
          if (sql.startsWith('DELETE FROM follows')) { state.following = false; return [{ affectedRows: 1 }, []]; }
          if (sql.startsWith('INSERT INTO fan_email_consents')) {
            state.consent = {
              id: 1, followerUserId: values[0], creatorUserId: values[1],
              optIn: sql.includes('TRUE'), revision: sql.includes('FALSE, 0') ? 0 : values[2],
              consentVersion: sql.includes('FALSE, 0') ? values[2] : values[3],
              emailHash: sql.includes('FALSE, 0') ? values[3] : values[4],
            };
            return [{ affectedRows: 1 }, []];
          }
          if (sql.startsWith('UPDATE fan_email_consents')) {
            if (sql.includes('SET optIn = TRUE') && failGrant) throw new Error('mock consent write outage');
            if (sql.includes('SET optIn = TRUE') && rejectWrite) return [{ affectedRows: 0 }, []];
            if (sql.includes('revision = revision + 1')) {
              if (state.consent) { state.consent.optIn = false; state.consent.revision++; }
            } else {
              if (!state.consent) throw new Error('Missing fixture consent');
              state.consent.optIn = sql.includes('SET optIn = TRUE');
              state.consent.revision = values[0];
              state.consent.consentVersion = values[1];
              if (sql.includes('emailHash = ?')) state.consent.emailHash = values[2];
            }
            return [{ affectedRows: 1 }, []];
          }
          throw new Error(`Unmodeled SQL: ${sql}`);
        }),
        beginTransaction: vi.fn(async () => undefined),
        commit: vi.fn(async () => { timeline.push('commit'); }),
        rollback: vi.fn(async () => { if (backup!) Object.assign(state, backup); timeline.push('rollback'); }),
        release: vi.fn(() => { timeline.push('release'); unlock(); }),
      };
      connections.push(connection);
      return connection;
    }),
  };
  mocks.getPool.mockReturnValue(pool);
  const checkout = (purchaseId = 'merch:91') => createPurchaseFanEmailOptInMetadata({ creatorUserId: 10, buyerUserId: 20, optIn: true, purchaseId });
  const capture = (metadata: Record<string, string>, purchaseId = 'merch:91') => capturePurchaseFanEmailOptIn({ creatorUserId: 10, buyerUserId: 20, optIn: true, metadata, purchaseId });
  return { state, timeline, connections, checkout, capture, failGrant: () => { failGrant = true; }, recover: () => { failGrant = false; }, rejectWrite: () => { rejectWrite = true; } };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDb.mockResolvedValue({});
  mocks.ensureFanEmailSchema.mockResolvedValue(undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('checkout-bound purchase fan email consent', () => {
  it('opening checkout snapshots a verified address and revision but does not follow or grant', async () => {
    const f = fixture();
    const metadata = await f.checkout();
    expect(metadata.fanEmailOptIn).toBe('true');
    expect(metadata.fanEmailConsentToken.length).toBeLessThanOrEqual(500);
    const claim = JSON.parse(Buffer.from(metadata.fanEmailConsentToken.split('.')[0], 'base64url').toString());
    expect(claim).toMatchObject({ f: 20, c: 10, r: 0, e: hashFanEmail(f.state.user.email), d: FAN_EMAIL_CONSENT_VERSION, b: 'merch:91' });
    expect(claim.a).toMatch(/^[a-f0-9]{32}$/);
    expect(metadata.fanEmailConsentToken).not.toContain('@');
    expect(f.state.following).toBe(false);
    expect(f.state.consent).toMatchObject({ optIn: false, revision: 0 });
    expect(await f.capture(metadata)).toEqual({ captured: true });
    expect(f.state.following).toBe(true);
    expect(f.state.consent).toMatchObject({ optIn: true, revision: 1 });
    expect(f.connections.at(-1).commit).toHaveBeenCalledOnce();
  });

  it('checkout then explicit opt-out cannot be regranted by paid fulfillment', async () => {
    const f = fixture({ following: true });
    const metadata = await f.checkout();
    await setFanEmailConsent(20, 10, { optIn: false, expectedRevision: 0 });
    expect(await f.capture(metadata)).toEqual({ captured: false, reason: 'stale_snapshot' });
    expect(f.state.consent).toMatchObject({ optIn: false, revision: 1 });
  });

  it('first-time checkout then unfollow cannot recreate the artist follow', async () => {
    const f = fixture({ following: true });
    const metadata = await f.checkout();
    await unfollowUser(20, 10, 'artist');
    expect(await f.capture(metadata)).toEqual({ captured: false, reason: 'stale_snapshot' });
    expect(f.state.following).toBe(false);
  });

  it('follow and unfollow after first checkout still revoke its non-granted tombstone', async () => {
    const f = fixture();
    const metadata = await f.checkout();
    await followUser(20, 10, 'artist');
    await unfollowUser(20, 10, 'artist');
    expect(await f.capture(metadata)).toMatchObject({ captured: false, reason: 'stale_snapshot' });
    expect(f.state.following).toBe(false);
  });

  it.each(['email', 'verification', 'global'])('checkout then %s change fails before any follow/grant', async change => {
    const f = fixture();
    const metadata = await f.checkout();
    if (change === 'email') f.state.user.email = 'new-verified@example.test';
    if (change === 'verification') f.state.user.emailVerified = false;
    if (change === 'global') f.state.preference.fanUpdates = false;
    expect(await f.capture(metadata)).toMatchObject({ captured: false });
    expect(f.state.following).toBe(false);
    expect(f.state.consent.optIn).toBe(false);
  });

  it('observed global block consumes a pending action before a later global resubscribe', async () => {
    const f = fixture();
    const metadata = await f.checkout();
    f.state.preference.fanUpdates = false;
    expect(await f.capture(metadata)).toMatchObject({ captured: false, reason: 'globally_blocked' });
    f.state.preference.fanUpdates = true;
    expect(await f.capture(metadata)).toMatchObject({ captured: false, reason: 'stale_snapshot' });
    expect(f.state.following).toBe(false);
  });

  it('observed changed address consumes the action even if the original address returns', async () => {
    const f = fixture();
    const metadata = await f.checkout();
    const original = f.state.user.email;
    f.state.user.email = 'changed@example.test';
    await f.capture(metadata);
    f.state.user.email = original;
    expect(await f.capture(metadata)).toMatchObject({ captured: false, reason: 'stale_snapshot' });
    expect(f.state.following).toBe(false);
  });

  it('global deletion invalidates pending non-granted checkout snapshots too', async () => {
    const f = fixture();
    const metadata = await f.checkout();
    await withFanEmailUserLock(20, connection => revokeAllFanEmailConsentsForUser(20, connection));
    expect(await f.capture(metadata)).toMatchObject({ captured: false, reason: 'stale_snapshot' });
    expect(f.state.following).toBe(false);
  });

  it('paid event replays and concurrent capture consume one revision only', async () => {
    const f = fixture();
    const metadata = await f.checkout();
    const results = await Promise.all([f.capture(metadata), f.capture(metadata), f.capture(metadata)]);
    expect(results.filter(result => result.captured)).toHaveLength(1);
    expect(f.state.consent.revision).toBe(1);
    expect(await f.capture(metadata)).toMatchObject({ captured: false, reason: 'stale_snapshot' });
  });

  it('a delayed replay cannot override a later unsubscribe or fresh re-consent', async () => {
    const f = fixture();
    const old = await f.checkout();
    await f.capture(old);
    await setFanEmailConsent(20, 10, { optIn: false, expectedRevision: 1 });
    const fresh = await f.checkout('merch:92');
    expect(fresh.fanEmailConsentToken).not.toBe(old.fanEmailConsentToken);
    expect(await f.capture(fresh, 'merch:92')).toEqual({ captured: true });
    const revision = f.state.consent.revision;
    expect(await f.capture(old)).toMatchObject({ captured: false, reason: 'stale_snapshot' });
    expect(f.state.consent.revision).toBe(revision);
  });

  it('replay of the ORIGINAL snapshot safely recovers a transient write failure once', async () => {
    const f = fixture();
    const metadata = await f.checkout();
    f.failGrant();
    expect(await f.capture(metadata)).toMatchObject({ captured: false, reason: 'consent_unavailable' });
    f.recover();
    expect(await f.capture(metadata)).toEqual({ captured: true });
    expect(await f.capture(metadata)).toMatchObject({ captured: false, reason: 'stale_snapshot' });
  });

  it('recovery cannot override an opt-out made after the failed capture', async () => {
    const f = fixture();
    const metadata = await f.checkout();
    f.failGrant();
    await f.capture(metadata);
    await setFanEmailConsent(20, 10, { optIn: false, expectedRevision: 0 });
    f.recover();
    expect(await f.capture(metadata)).toMatchObject({ captured: false, reason: 'stale_snapshot' });
    expect(f.state.following).toBe(false);
  });

  it('checkout snapshot from an obsolete disclosure fails even with a valid signature', async () => {
    const f = fixture();
    const metadata = await f.checkout();
    const claim = JSON.parse(Buffer.from(metadata.fanEmailConsentToken.split('.')[0], 'base64url').toString());
    claim.d = 'previous-purchase-disclosure';
    const part = Buffer.from(JSON.stringify(claim)).toString('base64url');
    const signature = createHmac('sha256', process.env.JWT_SECRET || 'purchase-consent-test-only').update(part).digest('base64url');
    metadata.fanEmailConsentToken = `${part}.${signature}`;
    expect(await f.capture(metadata)).toEqual({ captured: false, reason: 'invalid_snapshot' });
    expect(f.state.following).toBe(false);
    expect(f.state.consent.revision).toBe(0);
  });

  it('a tampered checkout snapshot fails before acquiring a recipient lock', async () => {
    const f = fixture();
    const metadata = await f.checkout();
    const count = f.connections.length;
    metadata.fanEmailConsentToken += 'x';
    expect(await f.capture(metadata)).toEqual({ captured: false, reason: 'invalid_snapshot' });
    expect(f.connections).toHaveLength(count);
  });

  it('same token cannot be transferred to a different order, creator, or buyer', async () => {
    const f = fixture();
    const metadata = await f.checkout();
    expect(await f.capture(metadata, 'merch:92')).toMatchObject({ captured: false, reason: 'invalid_snapshot' });
    expect(await capturePurchaseFanEmailOptIn({ creatorUserId: 11, buyerUserId: 20, optIn: true, metadata, purchaseId: 'merch:91' })).toMatchObject({ captured: false, reason: 'invalid_snapshot' });
    expect(await capturePurchaseFanEmailOptIn({ creatorUserId: 10, buyerUserId: 21, optIn: true, metadata, purchaseId: 'merch:91' })).toMatchObject({ captured: false, reason: 'invalid_snapshot' });
    expect(f.state.following).toBe(false);
  });

  it('release snapshot capture requires the trusted actual cs identity and consumes once', async () => {
    const f = fixture();
    const metadata = await createPurchaseFanEmailOptInMetadata({ creatorUserId: 10, buyerUserId: 20, optIn: true });
    expect(await f.capture(metadata, 'release:payment_intent:pi_mock')).toMatchObject({ captured: false, reason: 'invalid_snapshot' });
    expect(await f.capture(metadata, 'release:cs_test_actual')).toEqual({ captured: true });
    expect(await f.capture(metadata, 'release:cs_test_actual')).toMatchObject({ captured: false, reason: 'stale_snapshot' });
  });

  it.each([false, true])('grant write failure (zero affected rows=%s) rolls back the optional follow', async zeroRows => {
    const f = fixture();
    const metadata = await f.checkout();
    zeroRows ? f.rejectWrite() : f.failGrant();
    expect(await f.capture(metadata)).toEqual({ captured: false, reason: 'consent_unavailable' });
    expect(f.state.following).toBe(false);
    expect(f.state.consent.optIn).toBe(false);
    expect(f.connections.at(-1).rollback).toHaveBeenCalledOnce();
  });

  it('snapshot storage outage disables only marketing rather than rejecting checkout', async () => {
    fixture();
    mocks.ensureFanEmailSchema.mockRejectedValueOnce(new Error('mock schema unavailable'));
    expect(await createPurchaseFanEmailOptInMetadata({ creatorUserId: 10, buyerUserId: 20, optIn: true })).toEqual({ fanEmailOptIn: 'false' });
  });

  it.each([
    { creatorUserId: 10, buyerUserId: null, optIn: true },
    { creatorUserId: null, buyerUserId: 20, optIn: true },
    { creatorUserId: 10, buyerUserId: 10, optIn: true },
    { creatorUserId: 10, buyerUserId: 20, optIn: false },
  ])('guests, unsupported creators, self and no-opt-in never reach storage: %j', async input => {
    fixture();
    expect(await createPurchaseFanEmailOptInMetadata(input)).toEqual({ fanEmailOptIn: 'false' });
    expect(await capturePurchaseFanEmailOptIn(input)).toMatchObject({ captured: false });
    expect(mocks.getPool).not.toHaveBeenCalled();
  });

  it.each([{ emailVerified: false }, { globallyBlocked: true }])('checkout refuses ineligible account %j without following', async options => {
    const f = fixture(options);
    expect(await f.checkout()).toEqual({ fanEmailOptIn: 'false' });
    expect(f.state.following).toBe(false);
    expect(f.state.consent).toBeNull();
  });

  it('old pending sessions without signed snapshots fail closed', async () => {
    fixture();
    expect(await capturePurchaseFanEmailOptIn({ creatorUserId: 10, buyerUserId: 20, optIn: true, metadata: { fanEmailOptIn: 'true' }, purchaseId: 'ticket:1' })).toEqual({ captured: false, reason: 'missing_snapshot' });
    expect(mocks.getPool).not.toHaveBeenCalled();
  });
});
