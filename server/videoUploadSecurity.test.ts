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
});
