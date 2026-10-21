import { execFileSync } from 'node:child_process';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PDFDocument, PDFName, rgb } from 'pdf-lib';
import { ENV } from './_core/env';
import {
  assertRiderDocumentAccess,
  getRiderDocumentContext,
  type RiderDocumentConnection,
} from './services/riderDocumentAccessService';
import {
  decodeRiderPdfBase64,
  decryptRiderDocumentBytes,
  encryptRiderDocumentBytes,
} from './services/riderDocumentService';
import { ensureRiderDocumentSchema } from './services/riderDocumentSchemaService';
import { RiderPdfValidationError, validateAndSanitizeRiderPdf } from './services/riderPdfValidation';

const originalOwnerEmail = process.env.OWNER_EMAIL;
const originalOwnerOpenId = process.env.OWNER_OPEN_ID;
const originalOwnerName = process.env.OWNER_NAME;
const originalCookieSecret = ENV.cookieSecret;
const originalRiderKey = process.env.RIDER_DOCUMENT_ENCRYPTION_KEY;

afterAll(() => {
  if (originalOwnerEmail === undefined) delete process.env.OWNER_EMAIL;
  else process.env.OWNER_EMAIL = originalOwnerEmail;
  if (originalOwnerOpenId === undefined) delete process.env.OWNER_OPEN_ID;
  else process.env.OWNER_OPEN_ID = originalOwnerOpenId;
  if (originalOwnerName === undefined) delete process.env.OWNER_NAME;
  else process.env.OWNER_NAME = originalOwnerName;
  ENV.cookieSecret = originalCookieSecret;
  if (originalRiderKey === undefined) delete process.env.RIDER_DOCUMENT_ENCRYPTION_KEY; else process.env.RIDER_DOCUMENT_ENCRYPTION_KEY = originalRiderKey;
});

type AccessState = {
  ownerUserId?: number;
  profileUserId?: number;
  profileId?: number;
  nonOwnerMembership?: boolean;
  membership?: unknown;
  subscription?: Record<string, unknown>;
  grant?: Record<string, unknown>;
  outage?: 'subscription' | 'grant' | 'membership';
};

function accessConnection(state: AccessState = {}) {
  const ownerUserId = state.ownerUserId ?? 100;
  const execute = vi.fn(async (sql: string) => {
    if (sql.startsWith('SELECT id FROM users WHERE id IN')) return [[], {}];
    if (sql.includes('FROM artist_profiles WHERE userId')) {
      return [[{ id: state.profileId ?? 50, userId: state.profileUserId ?? ownerUserId, artistName: 'Talent' }], {}];
    }
    if (sql.includes('SELECT id FROM artist_team_members WHERE userId')) {
      return [state.nonOwnerMembership ? [{ id: 77 }] : [], {}];
    }
    if (sql.includes('FROM artist_team_members')) {
      if (state.outage === 'membership') throw new Error('synthetic membership outage');
      return [[{ permissions: state.membership ?? {} }], {}];
    }
    if (sql.includes('SELECT id, openId, email, emailVerified FROM users')) {
      // Deliberately not a configured platform owner: role/admin flags must not matter.
      return [[{ id: ownerUserId, openId: null, email: 'talent@example.invalid', emailVerified: false, role: 'admin' }], {}];
    }
    if (sql.includes('FROM user_subscriptions')) {
      if (state.outage === 'subscription') throw new Error('synthetic billing outage');
      return [state.subscription ? [state.subscription] : [], {}];
    }
    if (sql.includes('FROM complimentary_access_grants')) {
      if (state.outage === 'grant') throw new Error('synthetic grant outage');
      return [state.grant ? [state.grant] : [], {}];
    }
    throw new Error(`Unexpected security-test SQL: ${sql}`);
  });
  return { execute } as unknown as RiderDocumentConnection & { execute: ReturnType<typeof vi.fn> };
}

beforeEach(() => {
  process.env.RIDER_DOCUMENT_ENCRYPTION_KEY = '22'.repeat(32);
  // Prevent a machine-level owner configuration from granting a fixture accidentally.
  process.env.OWNER_EMAIL = 'nobody@example.invalid';
  process.env.OWNER_OPEN_ID = 'no-owner-open-id';
  process.env.OWNER_NAME = 'no-owner-name';
  ENV.cookieSecret = 'synthetic-test-secret';
});

