import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const seoSource = readFileSync(resolve(process.cwd(), 'client/src/utils/seoMeta.ts'), 'utf8');
const homeSource = readFileSync(resolve(process.cwd(), 'client/src/pages/Home.tsx'), 'utf8');

function extractHomeDescription() {
  const match = seoSource.match(/home:\s*\{[\s\S]*?description:\s*'([^']+)'/);
  if (!match?.[1]) throw new Error('Homepage SEO description was not found');
  return match[1];
}

describe('homepage SEO accessibility', () => {
  it('keeps the homepage description between 50 and 160 characters', () => {
    const description = extractHomeDescription();
    expect(description.length).toBeGreaterThanOrEqual(50);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('provides descriptive alt text for every homepage image', () => {
    expect(homeSource).toContain('alt="Singer performing on stage beside an athlete and filmmaker representing OlogyWood creators"');
    expect(homeSource).toContain('alt={`${category.title}: ${category.description}`}');
    expect(homeSource).not.toContain('alt=""');
  });
});
