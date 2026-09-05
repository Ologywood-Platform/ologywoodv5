import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { selectUniquePlayablePurchases } from './services/myOlogyReleaseLibrary';

const read = (relativePath: string) => fs.readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8');

const purchase = (
  id: number,
  releaseId: number,
  purchasedAt: string,
  options: { hidden?: boolean; playable?: boolean; title?: string } = {},
) => ({
  id,
  releaseId,
  purchasedAt,
  hiddenFromLibrary: options.hidden ?? false,
  release: options.playable === false
    ? null
    : { audioFileKey: `releases/${releaseId}/song.mp3`, title: options.title ?? `Song ${releaseId}` },
});

describe('My Ology release purchase and library aggregation', () => {
  it('keeps one playable library item when the same release was purchased twice', () => {
    const purchases = [
      purchase(10, 4, '2026-08-30T12:00:00Z'),
      purchase(11, 4, '2026-09-01T12:00:00Z'),
    ];

    expect(purchases).toHaveLength(2);
    expect(selectUniquePlayablePurchases(purchases)).toEqual([purchases[1]]);
  });

  it('keeps separate playable releases while choosing the newest entitlement per release', () => {
    const purchases = [
      purchase(1, 4, '2026-08-01T12:00:00Z'),
      purchase(2, 8, '2026-08-02T12:00:00Z'),
      purchase(3, 4, '2026-08-03T12:00:00Z'),
    ];

    expect(selectUniquePlayablePurchases(purchases).map((entry) => entry.id)).toEqual([3, 2]);
  });

  it('excludes hidden and unplayable legacy rows without deleting purchase history', () => {
    const purchases = [
      purchase(1, 4, '2026-08-01T12:00:00Z'),
      purchase(2, 4, '2026-08-02T12:00:00Z', { hidden: true }),
      purchase(3, 9, '2026-08-03T12:00:00Z', { playable: false }),
    ];

    expect(purchases).toHaveLength(3);
    expect(selectUniquePlayablePurchases(purchases).map((entry) => entry.id)).toEqual([1]);
  });

  it('uses a joined legacy-safe release summary for My Ology instead of a full-row N-plus-one lookup', () => {
    const databaseSource = read('server/db.ts');
    const routerSource = read('server/routers/release.ts');
    const deliverySource = read('server/routes/releaseDownload.ts');

    expect(databaseSource).toContain('.leftJoin(artistReleases, eq(releasePurchases.releaseId, artistReleases.id))');
    expect(databaseSource).toContain('audioFileKey: artistReleases.audioFileKey');
    expect(databaseSource).not.toContain('const release = await getReleaseById(purchase.releaseId)');
    expect(routerSource).toContain('selectUniquePlayablePurchases(purchases)');
    expect(routerSource).toContain('getReleaseDeliveryById(purchase.releaseId)');
    expect(deliverySource).toContain('getReleaseDeliveryById(purchase.releaseId)');
    expect(deliverySource).toContain('getReleaseDeliveryById(releaseId)');
  });

  it('keeps purchase-history and library counts as separate My Ology concepts', () => {
    const myOlogySource = read('client/src/pages/MyOlogy.tsx');

    expect(myOlogySource).toContain("label: 'Release purchases', count: data.purchases.length");
    expect(myOlogySource).toContain("label: 'Music library', count: data.library.length");
  });
});
