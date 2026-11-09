import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('legacy video upload validation', () => {
  it('rejects non-finite/out-of-range durations and derives extension from MIME', () => {
    const source = readFileSync('server/routes/videoUpload.ts', 'utf8');
    expect(source).toContain('Number(rawDuration)');
    expect(source).toContain('Number.isFinite(durationSeconds)');
    expect(source).toContain('durationSeconds < 0 || durationSeconds > 300');
    expect(source).toContain('VIDEO_EXTENSION_BY_MIME[file.mimetype]');
    expect(source).not.toContain("file.originalname.split('.')");
  });

  it('retains the explicit supported MIME allowlist on the legacy multer path', () => {
    const source = readFileSync('server/routes/videoUpload.ts', 'utf8');
    expect(source).toContain("'video/mp4'");
    expect(source).toContain("'video/quicktime'");
    expect(source).toContain("'video/webm'");
    expect(source).toContain('Unsupported video format');
  });

  it('rejects coercive chunk indexes and non-scalar multipart fields', () => {
    const source = readFileSync('server/routes/videoUpload.ts', 'utf8');
    expect(source).toContain('function strictChunkIndex(value: string | undefined): number');
    expect(source).toContain("/^(?:0|[1-9][0-9]*)$/");
    expect(source).toContain("strictChunkIndex(req.header('x-performance-upload-index') || undefined)");
    expect(source).toContain("strictChunkIndex(req.header('x-portfolio-upload-index') || undefined)");
    expect(source).toContain("typeof rawTitle !== 'string'");
    expect(source).toContain("Invalid portfolio video fields");
    expect(source).not.toContain("Number(req.header('x-performance-upload-index'))");
    expect(source).not.toContain("Number(req.header('x-portfolio-upload-index'))");
  });

  it('keeps video-upload failure logs free of raw exception objects', () => {
    const source = readFileSync('server/routes/videoUpload.ts', 'utf8');
    expect(source).toContain("kind: err instanceof Error ? err.name : 'UnknownError'");
    expect(source).not.toContain("console.error('[Video Upload Error]', err)");
    expect(source).not.toContain("console.error('[Portfolio Video Finalize Error]', err)");
  });
});