async function onePagePdf(options: { title?: string; text?: string; size?: [number, number] } = {}): Promise<Buffer> {
  const document = await PDFDocument.create();
  if (options.title) document.setTitle(options.title);
  const page = document.addPage(options.size ?? [612, 792]);
  if (options.text) page.drawText(options.text, { x: 48, y: 700, size: 18, color: rgb(0.1, 0.2, 0.3) });
  // pdf-lib emits an empty /Annots array by default. Remove that inert array so
  // this is a real, visual, annotation-free source accepted by the strict gate.
  (page as any).node.delete(PDFName.of('Annots'));
  return Buffer.from(await document.save({ useObjectStreams: false }));
}

async function encryptedPdfFromPdfLib(): Promise<Buffer> {
  const source = await onePagePdf({ text: 'Encrypted source created from pdf-lib' });
  // pypdf supplies an actual encrypted container around the pdf-lib-generated PDF.
  const script = `import base64, io, sys
from pypdf import PdfReader, PdfWriter
raw = base64.b64decode(sys.stdin.buffer.read())
writer = PdfWriter()
for page in PdfReader(io.BytesIO(raw)).pages:
    writer.add_page(page)
writer.encrypt('correct horse battery staple')
out = io.BytesIO()
writer.write(out)
sys.stdout.buffer.write(base64.b64encode(out.getvalue()))`;
  const encoded = execFileSync('python3', ['-c', script], { input: source.toString('base64') });
  return Buffer.from(encoded.toString(), 'base64');
}

function metadataFor(table: string) {
  const columns: Record<string, string[]> = {
    rider_documents: ['id', 'ownerUserId', 'title', 'currentVersionId', 'revision', 'isDefault', 'archivedAt', 'createdAt', 'updatedAt'],
    rider_document_versions: ['id', 'documentId', 'ownerUserId', 'versionNumber', 'fileName', 'storageKey', 'byteSize', 'pageCount', 'sha256', 'createdAt'],
    booking_rider_document_links: ['id', 'bookingId', 'documentId', 'versionId', 'titleSnapshot', 'attachedByUserId', 'attachedAt'],
  };
  const indexes: Record<string, Array<{ Key_name: string; Non_unique: number; Seq_in_index: number; Column_name: string }>> = {
    rider_documents: [{ Key_name: 'PRIMARY', Non_unique: 0, Seq_in_index: 1, Column_name: 'id' }],
    rider_document_versions: [
      { Key_name: 'PRIMARY', Non_unique: 0, Seq_in_index: 1, Column_name: 'id' },
      { Key_name: 'uniq_rider_document_versions_document_number', Non_unique: 0, Seq_in_index: 1, Column_name: 'documentId' },
      { Key_name: 'uniq_rider_document_versions_document_number', Non_unique: 0, Seq_in_index: 2, Column_name: 'versionNumber' },
    ],
    booking_rider_document_links: [
      { Key_name: 'PRIMARY', Non_unique: 0, Seq_in_index: 1, Column_name: 'id' },
      { Key_name: 'uniq_booking_rider_document_link_version', Non_unique: 0, Seq_in_index: 1, Column_name: 'bookingId' },
      { Key_name: 'uniq_booking_rider_document_link_version', Non_unique: 0, Seq_in_index: 2, Column_name: 'versionId' },
    ],
  };
  return { columns: columns[table], indexes: indexes[table] };
}

