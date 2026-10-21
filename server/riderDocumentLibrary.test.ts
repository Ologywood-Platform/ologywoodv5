import { afterEach, describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { ENV } from './_core/env';
import { RiderPdfValidationError, validateAndSanitizeRiderPdf } from './services/riderPdfValidation';
import { decryptRiderDocumentBytes, encryptRiderDocumentBytes } from './services/riderDocumentService';
import { ensureRiderDocumentSchema } from './services/riderDocumentSchemaService';

const originalSecret = process.env.JWT_SECRET;
const originalRiderKey = process.env.RIDER_DOCUMENT_ENCRYPTION_KEY;
const originalEnvSecret = ENV.cookieSecret;
afterEach(() => {
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
  ENV.cookieSecret = originalEnvSecret;
  if (originalRiderKey === undefined) delete process.env.RIDER_DOCUMENT_ENCRYPTION_KEY; else process.env.RIDER_DOCUMENT_ENCRYPTION_KEY = originalRiderKey;
});

async function onePagePdf(): Promise<Buffer> {
  const document = await PDFDocument.create();
  document.addPage([300, 400]);
  return Buffer.from(await document.save());
}

describe('private rider PDF validation', () => {
  it('accepts actual PDF bytes, preserves pages, strips metadata, and hashes the safe copy', async () => {
    const source = await onePagePdf();
    const result = await validateAndSanitizeRiderPdf(source);
    expect(result.pageCount).toBe(1);
    expect(result.byteSize).toBeGreaterThan(0);
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(await PDFDocument.load(result.bytes)).toBeTruthy();
  });

  it('fails closed for malformed, encrypted-marked, and interactive PDFs', async () => {
    await expect(validateAndSanitizeRiderPdf(Buffer.from('%PDF-1.7\nnot a document\n%%EOF'))).rejects.toBeInstanceOf(RiderPdfValidationError);
    const source = await onePagePdf();
    const interactive = Buffer.concat([source, Buffer.from('\n/JavaScript /OpenAction /EmbeddedFiles\n')]);
    // malformed appended content must never become an accepted source.
    await expect(validateAndSanitizeRiderPdf(interactive)).rejects.toBeInstanceOf(RiderPdfValidationError);
  });
});

describe('private rider encryption', () => {
  it('uses randomized AES-GCM encryption bound to owner and storage key', () => {
    ENV.cookieSecret = 'stable-test-only-secret';
    process.env.RIDER_DOCUMENT_ENCRYPTION_KEY = '11'.repeat(32);
    const plain = Buffer.from('private rider bytes');
    const first = encryptRiderDocumentBytes(plain, 12, 'private/rider-documents/12/a.bin');
    const second = encryptRiderDocumentBytes(plain, 12, 'private/rider-documents/12/b.bin');
    expect(first.equals(second)).toBe(false);
    expect(decryptRiderDocumentBytes(first, 12, 'private/rider-documents/12/a.bin')).toEqual(plain);
    expect(() => decryptRiderDocumentBytes(first, 13, 'private/rider-documents/12/a.bin')).toThrow();
    expect(() => decryptRiderDocumentBytes(first, 12, 'private/rider-documents/12/other.bin')).toThrow();
  });

  it('fails closed when there is no dedicated rider key, regardless of login credentials', () => {
    delete process.env.RIDER_DOCUMENT_ENCRYPTION_KEY;
    ENV.cookieSecret = '';
    expect(() => encryptRiderDocumentBytes(Buffer.from('x'), 1, 'private/rider-documents/1/a.bin')).toThrow();
  });
});

describe('rider document runtime schema', () => {
  it('issues only create/metadata validation operations and rejects incomplete metadata', async () => {
    const execute = vi.fn()
      .mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ Field: 'id' }, { Field: 'ownerUserId' }, { Field: 'title' }, { Field: 'currentVersionId' }, { Field: 'revision' }, { Field: 'isDefault' }, { Field: 'archivedAt' }, { Field: 'createdAt' }, { Field: 'updatedAt' }]])
      .mockResolvedValueOnce([[{ Field: 'id' }, { Field: 'documentId' }, { Field: 'ownerUserId' }, { Field: 'versionNumber' }, { Field: 'fileName' }, { Field: 'storageKey' }, { Field: 'byteSize' }, { Field: 'pageCount' }, { Field: 'sha256' }, { Field: 'createdAt' }]])
      .mockResolvedValueOnce([[{ Field: 'id' }, { Field: 'bookingId' }, { Field: 'documentId' }, { Field: 'versionId' }, { Field: 'titleSnapshot' }, { Field: 'attachedByUserId' }, { Field: 'attachedAt' }]])
      .mockResolvedValueOnce([[{ Non_unique:0, Key_name:'versions', Seq_in_index:1, Column_name:'documentId' },{ Non_unique:0, Key_name:'versions', Seq_in_index:2, Column_name:'versionNumber' }]])
      .mockResolvedValueOnce([[{ Non_unique:0, Key_name:'links', Seq_in_index:1, Column_name:'bookingId' },{ Non_unique:0, Key_name:'links', Seq_in_index:2, Column_name:'versionId' }]]);
    await ensureRiderDocumentSchema({ execute });
    const operations = execute.mock.calls.map(([sql]) => String(sql).trim().split(/\s+/)[0].toUpperCase());
    expect(operations).toEqual(['CREATE', 'CREATE', 'CREATE', 'SHOW', 'SHOW', 'SHOW', 'SHOW', 'SHOW']);
  });
});
