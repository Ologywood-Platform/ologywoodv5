import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { appendFile, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { MediaUploadPurpose, MediaUploadResult, MediaUploadState, MediaUploadStatus } from '../../shared/mediaUpload';
import { MEDIA_UPLOAD_CHUNK_BYTES, MEDIA_UPLOAD_LIMITS, MEDIA_UPLOAD_PURPOSES, MEDIA_UPLOAD_TTL_MS } from '../../shared/mediaUpload';
import { clipReleasePreviewFile, signPreviewReference } from './releasePreviewMedia';
import { prepareContentReleaseCover } from './contentReleaseCoverService';
import { storageGet, storagePut } from '../storage';
import { ensureMediaUploadSchema } from './mediaUploadSchemaService';
import { MUSIC_RELEASE_PUBLIC_ORIGIN } from '../../shared/musicReleaseShare';
import { resolveOwnerSubscription } from './ownerSubscriptionAccess';
import { resolveComplimentarySubscription } from './complimentaryAccessResolution';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_ATTEMPTS = 3;
const LEASE_MS = 240_000;
const PROCESS_BUDGET_MS = 100_000;
const STORAGE_TIMEOUT_MS = 20_000;
const AUDIO_MIME_TYPES = new Set(['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac', 'audio/aac', 'audio/mp4', 'audio/x-m4a']);
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type SqlConnection = {
  execute: (statement: string, values?: readonly unknown[]) => Promise<[any, any]>;
  beginTransaction: () => Promise<void>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  release: () => void;
};
type SqlPool = { getConnection: () => Promise<SqlConnection> };
type StorageOptions = { signal?: AbortSignal };
type StoragePort = {
  put: (key: string, data: Buffer | Uint8Array | string, mime: string, options?: StorageOptions) => Promise<{ key: string; url: string }>;
  get: (key: string, options?: StorageOptions) => Promise<{ key: string; url: string }>;
};

export type AuthenticatedMediaUser = { id: number; role?: string; openId?: string | null; email?: string | null; emailVerified?: boolean };
export type MediaUploadStartInput = {
  requestId: string;
  purpose: MediaUploadPurpose;
  releaseId?: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
};
type UploadRow = {
  id: string; ownerUserId: number | string; requestId: string; fingerprint: string; storageNonce: string; purpose: MediaUploadPurpose;
  releaseId: number | string | null; fileName: string; mimeType: string; fileSizeBytes: number | string;
  chunkBytes: number | string; chunkCount: number | string; state: MediaUploadState; attempts: number | string;
  leaseToken: string | null; leaseExpiresAt: unknown; expiresAt: unknown; result: unknown; error: string | null;
};
type ReceiptRow = { chunkIndex: number | string; byteSize: number | string; sha256: string };
type Claim = { id: string; ownerUserId: number; storageNonce: string; purpose: MediaUploadPurpose; mimeType: string; fileSizeBytes: number; chunkCount: number; fileName: string; leaseToken: string; attempts: number; chunkHashes: string[] };

export class MediaUploadError extends Error {
  constructor(public readonly status: 400 | 401 | 403 | 409 | 413 | 429 | 500 | 503 | 504, public readonly code: string, message: string) {
    super(message);
    this.name = 'MediaUploadError';
  }
}

const fail = (status: MediaUploadError['status'], code: string, message: string): never => { throw new MediaUploadError(status, code, message); };
const unavailable = (): never => fail(503, 'UPLOAD_UNAVAILABLE', 'Media uploads are temporarily unavailable.');
const notFound = (): never => fail(403, 'UPLOAD_FORBIDDEN', 'You do not have access to this upload.');
const conflict = (): never => fail(409, 'UPLOAD_CONFLICT', 'This upload request conflicts with the existing upload.');
const invalid = (message = 'Invalid media upload request.'): never => fail(400, 'INVALID_UPLOAD', message);
const positiveInteger = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0;
const asDateMs = (value: unknown): number => {
  const time = value instanceof Date ? value.getTime() : new Date(String(value)).getTime();
  return Number.isFinite(time) ? time : 0;
};
const stateSet = new Set<MediaUploadState>(['uploading', 'queued', 'processing', 'done', 'failed']);

function rows(result: [any, any]): any[] {
  if (!Array.isArray(result[0])) unavailable();
  return result[0];
}
function parseResult(value: unknown): MediaUploadResult | undefined {
  if (!value) return undefined;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as MediaUploadResult : undefined;
  } catch { return undefined; }
}
function toStatus(row: UploadRow, receiptRows: ReceiptRow[] = []): MediaUploadStatus {
  const state = String(row.state) as MediaUploadState;
  if (!stateSet.has(state)) unavailable();
  const chunkCount = Number(row.chunkCount);
  const chunkBytes = Number(row.chunkBytes);
  const size = Number(row.fileSizeBytes);
  if (!positiveInteger(chunkCount) || chunkBytes !== MEDIA_UPLOAD_CHUNK_BYTES || !positiveInteger(size)) unavailable();
  const receivedChunks = receiptRows.map(receipt => Number(receipt.chunkIndex)).filter(index => Number.isSafeInteger(index)).sort((a, b) => a - b);
  const result = parseResult(row.result);
  return {
    id: String(row.id), state, receivedChunks, chunkBytes, chunkCount,
    expiresAt: asDateMs(row.expiresAt),
    ...(result ? { result } : {}),
    ...(state === 'failed' && row.error ? { error: String(row.error) } : {}),
  };
}
function canonicalFingerprint(input: MediaUploadStartInput): string {
  return createHash('sha256').update(JSON.stringify({
    purpose: input.purpose, releaseId: input.releaseId ?? null, fileName: input.fileName,
    mimeType: input.mimeType, fileSize: input.fileSize,
  })).digest('hex');
}
function validateStart(input: MediaUploadStartInput): void {
  if (!UUID.test(input.requestId) || !(MEDIA_UPLOAD_PURPOSES as readonly string[]).includes(input.purpose)) invalid();
  if (!positiveInteger(input.fileSize) || input.fileSize > MEDIA_UPLOAD_LIMITS[input.purpose]) fail(413, 'FILE_TOO_LARGE', 'This file is too large for this upload.');
  if (typeof input.fileName !== 'string' || !input.fileName.trim() || input.fileName.length > 255 || /[\u0000-\u001f\\/]/.test(input.fileName)) invalid();
  if (typeof input.mimeType !== 'string' || input.mimeType.length > 100) invalid();
  if (input.releaseId !== undefined && !positiveInteger(input.releaseId)) invalid();
  if ((input.purpose === 'content-preview' && !(AUDIO_MIME_TYPES.has(input.mimeType) || ['video/mp4', 'video/quicktime', 'video/webm'].includes(input.mimeType))) ||
      ((input.purpose === 'content-cover' || input.purpose === 'music-cover') && !IMAGE_MIME_TYPES.has(input.mimeType)) ||
      (input.purpose === 'music-audio' && !AUDIO_MIME_TYPES.has(input.mimeType))) invalid('Unsupported media type.');
}
function chunkSizeFor(row: Pick<UploadRow, 'fileSizeBytes' | 'chunkCount' | 'chunkBytes'>, index: number): number {
  const size = Number(row.fileSizeBytes); const count = Number(row.chunkCount); const chunkBytes = Number(row.chunkBytes);
  if (!Number.isSafeInteger(index) || index < 0 || index >= count) invalid('Invalid chunk index.');
  return index === count - 1 ? size - chunkBytes * (count - 1) : chunkBytes;
}
function privateChunkKey(ownerUserId: number, storageNonce: string, index: number): string {
  return `media-uploads/private/${ownerUserId}/${storageNonce}/chunks/${index}`;
}
function trustedStorageUrl(value: string, expectedKey: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return false;
    const host = url.hostname.toLowerCase();
    const firstParty = url.origin === MUSIC_RELEASE_PUBLIC_ORIGIN;
    if (!firstParty && !host.endsWith('.cloudfront.net') && !host.endsWith('.manuscdn.com')) return false;
    const pathname = decodeURIComponent(url.pathname);
    if (firstParty && !pathname.startsWith('/manus-storage/')) return false;
    return pathname.endsWith(`/${expectedKey}`);
  } catch { return false; }
}
function storageSignal(deadline: AbortSignal, deadlineAt: number): AbortSignal {
  const remaining = deadlineAt - Date.now();
  if (remaining <= 0) throw new MediaUploadError(504, 'PROCESS_TIMEOUT', 'Media processing timed out.');
  return AbortSignal.any([deadline, AbortSignal.timeout(Math.min(STORAGE_TIMEOUT_MS, remaining))]);
}
function safeError(error: unknown): { permanent: boolean; message: string } {
  if (error instanceof MediaUploadError && (error.status === 400 || error.status === 413)) return { permanent: true, message: 'This media could not be processed.' };
  const code = (error as { code?: unknown })?.code;
  if (code === 'BAD_REQUEST') return { permanent: true, message: 'This media could not be processed.' };
  return { permanent: false, message: 'Media processing is temporarily unavailable.' };
}

