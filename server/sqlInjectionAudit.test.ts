import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

function productionServerSources(directory: string): string[] {
  return readdirSync(resolve(process.cwd(), directory), { withFileTypes: true }).flatMap((entry) => {
    const relative = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return productionServerSources(relative);
    if (!entry.name.endsWith('.ts') || entry.name.endsWith('.test.ts')) return [];
    return [relative];
  });
}

describe('raw SQL injection boundaries', () => {
  it('binds dynamic booking cancellation values and quotes only internal column keys', () => {
    const source = read('server/services/bookingCancellation.ts');
    expect(source).toContain("const updateData: any = {");
    expect(source).toContain("columns.map(key => '`'+key+'`=?')");
    expect(source).toContain('[...columns.map(key => updateData[key]), bookingId]');
    expect(source).not.toContain('`UPDATE bookings SET ${reason}');
  });

  it('uses placeholder counts for dynamically sized user-id locks', () => {
    for (const relativePath of [
      'server/services/bookingRiderCreationService.ts',
      'server/services/riderDocumentAccessService.ts',
      'server/services/riderTeamPermissionService.ts',
    ]) {
      const source = read(relativePath);
      expect(source).toMatch(/(?:ids|userIds)\.map\(\(\) => '\?'\)\.join\(','\)/);
    }
  });

  it('keeps Ology Live dynamic conditions separate from bound values', () => {
    const source = read('server/services/ologyLiveCheckoutService.ts');
    expect(source).toContain('conditions.join(\' AND \')');
    expect(source).toContain('pool.execute(');
    expect(source).toContain('values,');
    expect(source).not.toMatch(/WHERE \$\{[^}]*input\./);
  });

  it('finds no direct execute/query template interpolation of request-controlled values', () => {
    const unsafeDirectInterpolation = /(?:execute|query)\s*\(\s*`[^`]*\$\{\s*(?:input|req|request|body|params|query)\b/i;
    const offenders: string[] = [];

    for (const relativePath of productionServerSources('server')) {
      const source = read(relativePath);
      if (unsafeDirectInterpolation.test(source)) offenders.push(relativePath);
    }

    expect(offenders).toEqual([]);
  });

  it('does not build sql.raw templates from request-controlled variables', () => {
    const unsafeRawSql = /sql\.raw\s*\(\s*`[^`]*\$\{\s*(?:input|req|request|body|params|query)\b/i;
    const offenders: string[] = [];

    for (const relativePath of productionServerSources('server')) {
      const source = read(relativePath);
      if (unsafeRawSql.test(source)) offenders.push(relativePath);
    }

    expect(offenders).toEqual([]);
  });
});
