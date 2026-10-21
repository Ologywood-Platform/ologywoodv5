import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import type { Pool, PoolConnection } from 'mysql2/promise';
import type { RiderDocumentSummary } from '../../shared/riderDocuments';
import { storageGet, storagePut } from '../storage';
import { assertRiderDocumentAccess, getRiderDocumentContext, type RiderDocumentConnection } from './riderDocumentAccessService';
import { ensureRiderDocumentSchema } from './riderDocumentSchemaService';
import { RiderPdfValidationError, validateAndSanitizeRiderPdf } from './riderPdfValidation';
import { fetchEncryptedRiderObject } from './riderDocumentStorage';

export type RiderDocumentMutationInput = {
  ownerUserId?: number;
  title?: string;
  documentId?: number;
  expectedRevision?: number;
  fileName?: string;
  pdfBase64?: string;
};

type SqlRow = Record<string, any>;
type StoragePort = {
  put: typeof storagePut;
  get: typeof storageGet;
  fetch: typeof fetch;
};

const encryptedHeaderSize = 12 + 16; // 96-bit GCM IV followed by 128-bit tag
const storage: StoragePort = { put: storagePut, get: storageGet, fetch };

function trpc(code: 'BAD_REQUEST' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_SERVER_ERROR' | 'SERVICE_UNAVAILABLE', message: string): never {
  throw new TRPCError({ code, message });
}

function validId(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

function asRows(result: unknown): SqlRow[] {
  return Array.isArray(result) && Array.isArray(result[0]) ? result[0] as SqlRow[] : [];
}

async function rows(connection: RiderDocumentConnection, sql: string, values: readonly unknown[] = []): Promise<SqlRow[]> {
  return asRows(await connection.execute<any[]>(sql, values));
}

function summary(row: SqlRow): RiderDocumentSummary {
  return {
    id: Number(row.id), title: String(row.title), revision: Number(row.revision),
    currentVersionId: Number(row.currentVersionId), versionNumber: Number(row.versionNumber),
    fileName: String(row.fileName), byteSize: Number(row.byteSize), pageCount: Number(row.pageCount),
    isDefault: Boolean(row.isDefault), createdAt: new Date(row.createdAt), updatedAt: new Date(row.updatedAt),
  };
}

function validateTitle(title: unknown): string {
  if (typeof title !== 'string') trpc('BAD_REQUEST', 'A rider title is required');
  const normalized = title.trim();
  if (!normalized || normalized.length > 255) trpc('BAD_REQUEST', 'Rider title must be 1–255 characters');
  return normalized;
}

function validateFileName(fileName: unknown): string {
  if (typeof fileName !== 'string') trpc('BAD_REQUEST', 'A PDF filename is required');
  const normalized = fileName.trim();
  if (!normalized || normalized.length > 255 || /[\\/\u0000-\u001f]/.test(normalized) || !/\.pdf$/i.test(normalized)) {
    trpc('BAD_REQUEST', 'Filename must be a safe .pdf filename');
  }
  return normalized;
}

/** Strict base64 decoder; Buffer.from alone silently accepts malformed input. */
export function decodeRiderPdfBase64(value: unknown): Buffer {
  if (typeof value !== 'string' || !value || value.length > 14_000_000 || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    trpc('BAD_REQUEST', 'PDF payload must be valid base64');
  }
  const bytes = Buffer.from(value, 'base64');
  if (!bytes.length || bytes.toString('base64') !== value) trpc('BAD_REQUEST', 'PDF payload must be valid base64');
  return bytes;
}

function encryptionKey(): Buffer {
  const secret = process.env.RIDER_DOCUMENT_ENCRYPTION_KEY;
  // Private retained files must remain decryptable if login/session credentials rotate.
  // This dedicated 256-bit key is persisted as a project secret, never created per process.
  if (!secret || !/^[a-fA-F0-9]{64}$/.test(secret)) trpc('SERVICE_UNAVAILABLE', 'Rider document encryption is not configured');
  return Buffer.from(secret, 'hex');
}

function aad(ownerUserId: number, storageKey: string): Buffer {
  return Buffer.from(`rider-document:v1:${ownerUserId}:${storageKey}`, 'utf8');
}

/** Encrypted blob format: 12-byte IV + 16-byte GCM tag + ciphertext. */
export function encryptRiderDocumentBytes(plain: Buffer, ownerUserId: number, storageKey: string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  cipher.setAAD(aad(ownerUserId, storageKey));
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);
}