let processActive = false;

export type MediaUploadServiceOptions = {
  pool?: () => Promise<SqlPool>;
  ensureSchema?: () => Promise<void>;
  storage?: StoragePort;
  /** Allows fully mocked tests to verify no DB authorization reads happen after failure. */
  authorizeStart?: (connection: SqlConnection, user: AuthenticatedMediaUser, input: MediaUploadStartInput) => Promise<void>;
  clipPreview?: typeof clipReleasePreviewFile;
  prepareCover?: typeof prepareContentReleaseCover;
  signPreview?: typeof signPreviewReference;
  fetchImpl?: typeof fetch;
  now?: () => number;
};

export class MediaUploadService {
  private readonly storage: StoragePort;
  private readonly clipPreview: typeof clipReleasePreviewFile;
  private readonly prepareCover: typeof prepareContentReleaseCover;
  private readonly signPreview: typeof signPreviewReference;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  constructor(private readonly options: MediaUploadServiceOptions = {}) {
    this.storage = options.storage ?? { put: storagePut, get: storageGet };
    this.clipPreview = options.clipPreview ?? clipReleasePreviewFile;
    this.prepareCover = options.prepareCover ?? prepareContentReleaseCover;
    this.signPreview = options.signPreview ?? signPreviewReference;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? Date.now;
  }

