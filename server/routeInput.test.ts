import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { positiveRouteId } from './routes/routeInput';

function routeSources(directory: string): string[] {
  return readdirSync(resolve(process.cwd(), directory), { withFileTypes: true }).flatMap((entry) => {
    const relative = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return routeSources(relative);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')
      ? [relative]
      : [];
  });
}

describe('strict Express route input validation', () => {
  it('accepts only positive safe integer values', () => {
    for (const value of ['1', '42', 7]) expect(positiveRouteId(value)).toBeGreaterThan(0);
    for (const value of ['', '0', '-1', '1.5', '12abc', '1e3', '999999999999999999999', null, undefined, true]) {
      expect(positiveRouteId(value)).toBeNull();
    }
  });

  it('removes permissive parseInt(req.params) conversions from production route sources', () => {
    const offenders = routeSources('server/routes').filter((file) => {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8');
      return /parseInt\(\s*req\.params\./.test(source);
    });
    expect(offenders).toEqual([]);
  });
});