export function decryptRiderDocumentBytes(encrypted: Buffer, ownerUserId: number, storageKey: string): Buffer {
  if (!Buffer.isBuffer(encrypted) || encrypted.length <= encryptedHeaderSize) trpc('NOT_FOUND', 'Rider PDF is unavailable');
  const iv = encrypted.subarray(0, 12);
  const tag = encrypted.subarray(12, encryptedHeaderSize);
  const ciphertext = encrypted.subarray(encryptedHeaderSize);
  try {
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
    decipher.setAAD(aad(ownerUserId, storageKey));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    trpc('NOT_FOUND', 'Rider PDF is unavailable');
  }
}

async function poolOrThrow(): Promise<Pool> {
  const database = await import('../db');
  await database.getDb();
  const pool = database.getPool();
  if (!pool) trpc('SERVICE_UNAVAILABLE', 'Rider documents are temporarily unavailable');
  // Required before transaction creation. It has no row writes and is safe on
  // application startup race; runtime drift throws rather than mutating tables.
  await ensureRiderDocumentSchema(pool as unknown as RiderDocumentConnection);
  return pool as Pool;
}

async function withConnection<T>(work: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const pool = await poolOrThrow();
  const connection = await pool.getConnection();
  try { return await work(connection); } finally { connection.release(); }
}

async function inTransaction<T>(connection: PoolConnection, work: () => Promise<T>): Promise<T> {
  await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
  await connection.beginTransaction();
  try {
    const result = await work();
    await connection.commit();
    return result;
  } catch (error) {
    try { await connection.rollback(); } catch { /* retain original safe error */ }
    throw error;
  }
}

async function currentDocument(connection: RiderDocumentConnection, ownerUserId: number, documentId: number, lock = false): Promise<SqlRow | undefined> {
  const found = await rows(connection,
    `SELECT d.id, d.ownerUserId, d.title, d.currentVersionId, d.revision, d.isDefault, d.archivedAt, d.createdAt, d.updatedAt,
            v.id AS versionId, v.versionNumber, v.fileName, v.byteSize, v.pageCount
       FROM rider_documents d
       INNER JOIN rider_document_versions v ON v.id = d.currentVersionId AND v.documentId = d.id
      WHERE d.id = ? AND d.ownerUserId = ? LIMIT 1${lock ? ' FOR UPDATE' : ''}`,
    [documentId, ownerUserId],
  );
  return found[0];
}

async function listOnConnection(connection: RiderDocumentConnection, ownerUserId: number): Promise<RiderDocumentSummary[]> {
  const found = await rows(connection,
    `SELECT d.id, d.title, d.currentVersionId, d.revision, d.isDefault, d.createdAt, d.updatedAt,
            v.versionNumber, v.fileName, v.byteSize, v.pageCount
       FROM rider_documents d
       INNER JOIN rider_document_versions v ON v.id = d.currentVersionId AND v.documentId = d.id
      WHERE d.ownerUserId = ? AND d.archivedAt IS NULL
      ORDER BY d.updatedAt DESC, d.id DESC`,
    [ownerUserId],
  );
  return found.map(summary);
}

async function initialPlanCheck(actorId: number, ownerUserId: number): Promise<void> {
  await withConnection(async (connection) => inTransaction(connection, async () => {
    await assertRiderDocumentAccess(connection, actorId, ownerUserId, { requirePlan: true });
  }));
}

function toSafeInputFailure(error: unknown): never {
  if (error instanceof RiderPdfValidationError) trpc('BAD_REQUEST', error.message);
  throw error;
}