  private async pool(): Promise<SqlPool> {
    if (this.options.pool) return this.options.pool();
    const db = await import('../db');
    if (!db.getPool()) await db.getDb();
    const pool = db.getPool();
    if (!pool) unavailable();
    return pool as unknown as SqlPool;
  }
  private async ensureSchema(): Promise<void> {
    if (this.options.ensureSchema) return this.options.ensureSchema();
    const dbModule = await import('../db');
    const database = await dbModule.getDb();
    if (!database) unavailable();
    await ensureMediaUploadSchema(database as Parameters<typeof ensureMediaUploadSchema>[0]);
  }
  private async withConnection<T>(work: (connection: SqlConnection) => Promise<T>): Promise<T> {
    const connection = await (await this.pool()).getConnection();
    try { return await work(connection); } finally { connection.release(); }
  }
  private async transaction<T>(connection: SqlConnection, work: () => Promise<T>): Promise<T> {
    await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await connection.beginTransaction();
    try { const value = await work(); await connection.commit(); return value; }
    catch (error) { await connection.rollback().catch(() => undefined); throw error; }
  }
  private async getOwnedRow(connection: SqlConnection, ownerUserId: number, id: string, lock = false): Promise<UploadRow> {
    if (!UUID.test(id)) invalid();
    const found = rows(await connection.execute(
      `SELECT * FROM media_upload_jobs WHERE id=? AND ownerUserId=? LIMIT 1${lock ? ' FOR UPDATE' : ''}`,
      [id, ownerUserId],
    ))[0] as UploadRow | undefined;
    if (!found) notFound();
    return found!;
  }
  private async receiptRows(connection: SqlConnection, id: string, lock = false): Promise<ReceiptRow[]> {
    return rows(await connection.execute(
      `SELECT chunkIndex,byteSize,sha256 FROM media_upload_chunk_receipts WHERE uploadId=? ORDER BY chunkIndex ASC${lock ? ' FOR UPDATE' : ''}`,
      [id],
    )) as ReceiptRow[];
  }
  private startInputFor(row: UploadRow): MediaUploadStartInput {
    return {
      requestId: String(row.requestId), purpose: row.purpose,
      ...(row.releaseId == null ? {} : { releaseId: Number(row.releaseId) }),
      fileName: String(row.fileName), mimeType: String(row.mimeType), fileSize: Number(row.fileSizeBytes),
    };
  }
  /** Every state mutation repeats exact profile, release, and plan authorization. */
  private async authorizeExisting(connection: SqlConnection, user: AuthenticatedMediaUser, row: UploadRow): Promise<void> {
    await (this.options.authorizeStart ?? this.defaultAuthorizeStart.bind(this))(connection, user, this.startInputFor(row));
  }
  private async assertCreateQuota(connection: SqlConnection, ownerUserId: number): Promise<void> {
    const now = new Date(this.now());
    const active = rows(await connection.execute(
      "SELECT id FROM media_upload_jobs WHERE ownerUserId=? AND expiresAt>? AND state IN ('uploading','queued','processing') FOR UPDATE",
      [ownerUserId, now],
    ));
    if (active.length >= 3) fail(429, 'UPLOAD_SESSION_LIMIT', 'Too many active uploads. Complete or retry an existing upload.');
    const recent = rows(await connection.execute(
      'SELECT id FROM media_upload_jobs WHERE ownerUserId=? AND createdAt>=? FOR UPDATE',
      [ownerUserId, new Date(this.now() - 60 * 60 * 1000)],
    ));
    if (recent.length >= 30) fail(429, 'UPLOAD_RATE_LIMIT', 'Too many upload sessions were created. Please try again later.');
  }

