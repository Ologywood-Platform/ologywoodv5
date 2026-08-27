import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getExternalStoreDestination, normalizeExternalStoreUrl } from '../shared/externalStore';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('external merch destination safety and recovery', () => {
  it('canonicalizes Dawud’s Etsy listing and removes tracking data', () => {
    expect(normalizeExternalStoreUrl(
      'https://etsy.com/listing/4516371075/first-crush-art-tee-romantic-black-love?utm_source=ologywood&ref=share#details'
    )).toBe('https://www.etsy.com/listing/4516371075/first-crush-art-tee-romantic-black-love');

    expect(getExternalStoreDestination(
      'https://www.etsy.com/listing/4516371075/first-crush-art-tee-romantic-black-love'
    )).toMatchObject({
      storeName: 'Etsy',
      displayDomain: 'etsy.com',
    });
  });

  it('rejects private, credentialed, editor, preview, account, and non-web destinations', () => {
    const invalid = [
      'http://localhost:3000/product',
      'https://user:secret@example.com/product',
      'https://example.com/admin/product/1',
      'https://example.com/preview/product/1',
      'https://example.com/account/orders',
      'javascript:alert(1)',
    ];
    for (const url of invalid) expect(() => normalizeExternalStoreUrl(url)).toThrow();
  });

  it('normalizes external links during merch creation and editing', () => {
    const router = source('server/routers/merch.ts');
    expect(router).toContain('normalizeExternalStoreUrlOrThrow');
    expect(router).toContain('externalUrl: normalizedExternalUrl');
    expect(router).toContain('updates.externalUrl = normalizedInputExternalUrl');
  });

  it('keeps external checkout behind a clear confirmation and recovery path', () => {
    const page = source('client/src/pages/MerchItem.tsx');
    const dialog = source('client/src/components/ExternalStoreDialog.tsx');
    expect(page).toContain('setExternalStoreOpen(true)');
    expect(page).toContain('<ExternalStoreDialog');
    expect(page).not.toContain("window.open(item.externalUrl");
    expect(dialog).toContain("window.open(destination.url, '_blank', 'noopener,noreferrer')");
    expect(dialog).toContain('Stay on OlogyWood');
    expect(dialog).toContain('Copy link');
    expect(dialog).toContain('If the store temporarily restricts access');
    expect(dialog).toContain('OlogyWood cannot remove restrictions imposed by an outside store');
  });

  it('preserves native OlogyWood checkout as a separate flow', () => {
    const page = source('client/src/pages/MerchItem.tsx');
    expect(page).toContain("if (item.sellingMethod === 'external')");
    expect(page).toContain('if (!soldOut) setCheckoutOpen(true)');
    expect(page).toContain('<MerchCheckoutDialog');
  });
});
