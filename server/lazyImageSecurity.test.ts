import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('lazy image loading', () => {
  it('observes the sized container so empty image elements can enter the viewport', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../client/src/components/LazyImage.tsx'),
      'utf8',
    );
    expect(source).toContain('observer.observe(containerRef.current)');
    expect(source).toContain('observer.unobserve(containerRef.current)');
    expect(source).not.toContain('observer.observe(imgRef.current)');
  });
});