  /** The owner profile is always actor-owned. Admin/team roles never bypass this. */
  private async defaultAuthorizeStart(connection: SqlConnection, user: AuthenticatedMediaUser, input: MediaUploadStartInput): Promise<void> {
    if (!positiveInteger(user.id) || (user.role !== 'artist' && user.role !== 'admin')) fail(403, 'CREATOR_REQUIRED', 'Creator access is required.');
    // Take the sole principal lock first. Any future multi-owner operation must sort IDs here.
    const userRows = rows(await connection.execute('SELECT id FROM users WHERE id=? FOR UPDATE', [user.id]));
    if (!userRows.length) notFound();
    const profile = rows(await connection.execute('SELECT id,userId,artistName FROM artist_profiles WHERE userId=? LIMIT 1 FOR UPDATE', [user.id]))[0] as { id: number | string; userId: number | string; artistName: string | null } | undefined;
    const memberships = rows(await connection.execute("SELECT id FROM artist_team_members WHERE userId=? AND teamRole <> 'owner' LIMIT 1 FOR UPDATE", [user.id]));
    const profileId = Number(profile?.id);
    if (!profile || Number(profile.userId) !== user.id || memberships.length || /team member/i.test(String(profile.artistName ?? '')) || !positiveInteger(profileId)) {
      fail(403, 'PROFILE_OWNER_REQUIRED', 'Only the creator profile owner can upload media.');
    }
    if (input.releaseId !== undefined) {
      const table = input.purpose.startsWith('music-') ? 'artist_releases' : 'releases';
      const sql = table === 'artist_releases'
        ? 'SELECT id FROM artist_releases WHERE id=? AND artistId=? LIMIT 1 FOR UPDATE'
        : 'SELECT id FROM releases WHERE id=? AND artistProfileId=? AND userId=? LIMIT 1 FOR UPDATE';
      const values = table === 'artist_releases' ? [input.releaseId, profileId] : [input.releaseId, profileId, user.id];
      if (!rows(await connection.execute(sql, values)).length) notFound();
      return;
    }
    // Preserve effective owner/grant entitlement rules while keeping every read
    // in this transaction: a plan change cannot race a newly created session.
    const billing = rows(await connection.execute('SELECT * FROM user_subscriptions WHERE userId=? LIMIT 1 FOR UPDATE', [user.id]))[0] ?? null;
    const grant = rows(await connection.execute('SELECT * FROM complimentary_access_grants WHERE userId=? LIMIT 1 FOR UPDATE', [user.id]))[0] ?? null;
    const ownerRecord = rows(await connection.execute('SELECT id,openId,email,emailVerified FROM users WHERE id=? LIMIT 1 FOR UPDATE', [user.id]))[0] ?? null;
    const ownerSubscription = resolveOwnerSubscription(ownerRecord ? { id: Number(ownerRecord.id), openId: ownerRecord.openId ?? null, email: ownerRecord.email ?? null, emailVerified: ownerRecord.emailVerified === true || ownerRecord.emailVerified === 1 || ownerRecord.emailVerified === '1' } : null, billing);
    const subscription = resolveComplimentarySubscription(user.id, ownerSubscription, grant, new Date(this.now()));
    const tier = subscription?.tier ?? 'free';
    if (input.purpose.startsWith('music-')) {
      if (!['starter', 'professional', 'enterprise'].includes(tier)) fail(403, 'PLAN_REQUIRED', 'Upgrade to Starter or Professional to create releases.');
      if (tier === 'starter') {
        const releaseRows = rows(await connection.execute("SELECT id FROM artist_releases WHERE artistId=? AND status IN ('draft','published') FOR UPDATE", [profileId]));
        if (releaseRows.length >= 2) fail(403, 'RELEASE_LIMIT', 'Starter plan is limited to 2 releases.');
      }
    } else {
      if (tier === 'free') fail(403, 'PLAN_REQUIRED', 'Content Releases require Starter or higher.');
      if (tier === 'starter') {
        const releaseRows = rows(await connection.execute('SELECT id FROM releases WHERE userId=? FOR UPDATE', [user.id]));
        if (releaseRows.length >= 2) fail(403, 'RELEASE_LIMIT', 'Starter plan is limited to 2 releases.');
      }
    }
  }

