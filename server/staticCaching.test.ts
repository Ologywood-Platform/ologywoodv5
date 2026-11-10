import { describe, expect, it } from 'vitest';
import { getStaticAssetCacheControl, SPA_SHELL_CACHE_CONTROL } from './_core/vite';

describe('production static cache policy', () => {
  it('caches Vite content-hashed assets for one year', () => {
    expect(getStaticAssetCacheControl('/dist/public/assets/index-CIG9vJlN.js'))
      .toBe('public, max-age=31536000, immutable');
    expect(getStaticAssetCacheControl('/dist/public/assets/vendor-ui-BTMBPsti.js'))
      .toBe('public, max-age=31536000, immutable');
    expect(getStaticAssetCacheControl('C:\\app\\dist\\public\\assets\\styles-a1b2c3d4.css'))
      .toBe('public, max-age=31536000, immutable');
  });

  it('revalidates the app shell and service-worker metadata', () => {
    const noStore = 'no-cache, no-store, must-revalidate';
    expect(getStaticAssetCacheControl('/dist/public/index.html')).toBe(noStore);
    expect(getStaticAssetCacheControl('/dist/public/manifest.json')).toBe(noStore);
    expect(getStaticAssetCacheControl('/dist/public/sw.js')).toBe(noStore);
  });

  it('does not long-cache unhashed or unrelated files', () => {
    expect(getStaticAssetCacheControl('/dist/public/assets/logo.png')).toBeNull();
    expect(getStaticAssetCacheControl('/dist/public/robots.txt')).toBeNull();
  });

  it('uses only a short cache for SPA fallback HTML', () => {
    expect(SPA_SHELL_CACHE_CONTROL).toBe('public, max-age=60, stale-while-revalidate=300');
  });
});
