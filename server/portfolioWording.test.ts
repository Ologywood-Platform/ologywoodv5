import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const pagesDir = path.resolve(__dirname, '../client/src/pages');
const profileSource = fs.readFileSync(path.join(pagesDir, 'ArtistProfile.tsx'), 'utf8');
const portfolioSource = fs.readFileSync(path.join(pagesDir, 'ArtistHistory.tsx'), 'utf8');

describe('creator-neutral portfolio wording', () => {
  it('uses a universal Portfolio heading and description on public profiles', () => {
    expect(profileSource).toContain('<CardTitle>Portfolio</CardTitle>');
    expect(profileSource).toContain('Selected work, projects, appearances, and creative highlights');
    expect(profileSource).toContain('Explore previous work and professional experience from this creator.');
    expect(profileSource).not.toContain('<CardTitle>Performance Portfolio</CardTitle>');
  });

  it('uses creator-neutral metadata, headings, and empty states on the full portfolio page', () => {
    expect(portfolioSource).toContain('`${artistName} - Portfolio | Ologywood`');
    expect(portfolioSource).toContain('Portfolio Coming Soon');
    expect(portfolioSource).toContain('Add Your First Portfolio Entry');
    expect(portfolioSource).toContain('Delete Portfolio Entry');
    expect(portfolioSource).not.toContain('Performance Portfolio');
    expect(portfolioSource).not.toContain('No Performance History Yet');
  });
});
