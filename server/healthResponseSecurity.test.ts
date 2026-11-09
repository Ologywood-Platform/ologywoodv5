import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('health response safety', () => {
  it('does not expose raw database or health exception text', () => {
    const source = fs.readFileSync(path.resolve(__dirname, './health.ts'), 'utf8');
    expect(source).toContain("message: 'Database connection failed'");
    expect(source).toContain('errorKind: error instanceof Error ? error.name :');
    expect(source).not.toContain('message: error?.message');
    expect(source).not.toContain('details: { error: error?.message }');
  });
});
