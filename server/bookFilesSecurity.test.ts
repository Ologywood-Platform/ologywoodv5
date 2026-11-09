import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { positiveRouteId } from './routes/routeInput';

const source = readFileSync('server/routes/bookFiles.ts', 'utf8');

describe('eBook file route security boundaries', () => {
  it('uses strict route IDs for upload and download access', () => {
    expect(source).toContain('positiveRouteId(req.params.itemId)');
    expect(source).toContain('positiveRouteId(req.params.accessId)');
    expect(source).not.toContain('Number(req.params.itemId)');
    expect(source).not.toContain('Number(req.params.accessId)');
    expect(positiveRouteId('12junk')).toBeNull();
    expect(positiveRouteId('0')).toBeNull();
  });

  it('checks file signatures in addition to the declared eBook MIME type', () => {
    expect(source).toContain("buffer.subarray(0, 5).toString('ascii') === '%PDF-'");
    expect(source).toContain('Buffer.from([0x50, 0x4b, 0x03, 0x04])');
    expect(source).toContain('hasValidEbookSignature(req.file.buffer, req.file.mimetype)');
  });

  it('accepts only route-generated eBook storage keys before storage retrieval', () => {
    expect(source).toContain('isSafeEbookStorageKey(access.ebookFileKey)');
    expect(source).toContain("/^ebooks\\/\\d+\\/\\d+\\/[a-zA-Z0-9._-]{1,220}$/");
  });

  it('keeps uploader ownership, rights confirmation, paid access, and atomic download limits', () => {
    expect(source).toContain("req.body?.rightsConfirmed !== 'true'");
    expect(source).toContain("Unknown eBook upload field");
    expect(source).toContain('Number(item.userId) !== user.id');
    expect(source).toContain("access.paymentStatus !== 'paid' || access.status !== 'active'");
    expect(source).toContain("downloadCount < maxDownloads");
  });

  it('does not log raw upload/download exceptions', () => {
    expect(source).toContain("kind: error instanceof Error ? error.name : 'UnknownError'");
    expect(source).not.toContain("console.error('[Book File Upload Error]', error)");
    expect(source).not.toContain("console.error('[Book Download Error]', error)");
  });
});