  async start(user: AuthenticatedMediaUser, input: MediaUploadStartInput): Promise<MediaUploadStatus> {
    validateStart(input);
    await this.ensureSchema();
    return this.withConnection(connection => this.transaction(connection, async () => {
      await (this.options.authorizeStart ?? this.defaultAuthorizeStart.bind(this))(connection, user, input);
      const fingerprint = canonicalFingerprint(input);
      const existing = rows(await connection.execute('SELECT * FROM media_upload_jobs WHERE ownerUserId=? AND requestId=? LIMIT 1 FOR UPDATE', [user.id, input.requestId]))[0] as UploadRow | undefined;
      if (existing) {
        if (existing.fingerprint !== fingerprint) conflict();
        return toStatus(existing, await this.receiptRows(connection, existing.id));
      }
      const collidingId = rows(await connection.execute('SELECT id FROM media_upload_jobs WHERE id=? LIMIT 1 FOR UPDATE', [input.requestId]));
      if (collidingId.length) conflict();
      await this.assertCreateQuota(connection, user.id);
      const chunkCount = Math.ceil(input.fileSize / MEDIA_UPLOAD_CHUNK_BYTES);
      const expiresAt = new Date(this.now() + MEDIA_UPLOAD_TTL_MS);
      await connection.execute(`INSERT INTO media_upload_jobs
        (id,ownerUserId,requestId,fingerprint,storageNonce,purpose,releaseId,fileName,mimeType,fileSizeBytes,chunkBytes,chunkCount,state,attempts,expiresAt)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'uploading',0,?)`,
        [input.requestId, user.id, input.requestId, fingerprint, randomUUID(), input.purpose, input.releaseId ?? null, input.fileName, input.mimeType, input.fileSize, MEDIA_UPLOAD_CHUNK_BYTES, chunkCount, expiresAt]);
      const created = await this.getOwnedRow(connection, user.id, input.requestId, false);
      return toStatus(created);
    }));
  }

  async status(user: AuthenticatedMediaUser, id: string): Promise<MediaUploadStatus> {
    await this.ensureSchema();
    return this.withConnection(async connection => {
      const row = await this.getOwnedRow(connection, user.id, id);
      return toStatus(row, await this.receiptRows(connection, row.id));
    });
  }

  async receiveChunk(user: AuthenticatedMediaUser, id: string, index: number, body: Buffer): Promise<MediaUploadStatus> {
    if (!Buffer.isBuffer(body)) invalid('A binary chunk is required.');
    if (body.length > MEDIA_UPLOAD_CHUNK_BYTES) fail(413, 'CHUNK_TOO_LARGE', 'Chunk exceeds the 1 MiB limit.');
    await this.ensureSchema();
    const hash = createHash('sha256').update(body).digest('hex');
    try {
      return await this.withConnection(connection => this.transaction(connection, async () => {
        const initial = await this.getOwnedRow(connection, user.id, id);
        await this.authorizeExisting(connection, user, initial);
        const row = await this.getOwnedRow(connection, user.id, id, true);
        if (asDateMs(row.expiresAt) <= this.now()) fail(409, 'UPLOAD_EXPIRED', 'This upload has expired.');
        const expectedBytes = chunkSizeFor(row, index);
        const receipt = (await this.receiptRows(connection, row.id, true)).find(value => Number(value.chunkIndex) === index);
        if (receipt) {
          if (receipt.sha256 !== hash || Number(receipt.byteSize) !== body.length) conflict();
          return toStatus(row, await this.receiptRows(connection, row.id));
        }
        if (row.state !== 'uploading') conflict();
        if (body.length !== expectedBytes) invalid('Chunk size does not match this upload.');
        await this.storage.put(privateChunkKey(user.id, row.storageNonce, index), body, 'application/octet-stream', { signal: AbortSignal.timeout(STORAGE_TIMEOUT_MS) });
        await connection.execute('INSERT INTO media_upload_chunk_receipts (uploadId,chunkIndex,sha256,byteSize) VALUES (?,?,?,?)', [row.id, index, hash, body.length]);
        return toStatus(row, await this.receiptRows(connection, row.id));
      }));
    } catch (error) {
      // The job-row FOR UPDATE normally serializes writers. This is a final
      // duplicate-key reconciliation for engines/configurations where a
      // concurrent insert was observed at commit time.
      const duplicate = (error as { code?: unknown; cause?: { code?: unknown } })?.code === 'ER_DUP_ENTRY'
        || (error as { cause?: { code?: unknown } })?.cause?.code === 'ER_DUP_ENTRY';
      if (!duplicate) throw error;
      return this.withConnection(connection => this.transaction(connection, async () => {
        const initial = await this.getOwnedRow(connection, user.id, id);
        await this.authorizeExisting(connection, user, initial);
        const row = await this.getOwnedRow(connection, user.id, id, true);
        const receipt = (await this.receiptRows(connection, row.id, true)).find(value => Number(value.chunkIndex) === index);
        if (!receipt || receipt.sha256 !== hash || Number(receipt.byteSize) !== body.length) conflict();
        return toStatus(row, await this.receiptRows(connection, row.id));
      }));
    }
  }

