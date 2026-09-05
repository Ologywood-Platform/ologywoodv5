import fs from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ensureArtistReleaseDisclosureSchema,
  resetArtistReleaseDisclosureSchemaForTests,
} from './services/artistReleaseSchemaService';

describe('artist release disclosure runtime schema guard', () => {
  beforeEach(() => resetArtistReleaseDisclosureSchemaForTests());

  it('adds only the five optional disclosure columns idempotently', async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const database = { execute };

    await ensureArtistReleaseDisclosureSchema(database);
    await ensureArtistReleaseDisclosureSchema(database);

    expect(execute).toHaveBeenCalledTimes(5);
    const source = fs.readFileSync(new URL('./services/artistReleaseSchemaService.ts', import.meta.url), 'utf8');
    expect(source).toContain('ALTER TABLE \\`artist_releases\\` ADD COLUMN IF NOT EXISTS');
    expect(source).toContain('aiUseDisclosureEnabled');
    expect(source).toContain('aiUseNotes');
    expect(source).not.toContain('release_purchases');
  });

  it('clears the cache after failure so a later request can repair the schema', async () => {
    const failedExecute = vi.fn().mockRejectedValueOnce(new Error('temporary DDL failure'));
    await expect(ensureArtistReleaseDisclosureSchema({ execute: failedExecute })).rejects.toThrow('temporary DDL failure');

    const recoveredExecute = vi.fn().mockResolvedValue(undefined);
    await expect(ensureArtistReleaseDisclosureSchema({ execute: recoveredExecute })).resolves.toBeUndefined();
    expect(recoveredExecute).toHaveBeenCalledTimes(5);
  });
});
