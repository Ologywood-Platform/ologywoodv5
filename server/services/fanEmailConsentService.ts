import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { getDb, getPool } from '../db';
import { ENV } from '../_core/env';
import { ensureFanEmailSchema } from './fanEmailSchemaService';

/** Bump whenever the fan-update permission language or scope changes. */
export const FAN_EMAIL_CONSENT_VERSION = 'fan-email-consent-v1';
export const FAN_EMAIL_UNSUBSCRIBE_SCOPE = 'creator_updates' as const;

export type FanEmailConsentState = {
  optedIn: boolean;
  revision: number;
  isFollowing: boolean;
  globallyBlocked: boolean;
  emailVerified: boolean;
};

export type EligibleFanEmailRecipient = {
  id: number;
  name: string;
  email: string;
  followedAt: Date;
  consentRevision: number;
};

/** mysql2 PromiseConnection-compatible shape deliberately shared with follows. */
export type FanEmailExecutor = {
  execute: (query: string, values?: unknown[]) => Promise<any>;
};

type FanUnsubscribeTokenPayload = {
  fanId: number;
  creatorId: number;
  revision: number;
  purpose: typeof FAN_EMAIL_UNSUBSCRIBE_SCOPE;
  emailHash: string;
  v: 1;
};

type ConsentRow = {
  id: number;
  followerUserId: number;
  creatorUserId: number;
  optIn: boolean | number;
  revision: number;
  consentVersion: string;
  emailHash: string | null;
};

type PreferenceRow = {
  frequency: 'daily' | 'weekly' | 'never';
  unsubscribedAt: Date | string | null;
  fanUpdates: boolean | number;
};

type UserRow = {
  id: number;
  name: string | null;
  email: string | null;
  emailVerified: boolean | number;
};

export class FanEmailConsentConflictError extends Error {
  constructor() {
    super('Your email-update preference changed elsewhere. Refresh and try again.');
    this.name = 'FanEmailConsentConflictError';
  }
}

export class FanEmailConsentEligibilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FanEmailConsentEligibilityError';
  }
}