  async complete(user: AuthenticatedMediaUser, id: string): Promise<MediaUploadStatus> {
    await this.ensureSchema();
    return this.withConnection(connection => this.transaction(connection, async () => {
      const initial = await this.getOwnedRow(connection, user.id, id);
      await this.authorizeExisting(connection, user, initial);
      const row = await this.getOwnedRow(connection, user.id, id, true);
      if (asDateMs(row.expiresAt) <= this.now()) fail(409, 'UPLOAD_EXPIRED', 'This upload has expired.');
      const receipts = await this.receiptRows(connection, row.id, true);
      if (row.state === 'uploading') {
        if (receipts.length !== Number(row.chunkCount) || receipts.some((receipt, index) => Number(receipt.chunkIndex) !== index || Number(receipt.byteSize) !== chunkSizeFor(row, index))) {
          conflict();
        }
        await connection.execute("UPDATE media_upload_jobs SET state='queued',leaseToken=NULL,leaseExpiresAt=NULL,error=NULL WHERE id=? AND ownerUserId=? AND state='uploading'", [row.id, user.id]);
      }
      const current = await this.getOwnedRow(connection, user.id, id, false);
      return toStatus(current, receipts);
    }));
  }

  private async claim(user: AuthenticatedMediaUser, id: string): Promise<Claim | undefined> {
    return this.withConnection(connection => this.transaction(connection, async () => {
      const initial = await this.getOwnedRow(connection, user.id, id);
      await this.authorizeExisting(connection, user, initial);
      await connection.execute('INSERT IGNORE INTO media_upload_worker_slots (id,leaseToken,leaseExpiresAt) VALUES (1,NULL,NULL)');
      const slot = rows(await connection.execute('SELECT leaseToken,leaseExpiresAt FROM media_upload_worker_slots WHERE id=1 FOR UPDATE'))[0];
      if (!slot) unavailable();
      if (slot.leaseToken && asDateMs(slot.leaseExpiresAt) > this.now()) return undefined;
      const row = await this.getOwnedRow(connection, user.id, id, true);
      if (row.state === 'done' || row.state === 'failed' || row.state === 'uploading') return undefined;
      const now = this.now();
      if (asDateMs(row.expiresAt) <= now) {
        await connection.execute("UPDATE media_upload_jobs SET state='failed',error='This upload has expired.',leaseToken=NULL,leaseExpiresAt=NULL WHERE id=? AND ownerUserId=? AND state IN ('queued','processing')", [row.id, user.id]);
        return undefined;
      }
      const leaseExpired = asDateMs(row.leaseExpiresAt) <= now;
      if (row.state === 'processing' && !leaseExpired) return undefined;
      const attempts = Number(row.attempts);
      if (!Number.isSafeInteger(attempts) || attempts >= MAX_ATTEMPTS) {
        await connection.execute("UPDATE media_upload_jobs SET state='failed',error='Media processing could not be completed.',leaseToken=NULL,leaseExpiresAt=NULL WHERE id=? AND ownerUserId=?", [row.id, user.id]);
        return undefined;
      }
      const receipts = await this.receiptRows(connection, row.id, true);
      if (receipts.length !== Number(row.chunkCount) || receipts.some((receipt, index) => Number(receipt.chunkIndex) !== index || Number(receipt.byteSize) !== chunkSizeFor(row, index) || !/^[a-f0-9]{64}$/i.test(receipt.sha256)) || !UUID.test(row.storageNonce)) {
        await connection.execute("UPDATE media_upload_jobs SET state='failed',error='This upload could not be verified.',leaseToken=NULL,leaseExpiresAt=NULL WHERE id=? AND ownerUserId=?", [row.id, user.id]);
        return undefined;
      }
      const leaseToken = randomUUID();
      await connection.execute('UPDATE media_upload_worker_slots SET leaseToken=?,leaseExpiresAt=? WHERE id=1', [leaseToken, new Date(now + LEASE_MS)]);
      await connection.execute("UPDATE media_upload_jobs SET state='processing',attempts=attempts+1,leaseToken=?,leaseExpiresAt=?,error=NULL WHERE id=? AND ownerUserId=? AND state IN ('queued','processing')", [leaseToken, new Date(now + LEASE_MS), row.id, user.id]);
      return { id: row.id, ownerUserId: user.id, storageNonce: row.storageNonce, purpose: row.purpose, mimeType: row.mimeType, fileSizeBytes: Number(row.fileSizeBytes), chunkCount: Number(row.chunkCount), fileName: row.fileName, leaseToken, attempts: attempts + 1, chunkHashes: receipts.map(receipt => receipt.sha256) };
    }));
  }

