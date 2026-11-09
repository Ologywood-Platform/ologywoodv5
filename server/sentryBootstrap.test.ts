import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Sentry bootstrap wiring', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, './_core/index.ts'),
    'utf8',
  );

  it('imports and initializes optional Sentry monitoring in the active server entrypoint', () => {
    expect(source).toContain("import { initializeSentry } from '../sentry';");
    expect(source).toContain('initializeSentry(app);');
    expect(source.indexOf('initializeSentry(app);')).toBeLessThan(
      source.indexOf("app.get('/api/health'"),
    );
  });
});