function isTrue(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

function asRevision(value: unknown): number {
  const revision = Number(value);
  return Number.isSafeInteger(revision) && revision >= 0 ? revision : 0;
}

export function normalizeFanEmail(email: string | null | undefined): string | null {
  if (typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  return normalized || null;
}

export function isValidFanEmail(email: string | null | undefined): boolean {
  const normalized = normalizeFanEmail(email);
  return !!normalized && normalized.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalized);
}

export function hashFanEmail(email: string | null | undefined): string | null {
  const normalized = normalizeFanEmail(email);
  return normalized ? createHash('sha256').update(normalized, 'utf8').digest('hex') : null;
}

function getSigningSecret(): Buffer | null {
  const secret = process.env.JWT_SECRET || ENV.cookieSecret;
  return secret ? Buffer.from(secret, 'utf8') : null;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function hmac(payloadPart: string, secret: Buffer): string {
  return createHmac('sha256', secret).update(payloadPart, 'utf8').digest('base64url');
}

/**
 * HMAC-signed capability, not an identity credential. The signature, strict
 * scope, revision, and address hash must all match a current consent row.
 */
export function createFanUnsubscribeToken(input: Omit<FanUnsubscribeTokenPayload, 'purpose' | 'v'>): string {
  const secret = getSigningSecret();
  if (!secret) throw new Error('Fan unsubscribe tokens are temporarily unavailable');
  const payload: FanUnsubscribeTokenPayload = {
    fanId: input.fanId,
    creatorId: input.creatorId,
    revision: input.revision,
    emailHash: input.emailHash,
    purpose: FAN_EMAIL_UNSUBSCRIBE_SCOPE,
    v: 1,
  };
  if (!Number.isSafeInteger(payload.fanId) || payload.fanId < 1 ||
      !Number.isSafeInteger(payload.creatorId) || payload.creatorId < 1 ||
      !Number.isSafeInteger(payload.revision) || payload.revision < 1 ||
      !/^[a-f0-9]{64}$/u.test(payload.emailHash)) {
    throw new Error('Invalid fan unsubscribe token payload');
  }
  const payloadPart = encodeBase64Url(JSON.stringify(payload));
  return `${payloadPart}.${hmac(payloadPart, secret)}`;
}

/** Returns null for malformed, unsigned, wrong-purpose, or unsigned-secret tokens. */
export function verifyFanUnsubscribeToken(token: unknown): FanUnsubscribeTokenPayload | null {
  if (typeof token !== 'string' || token.length < 20 || token.length > 2048) return null;
  const [payloadPart, signature, ...extra] = token.split('.');
  const secret = getSigningSecret();
  if (!secret || !payloadPart || !signature || extra.length > 0 || !/^[A-Za-z0-9_-]+$/u.test(payloadPart) || !/^[A-Za-z0-9_-]+$/u.test(signature)) return null;
  const expected = Buffer.from(hmac(payloadPart, secret), 'utf8');
  const supplied = Buffer.from(signature, 'utf8');
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as Partial<FanUnsubscribeTokenPayload>;
    if (parsed.v !== 1 || parsed.purpose !== FAN_EMAIL_UNSUBSCRIBE_SCOPE ||
        !Number.isSafeInteger(parsed.fanId) || (parsed.fanId ?? 0) < 1 ||
        !Number.isSafeInteger(parsed.creatorId) || (parsed.creatorId ?? 0) < 1 ||
        !Number.isSafeInteger(parsed.revision) || (parsed.revision ?? 0) < 1 ||
        typeof parsed.emailHash !== 'string' || !/^[a-f0-9]{64}$/u.test(parsed.emailHash)) return null;
    return parsed as FanUnsubscribeTokenPayload;
  } catch {
    return null;
  }
}

async function getPoolOrThrow(): Promise<any> {
  await getDb();
  const pool = getPool();
  if (!pool) throw new Error('Fan email tools are temporarily unavailable');
  return pool;
}

async function selectRows<T>(executor: FanEmailExecutor, query: string, values: unknown[] = []): Promise<T[]> {
  const [rows] = await executor.execute(query, values);
  if (!Array.isArray(rows)) throw new Error('Unexpected fan email database response');
  return rows as T[];
}

/**
 * Serializes every consent/global-preference/follow mutation for a recipient.
 * The work callback receives the raw mysql2 connection inside an open READ
 * COMMITTED transaction, and must not commit or release it itself.
 */
export async function withFanEmailUserLock<T>(userId: number, work: (executor: any) => Promise<T>): Promise<T> {
  if (!Number.isSafeInteger(userId) || userId < 1) throw new Error('Invalid fan user');
  const pool = await getPoolOrThrow();
  const connection = await pool.getConnection();
  let started = false;
  try {
    await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await connection.beginTransaction();
    started = true;
    const [lockedUsers] = await connection.execute('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId]);
    if (!Array.isArray(lockedUsers) || lockedUsers.length !== 1) throw new Error('Fan user was not found');
    const value = await work(connection);
    await connection.commit();
    return value;
  } catch (error) {
    if (started) {
      try { await connection.rollback(); } catch { /* retain the original error */ }
    }
    throw error;
  } finally {
    connection.release();
  }
}

function preferenceBlocks(preference: PreferenceRow | undefined): boolean {
  // A missing preference row carries no known suppression; explicit scoped
  // consent is still required by every delivery query.
  if (!preference) return false;
  return preference.frequency === 'never' || !!preference.unsubscribedAt || !isTrue(preference.fanUpdates);
}

async function loadPreference(executor: FanEmailExecutor, userId: number, lock = false): Promise<PreferenceRow | undefined> {
  const rows = await selectRows<PreferenceRow>(executor,
    `SELECT frequency, unsubscribedAt, fanUpdates
       FROM email_preferences
      WHERE userId = ?
      LIMIT 1${lock ? ' FOR UPDATE' : ''}`,
    [userId],
  );
  return rows[0];
}

async function loadConsent(executor: FanEmailExecutor, followerUserId: number, creatorUserId: number, lock = false): Promise<ConsentRow | undefined> {
  const rows = await selectRows<ConsentRow>(executor,
    `SELECT id, followerUserId, creatorUserId, optIn, revision, consentVersion, emailHash
       FROM fan_email_consents
      WHERE followerUserId = ? AND creatorUserId = ?
      LIMIT 1${lock ? ' FOR UPDATE' : ''}`,
    [followerUserId, creatorUserId],
  );
  return rows[0];
}

async function isArtistFollow(executor: FanEmailExecutor, followerUserId: number, creatorUserId: number): Promise<boolean> {
  const rows = await selectRows<{ id: number }>(executor,
    `SELECT id FROM follows
      WHERE followerId = ? AND followingId = ? AND followingType = 'artist'
      LIMIT 1`,
    [followerUserId, creatorUserId],
  );
  return rows.length > 0;
}

function stateFromRows(user: UserRow | undefined, consent: ConsentRow | undefined, following: boolean, preference: PreferenceRow | undefined): FanEmailConsentState {
  const emailHash = hashFanEmail(user?.email);
  const consentIsCurrent = !!consent && isTrue(consent.optIn) &&
    consent.consentVersion === FAN_EMAIL_CONSENT_VERSION &&
    !!emailHash && consent.emailHash === emailHash;
  return {
    optedIn: consentIsCurrent,
    revision: asRevision(consent?.revision),
    isFollowing: following,
    globallyBlocked: preferenceBlocks(preference),
    emailVerified: isTrue(user?.emailVerified) && isValidFanEmail(user?.email),
  };
}

/** A revoke remains committed even if an optional state read subsequently fails. */
async function currentStateAfterRevocation(
  executor: FanEmailExecutor,
  user: UserRow,
  consent: ConsentRow,
  creatorUserId: number,
): Promise<FanEmailConsentState> {
  const [following, preference] = await Promise.allSettled([
    isArtistFollow(executor, user.id, creatorUserId),
    loadPreference(executor, user.id, true),
  ]);
  return stateFromRows(
    user,
    consent,
    following.status === 'fulfilled' ? following.value : false,
    preference.status === 'fulfilled'
      ? preference.value
      : { frequency: 'never', unsubscribedAt: null, fanUpdates: false },
  );
}

/** Read-only consent state. It never creates a consent or preference record. */
export async function getFanEmailConsent(followerUserId: number, creatorUserId: number): Promise<FanEmailConsentState> {
  const unavailable: FanEmailConsentState = { optedIn: false, revision: 0, isFollowing: false, globallyBlocked: true, emailVerified: false };
  if (!Number.isSafeInteger(followerUserId) || followerUserId < 1 || !Number.isSafeInteger(creatorUserId) || creatorUserId < 1) return unavailable;
  try {
    await ensureFanEmailSchema();
    const pool = await getPoolOrThrow();
    const [users, consents, preferences, follows] = await Promise.all([
      selectRows<UserRow>(pool, 'SELECT id, name, email, emailVerified FROM users WHERE id = ? LIMIT 1', [followerUserId]),
      loadConsent(pool, followerUserId, creatorUserId),
      loadPreference(pool, followerUserId),
      isArtistFollow(pool, followerUserId, creatorUserId),
    ]);
    if (!users[0]) return unavailable;
    return stateFromRows(users[0], consents, follows, preferences);
  } catch {
    // Source failure must never become a permissive recipient decision. A
    // generic error lets the UI retry instead of inaccurately saying "follow
    // first" while preserving no source details.
    throw new Error('Fan email preferences are temporarily unavailable');
  }
}

/**
 * Writes only one creator scope. optIn=true requires every send prerequisite;
 * optIn=false remains available even after email/follow/preference failures.
 */
export async function setFanEmailConsent(
  followerUserId: number,
  creatorUserId: number,
  input: { optIn: boolean; expectedRevision: number },
): Promise<FanEmailConsentState> {
  if (!Number.isSafeInteger(followerUserId) || followerUserId < 1 || !Number.isSafeInteger(creatorUserId) || creatorUserId < 1 ||
      !Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0) {
    throw new FanEmailConsentEligibilityError('Invalid consent request');
  }
  await ensureFanEmailSchema();
  return withFanEmailUserLock(followerUserId, async connection => {
    const user = (await selectRows<UserRow>(connection,
      'SELECT id, name, email, emailVerified FROM users WHERE id = ? LIMIT 1', [followerUserId]))[0];
    if (!user) throw new FanEmailConsentEligibilityError('Fan user was not found');
    const existing = await loadConsent(connection, followerUserId, creatorUserId, true);
    const currentRevision = asRevision(existing?.revision);
    if (currentRevision !== input.expectedRevision) throw new FanEmailConsentConflictError();

    const currentEmailHash = hashFanEmail(user.email);
    if (input.optIn) {
      if (!isTrue(user.emailVerified) || !isValidFanEmail(user.email) || !currentEmailHash) {
        throw new FanEmailConsentEligibilityError('Verify a valid email address before subscribing to creator updates.');
      }
      const [following, preference] = await Promise.all([
        isArtistFollow(connection, followerUserId, creatorUserId),
        loadPreference(connection, followerUserId, true),
      ]);
      if (!following) throw new FanEmailConsentEligibilityError('Follow this creator before subscribing to their updates.');
      if (preferenceBlocks(preference)) throw new FanEmailConsentEligibilityError('Your global email preferences currently block creator updates.');

      const nextRevision = currentRevision + 1;
      if (existing) {
        await connection.execute(
          `UPDATE fan_email_consents
              SET optIn = TRUE, revision = ?, consentedAt = NOW(), revokedAt = NULL,
                  consentVersion = ?, emailHash = ?
            WHERE id = ?`,
          [nextRevision, FAN_EMAIL_CONSENT_VERSION, currentEmailHash, existing.id],
        );
      } else {
        await connection.execute(
          `INSERT INTO fan_email_consents
            (followerUserId, creatorUserId, optIn, revision, consentedAt, consentVersion, emailHash)
           VALUES (?, ?, TRUE, ?, NOW(), ?, ?)`,
          [followerUserId, creatorUserId, nextRevision, FAN_EMAIL_CONSENT_VERSION, currentEmailHash],
        );
      }
      return { optedIn: true, revision: nextRevision, isFollowing: true, globallyBlocked: false, emailVerified: true };
    }

    // Revocation deliberately needs neither an active follow nor a working
    // preferences source. It never clears a global suppression.
    const nextRevision = currentRevision + 1;
    if (existing) {
      await connection.execute(
        `UPDATE fan_email_consents
            SET optIn = FALSE, revision = ?, revokedAt = NOW(),
                consentVersion = ?, emailHash = ?
          WHERE id = ?`,
        [nextRevision, FAN_EMAIL_CONSENT_VERSION, currentEmailHash, existing.id],
      );
    } else {
      await connection.execute(
        `INSERT INTO fan_email_consents
          (followerUserId, creatorUserId, optIn, revision, revokedAt, consentVersion, emailHash)
         VALUES (?, ?, FALSE, ?, NOW(), ?, ?)`,
        [followerUserId, creatorUserId, nextRevision, FAN_EMAIL_CONSENT_VERSION, currentEmailHash],
      );
    }
    return currentStateAfterRevocation(connection, user, {
      id: existing?.id ?? 0,
      followerUserId,
      creatorUserId,
      optIn: false,
      revision: nextRevision,
      consentVersion: FAN_EMAIL_CONSENT_VERSION,
      emailHash: currentEmailHash,
    }, creatorUserId);
  });
}

/**
 * Parent unfollow flows pass their already locked mysql2 transaction executor.
 * No record is created when none exists, so unfollow never backfills consent.
 */
export async function revokeFanEmailConsent(followerUserId: number, creatorUserId: number, executor?: any): Promise<void> {
  if (!Number.isSafeInteger(followerUserId) || followerUserId < 1 || !Number.isSafeInteger(creatorUserId) || creatorUserId < 1) return;
  if (!executor) {
    await ensureFanEmailSchema();
    await withFanEmailUserLock(followerUserId, async connection => revokeFanEmailConsent(followerUserId, creatorUserId, connection));
    return;
  }
  const existing = await loadConsent(executor as FanEmailExecutor, followerUserId, creatorUserId, true);
  if (!existing) return;
  await executor.execute(
    `UPDATE fan_email_consents
        SET optIn = FALSE, revision = ?, revokedAt = NOW(), consentVersion = ?
      WHERE id = ?`,
    [asRevision(existing.revision) + 1, FAN_EMAIL_CONSENT_VERSION, existing.id],
  );
}

/** Used only by preference deletion while its caller owns the recipient lock. */
export async function revokeAllFanEmailConsentsForUser(followerUserId: number, executor: any): Promise<void> {
  await executor.execute(
    `UPDATE fan_email_consents
        SET optIn = FALSE, revision = revision + 1, revokedAt = NOW(), consentVersion = ?
      WHERE followerUserId = ? AND optIn = TRUE`,
    [FAN_EMAIL_CONSENT_VERSION, followerUserId],
  );
}

const ELIGIBLE_RECIPIENT_SELECT = `
  SELECT u.id, u.name, u.email, f.followedAt, c.revision AS consentRevision
    FROM fan_email_consents c
    JOIN (
      SELECT followerId, followingId, MIN(createdAt) AS followedAt
        FROM follows
       WHERE followingType = 'artist'
       GROUP BY followerId, followingId
    ) f
      ON f.followerId = c.followerUserId
     AND f.followingId = c.creatorUserId
    JOIN users u ON u.id = c.followerUserId
    LEFT JOIN email_preferences p ON p.userId = u.id
   WHERE c.creatorUserId = ?
     AND c.optIn = TRUE
     AND c.consentVersion = ?
     AND c.emailHash = SHA2(LOWER(TRIM(u.email)), 256)
     AND u.emailVerified = TRUE
     AND u.email IS NOT NULL
     AND CHAR_LENGTH(TRIM(u.email)) BETWEEN 3 AND 320
     AND TRIM(u.email) REGEXP '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
     AND (p.userId IS NULL OR (p.frequency <> 'never' AND p.unsubscribedAt IS NULL AND p.fanUpdates = TRUE))`;

function normalizeRecipient(row: any): EligibleFanEmailRecipient | null {
  if (!row || !Number.isSafeInteger(Number(row.id)) || !isValidFanEmail(row.email)) return null;
  const followedAt = row.followedAt instanceof Date ? row.followedAt : new Date(row.followedAt);
  if (Number.isNaN(followedAt.getTime())) return null;
  const consentRevision = asRevision(row.consentRevision);
  if (consentRevision < 1) return null;
  return {
    id: Number(row.id),
    name: typeof row.name === 'string' && row.name.trim() ? row.name : 'Fan',
    email: String(row.email),
    followedAt,
    consentRevision,
  };
}

export async function getEligibleFanEmailRecipients(creatorUserId: number, limit = 100, offset = 0): Promise<EligibleFanEmailRecipient[]> {
  if (!Number.isSafeInteger(creatorUserId) || creatorUserId < 1) return [];
  const safeLimit = Math.max(1, Math.min(10_000, Math.floor(limit)));
  const safeOffset = Math.max(0, Math.floor(offset));
  try {
    await ensureFanEmailSchema();
    const pool = await getPoolOrThrow();
    const rows = await selectRows<any>(pool,
      `${ELIGIBLE_RECIPIENT_SELECT} ORDER BY f.followedAt ASC, u.id ASC LIMIT ? OFFSET ?`,
      [creatorUserId, FAN_EMAIL_CONSENT_VERSION, safeLimit, safeOffset],
    );
    // A malformed source row must never be made eligible by JS fallback logic.
    return rows.map(normalizeRecipient).filter((row): row is EligibleFanEmailRecipient => !!row);
  } catch {
    throw new Error('Eligible fan contacts are temporarily unavailable');
  }
}

export async function getEligibleFanEmailCount(creatorUserId: number): Promise<number> {
  if (!Number.isSafeInteger(creatorUserId) || creatorUserId < 1) return 0;
  try {
    await ensureFanEmailSchema();
    const pool = await getPoolOrThrow();
    const rows = await selectRows<{ count: number | string }>(pool,
      `SELECT COUNT(*) AS count FROM (${ELIGIBLE_RECIPIENT_SELECT}) eligible_fans`,
      [creatorUserId, FAN_EMAIL_CONSENT_VERSION],
    );
    const count = Number(rows[0]?.count ?? 0);
    return Number.isSafeInteger(count) && count >= 0 ? count : 0;
  } catch {
    throw new Error('Eligible fan contact count is temporarily unavailable');
  }
}

function browserUnsubscribeUrl(token: string): string {
  // ENV.baseUrl is authoritative in deployed environments. The fallback only
  // supports local/test processes where VITE_APP_ID was intentionally absent.
  let base = ENV.baseUrl;
  try { new URL(base); } catch { base = 'https://www.ologywood.com'; }
  const url = new URL('/unsubscribe', base);
  url.searchParams.set('fanToken', token);
  return url.toString();
}

/**
 * Locks the recipient user first, rechecks every delivery prerequisite on that
 * exact connection, and retains the lock through the bounded transport work.
 */
export async function withEligibleFanEmailRecipient<T>(
  creatorUserId: number,
  fanId: number,
  consentRevision: number,
  work: (recipient: EligibleFanEmailRecipient, unsubscribeUrl: string) => Promise<T>,
): Promise<{ eligible: boolean; value?: T }> {
  if (!Number.isSafeInteger(creatorUserId) || creatorUserId < 1 || !Number.isSafeInteger(fanId) || fanId < 1 ||
      !Number.isSafeInteger(consentRevision) || consentRevision < 1) return { eligible: false };
  await ensureFanEmailSchema();
  return withFanEmailUserLock(fanId, async connection => {
    const rows = await selectRows<any>(connection,
      `${ELIGIBLE_RECIPIENT_SELECT} AND u.id = ? AND c.revision = ? LIMIT 1 FOR UPDATE`,
      [creatorUserId, FAN_EMAIL_CONSENT_VERSION, fanId, consentRevision],
    );
    const recipient = normalizeRecipient(rows[0]);
    if (!recipient) return { eligible: false };
    const emailHash = hashFanEmail(recipient.email);
    if (!emailHash) return { eligible: false };
    const token = createFanUnsubscribeToken({ fanId, creatorId: creatorUserId, revision: recipient.consentRevision, emailHash });
    const value = await work(recipient, browserUnsubscribeUrl(token));
    return { eligible: true, value };
  });
}

/** A signed token must also match the current scoped consent revision and address. */
export async function getFanUnsubscribeStatus(token: unknown): Promise<{ valid: boolean; scope?: typeof FAN_EMAIL_UNSUBSCRIBE_SCOPE }> {
  const payload = verifyFanUnsubscribeToken(token);
  // Crucial: invalid anonymous tokens do not trigger the additive schema guard.
  if (!payload) return { valid: false };
  try {
    await ensureFanEmailSchema();
    const pool = await getPoolOrThrow();
    const rows = await selectRows<{ id: number }>(pool,
      `SELECT c.id
         FROM fan_email_consents c
         JOIN users u ON u.id = c.followerUserId
        WHERE c.followerUserId = ? AND c.creatorUserId = ? AND c.revision = ?
          AND c.optIn = TRUE AND c.consentVersion = ? AND c.emailHash = ?
          AND c.emailHash = SHA2(LOWER(TRIM(u.email)), 256)
        LIMIT 1`,
      [payload.fanId, payload.creatorId, payload.revision, FAN_EMAIL_CONSENT_VERSION, payload.emailHash],
    );
    return rows.length ? { valid: true, scope: FAN_EMAIL_UNSUBSCRIBE_SCOPE } : { valid: false };
  } catch {
    return { valid: false };
  }
}

/** One-click action: exact current revision only; replay/stale tokens cannot revoke re-consent. */
export async function unsubscribeFanByToken(token: unknown): Promise<boolean> {
  const payload = verifyFanUnsubscribeToken(token);
  // Never schema-migrate or look up a record for an invalid anonymous token.
  if (!payload) return false;
  try {
    await ensureFanEmailSchema();
    return withFanEmailUserLock(payload.fanId, async connection => {
      const rows = await selectRows<ConsentRow & { email: string | null }>(connection,
        `SELECT c.id, c.followerUserId, c.creatorUserId, c.optIn, c.revision, c.consentVersion, c.emailHash, u.email
           FROM fan_email_consents c
           JOIN users u ON u.id = c.followerUserId
          WHERE c.followerUserId = ? AND c.creatorUserId = ? AND c.revision = ?
            AND c.optIn = TRUE AND c.consentVersion = ? AND c.emailHash = ?
            AND c.emailHash = SHA2(LOWER(TRIM(u.email)), 256)
          LIMIT 1 FOR UPDATE`,
        [payload.fanId, payload.creatorId, payload.revision, FAN_EMAIL_CONSENT_VERSION, payload.emailHash],
      );
      const consent = rows[0];
      if (!consent) return false;
      await connection.execute(
        `UPDATE fan_email_consents
            SET optIn = FALSE, revision = ?, revokedAt = NOW(), consentVersion = ?
          WHERE id = ? AND revision = ? AND optIn = TRUE`,
        [payload.revision + 1, FAN_EMAIL_CONSENT_VERSION, consent.id, payload.revision],
      );
      return true;
    });
  } catch {
    return false;
  }
}