  private async readInputToFile(claim: Claim, directory: string, signal: AbortSignal, deadlineAt: number): Promise<string> {
    const source = join(directory, 'source');
    let total = 0;
    for (let index = 0; index < claim.chunkCount; index += 1) {
      const key = privateChunkKey(claim.ownerUserId, claim.storageNonce, index);
      const expected = index === claim.chunkCount - 1 ? claim.fileSizeBytes - MEDIA_UPLOAD_CHUNK_BYTES * (claim.chunkCount - 1) : MEDIA_UPLOAD_CHUNK_BYTES;
      const location = await this.storage.get(key, { signal: storageSignal(signal, deadlineAt) });
      if (location.key !== key || !trustedStorageUrl(location.url, key)) throw new MediaUploadError(503, 'UNTRUSTED_STORAGE_URL', 'Media processing is temporarily unavailable.');
      const response = await this.fetchImpl(location.url, { redirect: 'error', signal: storageSignal(signal, deadlineAt) });
      const declared = Number(response.headers.get('content-length'));
      if (!response.ok || !response.body || (Number.isFinite(declared) && declared !== expected)) throw new MediaUploadError(503, 'STORAGE_READ_FAILED', 'Media processing is temporarily unavailable.');
      const reader = response.body.getReader();
      let chunkTotal = 0; const hash = createHash('sha256');
      try {
        while (true) {
          const next = await reader.read();
          if (next.done) break;
          const value = Buffer.from(next.value);
          chunkTotal += value.length; total += value.length;
          if (chunkTotal > expected || total > claim.fileSizeBytes) throw new MediaUploadError(413, 'STORAGE_SIZE_INVALID', 'This media could not be processed.');
          hash.update(value);
          await appendFile(source, value, { mode: 0o600 });
        }
      } finally { await reader.cancel().catch(() => undefined); }
      if (chunkTotal !== expected || hash.digest('hex') !== claim.chunkHashes[index]) throw new MediaUploadError(400, 'STORAGE_INTEGRITY_INVALID', 'This media could not be processed.');
    }
    if (total !== claim.fileSizeBytes || (await stat(source)).size !== total) throw new MediaUploadError(503, 'STORAGE_SIZE_INVALID', 'Media processing is temporarily unavailable.');
    return source;
  }

  private async probeAudio(path: string, signal: AbortSignal): Promise<void> {
    const formats = await new Promise<string>((resolve, reject) => {
      const child = spawn('ffprobe', ['-v', 'error', '-protocol_whitelist', 'file,pipe', '-format_whitelist', 'mp3,wav,flac,aac,mov,matroska,webm,ogg', '-show_entries', 'format=format_name:stream=codec_type', '-of', 'json', path], { shell: false, stdio: ['ignore', 'pipe', 'ignore'] });
      let output = ''; const timer = setTimeout(() => child.kill('SIGKILL'), 15_000);
      const abort = () => child.kill('SIGKILL'); signal.addEventListener('abort', abort, { once: true });
      child.stdout.on('data', value => { output = (output + String(value)).slice(-16_000); });
      child.once('error', () => reject(new MediaUploadError(400, 'INVALID_AUDIO', 'This media could not be processed.')));
      child.once('close', code => { clearTimeout(timer); signal.removeEventListener('abort', abort); code === 0 ? resolve(output) : reject(new MediaUploadError(400, 'INVALID_AUDIO', 'This media could not be processed.')); });
    });
    let parsed: { format?: { format_name?: string }; streams?: Array<{ codec_type?: string }> };
    try { parsed = JSON.parse(formats); } catch { throw new MediaUploadError(400, 'INVALID_AUDIO', 'This media could not be processed.'); }
    const list = String(parsed.format?.format_name ?? '').split(',');
    const hasAudio = parsed.streams?.some(stream => stream.codec_type === 'audio');
    const expected = this.currentAudioFormats;
    if (!hasAudio || !expected.some(format => list.includes(format))) throw new MediaUploadError(400, 'INVALID_AUDIO', 'This media could not be processed.');
  }
  private get currentAudioFormats(): string[] { return ['mp3', 'wav', 'flac', 'aac', 'mov', 'mp4', 'm4a', 'ogg']; }
  private audioExtension(mime: string): string {
    if (mime === 'audio/mpeg') return 'mp3'; if (mime === 'audio/flac' || mime === 'audio/x-flac') return 'flac';
    if (mime === 'audio/aac') return 'aac'; if (mime === 'audio/mp4' || mime === 'audio/x-m4a') return 'm4a'; return 'wav';
  }