async function uploadEncryptedPdf(ownerUserId: number, fileName: string, pdfBase64: string): Promise<{
  storageKey: string; byteSize: number; pageCount: number; sha256: string;
}> {
  let validated;
  try { validated = await validateAndSanitizeRiderPdf(decodeRiderPdfBase64(pdfBase64)); }
  catch (error) { return toSafeInputFailure(error); }
  const storageKey = `private/rider-documents/${ownerUserId}/${randomBytes(24).toString('hex')}.bin`;
  const encrypted = encryptRiderDocumentBytes(validated.bytes, ownerUserId, storageKey);
  try {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      // A late provider-only upload can leave an unreferenced encrypted blob, never a committed rider.
      await Promise.race([storage.put(storageKey, encrypted, 'application/octet-stream'), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Storage timed out')), 12_000); })]);
    } finally { if (timer) clearTimeout(timer); }
  } catch {
    // Do not include upstream storage detail or keys in errors/logs.
    trpc('SERVICE_UNAVAILABLE', 'Rider document storage is temporarily unavailable');
  }
  return { storageKey, byteSize: validated.byteSize, pageCount: validated.pageCount, sha256: validated.sha256 };
}

export async function getRiderDocumentLibrary(actorId: number, requestedOwnerUserId?: number): Promise<{
  context: Awaited<ReturnType<typeof getRiderDocumentContext>>;
  documents: RiderDocumentSummary[];
}> {
  return withConnection(async (connection) => inTransaction(connection, async () => {
    const ownerUserId = requestedOwnerUserId ?? actorId;
    const context = await assertRiderDocumentAccess(connection, actorId, ownerUserId, { requirePlan: false });
    return { context, documents: await listOnConnection(connection, context.ownerUserId) };
  }));
}

/** Context validates access but intentionally returns no document or storage information. */
export async function getRiderDocumentLibraryContext(actorId: number, requestedOwnerUserId?: number) {
  return withConnection(async (connection) => inTransaction(connection, async () => {
    const ownerUserId = requestedOwnerUserId ?? actorId;
    return assertRiderDocumentAccess(connection, actorId, ownerUserId, { requirePlan: false });
  }));
}

export async function uploadRiderDocument(actorId: number, input: Required<Pick<RiderDocumentMutationInput, 'title' | 'fileName' | 'pdfBase64'>> & { ownerUserId?: number }): Promise<RiderDocumentSummary> {
  const ownerUserId = input.ownerUserId ?? actorId;
  if (!validId(ownerUserId)) trpc('BAD_REQUEST', 'Invalid rider library owner');
  const title = validateTitle(input.title);
  const fileName = validateFileName(input.fileName);
  await initialPlanCheck(actorId, ownerUserId);
  const file = await uploadEncryptedPdf(ownerUserId, fileName, input.pdfBase64);
  return withConnection(async (connection) => inTransaction(connection, async () => {
    const context = await assertRiderDocumentAccess(connection, actorId, ownerUserId, { requirePlan: true });
    const [documentResult] = await connection.execute<any>(
      'INSERT INTO rider_documents (ownerUserId, title, currentVersionId, revision, isDefault, createdAt, updatedAt) VALUES (?, ?, NULL, 1, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [context.ownerUserId, title],
    );
    const documentId = Number((documentResult as any).insertId);
    const [versionResult] = await connection.execute<any>(
      `INSERT INTO rider_document_versions (documentId, ownerUserId, versionNumber, fileName, storageKey, byteSize, pageCount, sha256, createdAt)
       VALUES (?, ?, 1, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [documentId, context.ownerUserId, fileName, file.storageKey, file.byteSize, file.pageCount, file.sha256],
    );
    const versionId = Number((versionResult as any).insertId);
    const [pointerResult] = await connection.execute<any>(
      'UPDATE rider_documents SET currentVersionId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND ownerUserId = ? AND currentVersionId IS NULL',
      [versionId, documentId, context.ownerUserId],
    );
    if (Number((pointerResult as any).affectedRows) !== 1) trpc('INTERNAL_SERVER_ERROR', 'Could not create rider document');
    const created = await currentDocument(connection, context.ownerUserId, documentId, true);
    if (!created) trpc('INTERNAL_SERVER_ERROR', 'Could not create rider document');
    return summary(created);
  }));
}

export async function replaceRiderDocument(actorId: number, input: Required<Pick<RiderDocumentMutationInput, 'documentId' | 'expectedRevision' | 'fileName' | 'pdfBase64'>> & { ownerUserId?: number }): Promise<RiderDocumentSummary> {
  const ownerUserId = input.ownerUserId ?? actorId;
  if (!validId(ownerUserId) || !validId(input.documentId) || !Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1) trpc('BAD_REQUEST', 'Invalid rider document revision');
  const fileName = validateFileName(input.fileName);
  await initialPlanCheck(actorId, ownerUserId);
  const file = await uploadEncryptedPdf(ownerUserId, fileName, input.pdfBase64);
  return withConnection(async (connection) => inTransaction(connection, async () => {
    const context = await assertRiderDocumentAccess(connection, actorId, ownerUserId, { requirePlan: true });
    const existing = await currentDocument(connection, context.ownerUserId, input.documentId, true);
    if (!existing || existing.archivedAt) trpc('NOT_FOUND', 'Rider document not found');
    if (Number(existing.revision) !== input.expectedRevision) trpc('CONFLICT', 'This rider document changed. Refresh and review the current version.');
    const nextVersion = Number(existing.versionNumber) + 1;
    const [versionResult] = await connection.execute<any>(
      `INSERT INTO rider_document_versions (documentId, ownerUserId, versionNumber, fileName, storageKey, byteSize, pageCount, sha256, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [input.documentId, context.ownerUserId, nextVersion, fileName, file.storageKey, file.byteSize, file.pageCount, file.sha256],
    );
    const versionId = Number((versionResult as any).insertId);
    const [updateResult] = await connection.execute<any>(
      `UPDATE rider_documents SET currentVersionId = ?, revision = revision + 1, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ? AND ownerUserId = ? AND revision = ? AND archivedAt IS NULL`,
      [versionId, input.documentId, context.ownerUserId, input.expectedRevision],
    );
    if (Number((updateResult as any).affectedRows) !== 1) trpc('CONFLICT', 'This rider document changed. Refresh and review the current version.');
    const replaced = await currentDocument(connection, context.ownerUserId, input.documentId, true);
    if (!replaced) trpc('INTERNAL_SERVER_ERROR', 'Could not replace rider document');
    return summary(replaced);
  }));
}

export async function setDefaultRiderDocument(actorId: number, input: { ownerUserId?: number; documentId: number; expectedRevision: number }): Promise<RiderDocumentSummary> {
  const ownerUserId = input.ownerUserId ?? actorId;
  if (!validId(ownerUserId) || !validId(input.documentId) || !Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1) trpc('BAD_REQUEST', 'Invalid rider document revision');
  return withConnection(async (connection) => inTransaction(connection, async () => {
    const context = await assertRiderDocumentAccess(connection, actorId, ownerUserId, { requirePlan: true });
    const target = await currentDocument(connection, context.ownerUserId, input.documentId, true);
    if (!target || target.archivedAt) trpc('NOT_FOUND', 'Rider document not found');
    if (Number(target.revision) !== input.expectedRevision) trpc('CONFLICT', 'This rider document changed. Refresh and review the current version.');
    await connection.execute('UPDATE rider_documents SET isDefault = FALSE, updatedAt = CURRENT_TIMESTAMP WHERE ownerUserId = ? AND isDefault = TRUE AND id <> ?', [context.ownerUserId, input.documentId]);
    const [updated] = await connection.execute<any>(
      'UPDATE rider_documents SET isDefault = TRUE, revision = revision + 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND ownerUserId = ? AND revision = ? AND archivedAt IS NULL',
      [input.documentId, context.ownerUserId, input.expectedRevision],
    );
    if (Number((updated as any).affectedRows) !== 1) trpc('CONFLICT', 'This rider document changed. Refresh and review the current version.');
    const result = await currentDocument(connection, context.ownerUserId, input.documentId, true);
    if (!result) trpc('INTERNAL_SERVER_ERROR', 'Could not set the default rider document');
    return summary(result);
  }));
}

export async function clearDefaultRiderDocument(actorId: number, input: { ownerUserId?: number }): Promise<{ success: true }> {
  const ownerUserId = input.ownerUserId ?? actorId;
  if (!validId(ownerUserId)) trpc('BAD_REQUEST', 'Invalid rider library owner');
  return withConnection(async (connection) => inTransaction(connection, async () => {
    const context = await assertRiderDocumentAccess(connection, actorId, ownerUserId, { requirePlan: false });
    await connection.execute('UPDATE rider_documents SET isDefault = FALSE, revision = revision + 1, updatedAt = CURRENT_TIMESTAMP WHERE ownerUserId = ? AND isDefault = TRUE', [context.ownerUserId]);
    return { success: true };
  }));
}

export async function archiveRiderDocument(actorId: number, input: { ownerUserId?: number; documentId: number; expectedRevision: number }): Promise<{ success: true }> {
  const ownerUserId = input.ownerUserId ?? actorId;
  if (!validId(ownerUserId) || !validId(input.documentId) || !Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1) trpc('BAD_REQUEST', 'Invalid rider document revision');
  return withConnection(async (connection) => inTransaction(connection, async () => {
    const context = await assertRiderDocumentAccess(connection, actorId, ownerUserId, { requirePlan: false });
    const existing = await currentDocument(connection, context.ownerUserId, input.documentId, true);
    if (!existing || existing.archivedAt) trpc('NOT_FOUND', 'Rider document not found');
    if (Number(existing.revision) !== input.expectedRevision) trpc('CONFLICT', 'This rider document changed. Refresh and review the current version.');
    const [result] = await connection.execute<any>(
      `UPDATE rider_documents SET archivedAt = CURRENT_TIMESTAMP, isDefault = FALSE, revision = revision + 1, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ? AND ownerUserId = ? AND revision = ? AND archivedAt IS NULL`,
      [input.documentId, context.ownerUserId, input.expectedRevision],
    );
    if (Number((result as any).affectedRows) !== 1) trpc('CONFLICT', 'This rider document changed. Refresh and review the current version.');
    // Storage deliberately has no delete API. Versions remain for booking links.
    return { success: true };
  }));
}

export type PrivateRiderPdf = { bytes: Buffer; fileName: string; byteSize: number; pageCount: number };

async function encryptedBytes(storageKey: string): Promise<Buffer> {
  try { return await fetchEncryptedRiderObject(storageKey, storage); }
  catch { trpc('SERVICE_UNAVAILABLE', 'Rider PDF storage is temporarily unavailable'); }
}

/** Authorizes a live library owner/explicit manager and decrypts on the server only. */
export async function readLibraryRiderPdf(actorId: number, versionId: number): Promise<PrivateRiderPdf> {
  if (!validId(versionId)) trpc('BAD_REQUEST', 'Invalid rider PDF');
  return withConnection(async (connection) => inTransaction(connection, async () => {
    const versionRows = await rows(connection,
      `SELECT v.id, v.ownerUserId, v.fileName, v.storageKey, v.byteSize, v.pageCount
         FROM rider_document_versions v WHERE v.id = ? LIMIT 1`, [versionId]);
    const version = versionRows[0];
    if (!version) trpc('NOT_FOUND', 'Rider PDF not found');
    await assertRiderDocumentAccess(connection, actorId, Number(version.ownerUserId), { requirePlan: false });
    const current = await rows(connection, 'SELECT id, ownerUserId, storageKey FROM rider_document_versions WHERE id = ? FOR UPDATE', [versionId]);
    if (Number(current[0]?.ownerUserId) !== Number(version.ownerUserId) || current[0]?.storageKey !== version.storageKey) trpc('CONFLICT', 'Rider access changed. Refresh and retry.');
    const encrypted = await encryptedBytes(String(version.storageKey));
    // Recheck after external I/O before releasing locks and writing response.
    await assertRiderDocumentAccess(connection, actorId, Number(version.ownerUserId), { requirePlan: false });
    const bytes = decryptRiderDocumentBytes(encrypted, Number(version.ownerUserId), String(version.storageKey));
    return { bytes, fileName: String(version.fileName), byteSize: Number(version.byteSize), pageCount: Number(version.pageCount) };
  }));
}

/** Booking route caller supplies its independently authorized immutable version metadata. */
export async function readAuthorizedRiderPdf(ownerUserId: number, storageKey: string, fileName: string, byteSize: number, pageCount: number): Promise<PrivateRiderPdf> {
  if (!validId(ownerUserId) || !storageKey.startsWith(`private/rider-documents/${ownerUserId}/`)) trpc('NOT_FOUND', 'Rider PDF not found');
  const encrypted = await encryptedBytes(storageKey);
  return { bytes: decryptRiderDocumentBytes(encrypted, ownerUserId, storageKey), fileName, byteSize, pageCount };
}

/** Test-only dependency reset; production code never exposes storage keys or URLs. */
export function __setRiderDocumentStorageForTests(next: Partial<StoragePort>): void {
  Object.assign(storage, next);
}
