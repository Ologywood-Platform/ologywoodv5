import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Sentry health response safety', () => {
  it('does not interpolate provider exception text into health responses', () => {
    const source = fs.readFileSync(path.resolve(__dirname, './sentry.ts'), 'utf8');
    expect(source).toContain("message: 'Sentry health check failed'");
    expect(source).not.toContain('error?.message');
  });
});
