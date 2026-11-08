import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('database query optimizations', () => {
  it('batches favorite artist profile lookups instead of issuing one query per favorite', () => {
    const source = readFileSync('server/db.ts', 'utf8');
    const start = source.indexOf('export async function getFavoritesByVenue');
    const end = source.indexOf('\nexport async function isFavorited', start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const block = source.slice(start, end);
    expect(block).toContain('new Set(favs.map(fav => fav.artistId))');
    expect(block).toContain('inArray(artistProfiles.id, artistIds)');
    expect(block).not.toContain('favs.map(async');
    expect(block).not.toContain('where(eq(artistProfiles.id, fav.artistId))');
  });
});