  private async createResult(claim: Claim, source: string, signal: AbortSignal, deadlineAt: number): Promise<MediaUploadResult> {
    const checkDeadline = () => { if (signal.aborted || Date.now() >= deadlineAt) throw new MediaUploadError(504, 'PROCESS_TIMEOUT', 'Media processing timed out.'); };
    checkDeadline();
    if (claim.purpose === 'content-preview') {
      const clipped = await this.clipPreview(source, { audioOnly: claim.mimeType.startsWith('audio/'), maxBytes: MEDIA_UPLOAD_LIMITS['content-preview'], maxInputSeconds: 300 });
      checkDeadline();
      const key = `release-previews/hosted/${claim.ownerUserId}/${claim.id}.${clipped.extension}`;
      const uploaded = await this.storage.put(key, clipped.data, clipped.mimeType, { signal: storageSignal(signal, deadlineAt) });
      return { previewMedia: this.signPreview({ version: 1, userId: claim.ownerUserId, key, kind: clipped.kind, durationSeconds: clipped.durationSeconds }), previewUrl: uploaded.url, kind: clipped.kind, durationSeconds: clipped.durationSeconds };
    }
    if (claim.purpose === 'content-cover' || claim.purpose === 'music-cover') {
      const input = await readFile(source);
      if (input.length > MEDIA_UPLOAD_LIMITS[claim.purpose]) throw new MediaUploadError(413, 'FILE_TOO_LARGE', 'This media could not be processed.');
      const cover = await this.prepareCover(input.toString('base64'), claim.mimeType);
      checkDeadline();
      const key = claim.purpose === 'music-cover' ? `releases/covers/${claim.ownerUserId}/${claim.id}.webp` : `content-release-covers/${claim.ownerUserId}/${claim.id}.webp`;
      const uploaded = await this.storage.put(key, cover.data, cover.mimeType, { signal: storageSignal(signal, deadlineAt) });
      return { url: uploaded.url, width: cover.width, height: cover.height, success: true, fileKey: key, fileSizeBytes: cover.data.length, fileFormat: 'WEBP' };
    }
    await this.probeAudio(source, signal);
    checkDeadline();
    const audio = await readFile(source);
    if (audio.length !== claim.fileSizeBytes || audio.length > MEDIA_UPLOAD_LIMITS['music-audio']) throw new MediaUploadError(413, 'FILE_TOO_LARGE', 'This media could not be processed.');
    const extension = this.audioExtension(claim.mimeType);
    const key = `releases/audio/${claim.ownerUserId}/${claim.id}.${extension}`;
    const uploaded = await this.storage.put(key, audio, claim.mimeType, { signal: storageSignal(signal, deadlineAt) });
    return { success: true, fileKey: key, url: uploaded.url, fileSizeBytes: audio.length, fileFormat: extension.toUpperCase() };
  }

  private async settle(claim: Claim, state: 'done' | 'failed' | 'queued', result?: MediaUploadResult, error?: string): Promise<void> {
    await this.withConnection(connection => this.transaction(connection, async () => {
      // Same slot-before-job order as claim; a stale worker cannot release a newer lease.
      await connection.execute('UPDATE media_upload_worker_slots SET leaseToken=NULL,leaseExpiresAt=NULL WHERE id=1 AND leaseToken=?', [claim.leaseToken]);
      const serialized = result ? JSON.stringify(result) : null;
      const update = await connection.execute(
        'UPDATE media_upload_jobs SET state=?,result=?,error=?,leaseToken=NULL,leaseExpiresAt=NULL WHERE id=? AND ownerUserId=? AND state=\'processing\' AND leaseToken=?',
        [state, serialized, error ?? null, claim.id, claim.ownerUserId, claim.leaseToken],
      );
      // mysql2 headers vary; a zero affectedRows is an expected lost-lease CAS, never a retryable error.
      void update;
    }));
  }

  /**
   * A live POST owns all CPU work. This method never schedules detached work;
   * each result transition is guarded by its DB lease token.
   */
  async process(user: AuthenticatedMediaUser, id: string): Promise<MediaUploadStatus> {
    await this.ensureSchema();
    // Prove ownership before observing or claiming work; GET/status stays read-only.
    await this.status(user, id);
    if (processActive) return this.status(user, id);
    processActive = true;
    try {
      const claim = await this.claim(user, id);
      if (!claim) return this.status(user, id);
      const startedAt = this.now(); const deadlineAt = startedAt + PROCESS_BUDGET_MS;
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), PROCESS_BUDGET_MS);
      let directory: string | undefined;
      try {
        directory = await mkdtemp(join(tmpdir(), 'ology-media-upload-'));
        const source = await this.readInputToFile(claim, directory, controller.signal, deadlineAt);
        const result = await this.createResult(claim, source, controller.signal, deadlineAt);
        await this.settle(claim, 'done', result);
        console.info('[MediaUpload]', { stage: 'done', id: claim.id, purpose: claim.purpose, ms: this.now() - startedAt, rss: process.memoryUsage().rss });
      } catch (error) {
        const safe = safeError(error);
        if (safe.permanent || claim.attempts >= MAX_ATTEMPTS) await this.settle(claim, 'failed', undefined, safe.message);
        else await this.settle(claim, 'queued', undefined, safe.message);
        console.warn('[MediaUpload]', { stage: safe.permanent ? 'failed' : 'queued', id: claim.id, purpose: claim.purpose, ms: this.now() - startedAt, rss: process.memoryUsage().rss, code: (error as { code?: unknown })?.code });
      } finally {
        clearTimeout(timer); controller.abort();
        if (directory) await rm(directory, { recursive: true, force: true }).catch(() => undefined);
      }
      return this.status(user, id);
    } finally { processActive = false; }
  }
}

export const mediaUploadService = new MediaUploadService();
