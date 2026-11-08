import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('release preview route input boundary', () => {
  it('uses the shared positive route-ID parser for public previews', () => {
    const source = readFileSync('server/routes/releaseDownload.ts', 'utf8');
    expect(source).toContain('import { positiveRouteId } from "./routeInput"');
    expect(source).toContain('const releaseId = positiveRouteId(req.params.releaseId);');
    expect(source).not.toContain('Number(req.params.releaseId)');
    expect(source).not.toContain('Number.isInteger(releaseId)');
  });
});
