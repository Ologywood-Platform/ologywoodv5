import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const aboutSource = readFileSync('client/src/pages/About.tsx', 'utf8');
const seoSource = readFileSync('client/src/utils/seoMeta.ts', 'utf8');

describe('About page SEO', () => {
  it('uses the dedicated About metadata preset and founder structured data', () => {
    expect(aboutSource).toContain('setMetaTags(pageMetaTags.about)');
    expect(aboutSource).toContain('"@type": "Person"');
    expect(aboutSource).toContain('buildBreadcrumbJsonLd');
    expect(aboutSource).toContain('https://www.linkedin.com/in/gary-chisolm-ab835241/');
    expect(aboutSource).toContain('https://x.com/ChizoWorldwide');
  });

  it('keeps the About metadata descriptive and within the standard description range', async () => {
    const { pageMetaTags } = await import('../client/src/utils/seoMeta');
    expect(pageMetaTags.about.title).toContain('Gary Chisolm');
    expect(pageMetaTags.about.description.length).toBeGreaterThanOrEqual(50);
    expect(pageMetaTags.about.description.length).toBeLessThanOrEqual(160);
    expect(seoSource).toContain("ogImageAlt: 'Gary Chisolm, founder of Ologywood'");
  });
});