describe('rider document owner, manager, and entitlement boundary (mocked persistence)', () => {
  it('recognizes only the actual artist-profile user as owner; arbitrary admin roles do not bypass', async () => {
    const owner = await getRiderDocumentContext(accessConnection(), 100, 100);
    expect(owner).toMatchObject({ ownerUserId: 100, isOwner: true, canManage: true });

    // The fixture user row deliberately contains role: admin. It remains a denied outsider.
    await expect(assertRiderDocumentAccess(accessConnection(), 999, 100)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('does not treat a legacy owner-style team role or membership as ownership', async () => {
    const context = await getRiderDocumentContext(accessConnection({
      membership: JSON.stringify({ teamRole: 'owner', manageRiders: false }),
    }), 101, 100);
    expect(context).toMatchObject({ isOwner: false, canManage: false, ownerUserId: 100 });
    await expect(assertRiderDocumentAccess(accessConnection({ membership: { teamRole: 'owner' } }), 101, 100))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('allows a manager only for an exact persisted boolean manageRiders grant', async () => {
    const allowed = await assertRiderDocumentAccess(accessConnection({ membership: JSON.stringify({ manageRiders: true }) }), 101, 100);
    expect(allowed).toMatchObject({ isOwner: false, canManage: true });
  });

  it.each([
    { manageRiders: 'true' },
    { manageRiders: 1 },
    {},
    'not-json',
    [],
    null,
  ])('denies string, numeric, missing, and malformed manager permission %j', async (membership) => {
    await expect(assertRiderDocumentAccess(accessConnection({ membership }), 101, 100))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('permits retained reads for Free but rejects Free writes', async () => {
    await expect(assertRiderDocumentAccess(accessConnection(), 100, 100, { requirePlan: false }))
      .resolves.toMatchObject({ canManage: true, planAllowed: false, tier: 'free' });
    await expect(assertRiderDocumentAccess(accessConnection(), 100, 100, { requirePlan: true }))
      .rejects.toMatchObject({ code: 'FORBIDDEN', message: expect.stringMatching(/Starter/i) });
  });

  it.each([
    { subscription: { tier: 'starter', status: 'active' }, label: 'active Starter subscription' },
    { subscription: { tier: 'professional', status: 'trialing' }, label: 'trialing paid subscription' },
    { grant: { tier: 'starter', status: 'active', expiresAt: new Date(Date.now() + 60_000) }, label: 'active complimentary grant' },
  ])('permits new writes for $label', async ({ subscription, grant }) => {
    await expect(assertRiderDocumentAccess(accessConnection({ subscription, grant }), 100, 100, { requirePlan: true }))
      .resolves.toMatchObject({ planAllowed: true });
  });

  it.each([
    { grant: { tier: 'starter', status: 'active', expiresAt: new Date(Date.now() - 60_000) }, label: 'expired grant' },
    { grant: { tier: 'starter', status: 'revoked', expiresAt: null }, label: 'revoked grant' },
  ])('fails closed for $label', async ({ grant }) => {
    await expect(assertRiderDocumentAccess(accessConnection({ grant }), 100, 100, { requirePlan: true }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('does not fabricate an entitlement if subscription or grant lookups outage', async () => {
    await expect(assertRiderDocumentAccess(accessConnection({ outage: 'subscription' }), 100, 100, { requirePlan: true })).rejects.toThrow(/synthetic billing outage/);
    await expect(assertRiderDocumentAccess(accessConnection({ outage: 'grant' }), 100, 100, { requirePlan: true })).rejects.toThrow(/synthetic grant outage/);
  });
});

describe('private rider PDF input and ciphertext boundary', () => {
  it('sanitizes a real pdf-lib PDF: removes source metadata while preserving usable page count and geometry', async () => {
    const source = await onePagePdf({
      title: 'CONFIDENTIAL source metadata',
      text: 'Monitor mix: kick, vocal, bass',
      size: [612, 792],
    });
    const result = await validateAndSanitizeRiderPdf(source);
    const safe = await PDFDocument.load(result.bytes);

    expect(result).toMatchObject({ pageCount: 1, byteSize: result.bytes.length, sha256: expect.stringMatching(/^[a-f0-9]{64}$/) });
    expect(safe.getPage(0).getSize()).toEqual({ width: 612, height: 792 });
    expect(safe.getTitle()).not.toBe('CONFIDENTIAL source metadata');
    // pdf-lib can parse the returned document, which retains copied (non-rasterized) page content.
    expect(result.bytes.length).toBeGreaterThan(500);
  });

  it('rejects malformed, encrypted, zero-page, over-page, and oversized actual PDF bytes', async () => {
    await expect(validateAndSanitizeRiderPdf(Buffer.from('%PDF-1.7\nbroken\n%%EOF'))).rejects.toBeInstanceOf(RiderPdfValidationError);
    await expect(validateAndSanitizeRiderPdf(await encryptedPdfFromPdfLib())).rejects.toBeInstanceOf(RiderPdfValidationError);

    const empty = await PDFDocument.create();
    await expect(validateAndSanitizeRiderPdf(Buffer.from(await empty.save({ addDefaultPage: false })))).rejects.toBeInstanceOf(RiderPdfValidationError);

    const tooMany = await PDFDocument.create();
    for (let page = 0; page < 101; page += 1) tooMany.addPage([20, 20]);
    await expect(validateAndSanitizeRiderPdf(Buffer.from(await tooMany.save()))).rejects.toBeInstanceOf(RiderPdfValidationError);

    const oversized = Buffer.concat([await onePagePdf(), Buffer.alloc(10 * 1024 * 1024)]);
    await expect(validateAndSanitizeRiderPdf(oversized)).rejects.toBeInstanceOf(RiderPdfValidationError);
  });

  it('rejects real pdf-lib JavaScript, embedded attachment, form, and annotation-bearing documents', async () => {
    const javascript = await PDFDocument.create();
    javascript.addPage([100, 100]);
    javascript.addJavaScript('do-not-run', 'app.alert("no")');

    const attachment = await PDFDocument.create();
    attachment.addPage([100, 100]);
    await attachment.attach(Buffer.from('private'), 'private.txt', { mimeType: 'text/plain' });

    const form = await PDFDocument.create();
    const formPage = form.addPage([100, 100]);
    const field = form.getForm().createTextField('unsafe-field');
    field.addToPage(formPage, { x: 10, y: 10, width: 70, height: 20 });

    for (const dangerous of [javascript, attachment, form]) {
      await expect(validateAndSanitizeRiderPdf(Buffer.from(await dangerous.save({ useObjectStreams: false })))).rejects.toBeInstanceOf(RiderPdfValidationError);
    }
  });

  it('strictly rejects malformed base64 and binds randomized AES-GCM ciphertext to the exact owner and storage key', () => {
    for (const value of ['', 'not base64!', 'YQ=', 'YWJj\n', 'YWJj====']) {
      expect(() => decodeRiderPdfBase64(value)).toThrow(expect.objectContaining({ code: 'BAD_REQUEST' }));
    }

    const plain = Buffer.from('private rider PDF bytes');
    const key = 'private/rider-documents/100/test.bin';
    const first = encryptRiderDocumentBytes(plain, 100, key);
    const second = encryptRiderDocumentBytes(plain, 100, key);
    expect(first.equals(second)).toBe(false);
    expect(decryptRiderDocumentBytes(first, 100, key)).toEqual(plain);

    const tampered = Buffer.from(first);
    tampered[tampered.length - 1] ^= 1;
    for (const attempt of [
      () => decryptRiderDocumentBytes(tampered, 100, key),
      () => decryptRiderDocumentBytes(first, 101, key),
      () => decryptRiderDocumentBytes(first, 100, 'private/rider-documents/100/other.bin'),
    ]) expect(attempt).toThrow(expect.objectContaining({ code: 'NOT_FOUND' }));
  });
});

describe('rider runtime schema is create-only and validates metadata', () => {
  function schemaConnection(options: { missingColumn?: boolean; missingIndex?: boolean } = {}) {
    const execute = vi.fn(async (sql: string) => {
      const table = /`(rider_documents|rider_document_versions|booking_rider_document_links)`/.exec(sql)?.[1];
      if (sql.trim().startsWith('CREATE TABLE')) return [[], {}];
      if (sql.startsWith('SHOW COLUMNS') && table) {
        const columns = metadataFor(table).columns.map((Field) => ({ Field }));
        return [options.missingColumn ? columns.slice(1) : columns, {}];
      }
      if (sql.startsWith('SHOW INDEX') && table) {
        const indexes = metadataFor(table).indexes;
        return [options.missingIndex ? indexes.filter(({ Key_name }) => Key_name !== 'uniq_rider_document_versions_document_number') : indexes, {}];
      }
      throw new Error(`Unexpected schema SQL: ${sql}`);
    });
    return { execute };
  }

  it('creates only the three declared tables, never alters/application-writes, and validates declared indexes', async () => {
    const db = schemaConnection();
    await expect(ensureRiderDocumentSchema(db)).resolves.toBeUndefined();
    const statements = db.execute.mock.calls.map(([sql]: [string]) => sql.trim());
    const creates = statements.filter((sql: string) => sql.startsWith('CREATE TABLE'));
    expect(creates).toHaveLength(3);
    expect(creates.join('\n')).toMatch(/rider_documents/);
    expect(creates.join('\n')).toMatch(/rider_document_versions/);
    expect(creates.join('\n')).toMatch(/booking_rider_document_links/);
    expect(statements.some((sql: string) => /^(?:ALTER|DROP|INSERT|UPDATE|DELETE)\b/i.test(sql))).toBe(false);
    expect(statements.filter((sql: string) => sql.startsWith('SHOW INDEX'))).toHaveLength(2);
  });

  it('fails closed when declared table metadata or a required index is absent', async () => {
    await expect(ensureRiderDocumentSchema(schemaConnection({ missingColumn: true }))).rejects.toThrow(/schema is incomplete/i);
    await expect(ensureRiderDocumentSchema(schemaConnection({ missingIndex: true }))).rejects.toThrow(/unique scope|schema/i);
  });
});
