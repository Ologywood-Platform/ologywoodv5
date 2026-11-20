import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const seoSource = readFileSync(resolve(process.cwd(), 'client/src/utils/seoMeta.ts'), 'utf8');
const homeSource = readFileSync(resolve(process.cwd(), 'client/src/pages/Home.tsx'), 'utf8');
const homeCssSource = readFileSync(resolve(process.cwd(), 'client/src/pages/Home.css'), 'utf8');
const auditedPageSources = [
  'client/src/pages/ArtistDashboardV3.tsx',
  'client/src/pages/BlogAdmin.tsx',
  'client/src/pages/Browse.tsx',
  'client/src/pages/FanClubDiscovery.tsx',
  'client/src/pages/SponsorDashboard.tsx',
  'client/src/pages/TeamManagement.tsx',
  'client/src/pages/VenueDashboard.tsx',
].map(file => ({ file, source: readFileSync(resolve(process.cwd(), file), 'utf8') }));

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
  it('keeps the hero prioritized and category images lazy with the fade-in treatment', () => {
    expect(homeSource).toContain('className="home-hero-image home-image-fade-in"');
    expect(homeSource).toContain('fetchPriority="high"');
    expect(homeSource).toContain('className="home-category-image home-image-fade-in"');
    expect(homeSource).toContain('loading="lazy"');
    expect(homeSource).toContain('decoding="async"');
    expect(homeCssSource).toContain('@keyframes home-image-fade-in');
    expect(homeCssSource).toContain('@media (prefers-reduced-motion: reduce)');
  });
  it('has no empty alt attributes in the remaining audited page sources', () => {
    for (const { file, source } of auditedPageSources) {
      expect(source, file).not.toContain('alt=""');
    }
  });
});
