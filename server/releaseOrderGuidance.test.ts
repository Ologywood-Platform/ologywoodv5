import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { getCanonicalNavigationAnswer, SINGLE_ORDER_GUIDANCE, MUSIC_PURCHASE_GUIDANCE, MUSIC_UPLOAD_GUIDANCE } from './routers/aiChat';

describe('Single arrangement guidance', () => {
  it.each(['How do I reorder singles?', 'Reposition my music releases', 'Arrange the songs on my profile', 'Change singles order', 'Move my song up', 'Sort releases'])('answers arrangement question without a model call: %s', question => {
    expect(getCanonicalNavigationAnswer(question)).toBe(SINGLE_ORDER_GUIDANCE);
  });
  it('does not treat a music purchase order as a sorting request', () => {
    expect(getCanonicalNavigationAnswer('Where is my music purchase order?')).toBe(MUSIC_PURCHASE_GUIDANCE);
  });
  it('preserves downloadable song upload guidance', () => {
    expect(getCanonicalNavigationAnswer('How do I upload songs fans can download?')).toBe(MUSIC_UPLOAD_GUIDANCE);
  });
  it('explains ownership, explicit save, new singles, and unchanged commerce', () => {
    for (const phrase of ['Music Releases', 'Content Releases', 'Only published singles', 'Move Up', 'Move Down', 'Save Order', 'Cancel', 'Reset to Newest', 'actual creator profile owner', 'not prices, fees, purchases, previews, downloads, fan playlists']) expect(SINGLE_ORDER_GUIDANCE).toContain(phrase);
  });
  it('provides an article within the existing Content Releases Help category', () => {
    const help = readFileSync(new URL('../client/src/pages/Help.tsx', import.meta.url), 'utf8');
    expect(help).toMatch(/id: 'reorder-profile-singles',[\s\S]*?category: 'Content Releases'/);
    expect(help).toContain('How do I change the order of singles on my profile?');
  });
});
