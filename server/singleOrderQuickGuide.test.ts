import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
vi.mock('@/components/SiteHeader', () => ({ default: () => null }));
vi.mock('@/utils/seoMeta', () => ({ setMetaTags: vi.fn(), pageMetaTags: { help: {} } }));
import { getRequestedHelpArticle } from '../client/src/pages/Help';
import { getCanonicalNavigationAnswer, SINGLE_ORDER_GUIDANCE } from './routers/aiChat';
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const guide = read('client/src/components/SingleOrderQuickGuide.tsx');
const reorder = read('client/src/components/ReorderSingles.tsx');
const help = read('client/src/pages/Help.tsx');

describe('Single reordering quick guide', () => {
  it('provides touch/keyboard click-open guidance rather than hover-only instructions', () => {
    expect(guide).toContain('<PopoverTrigger asChild>');
    expect(guide).toContain('type="button"');
    expect(guide).toContain('How to reorder singles in ${section}');
    expect(guide).toContain('aria-labelledby={headingId}');
    expect(guide).toContain('max-w-[calc(100vw-2rem)]');
    expect(guide).toContain('z-[71]');
  });
  it('is static and cannot query, upload, or save an order', () => {
    expect(guide).not.toMatch(/\btrpc\b|\bfetch\s*\(|useMutation|useQuery|localStorage/);
    expect(guide).not.toContain('draggable=');
  });
  it('explains explicit save/cancel and scoped reset without changing commerce', () => {
    for (const text of ['Only published singles appear.', 'Move Up', 'Move Down', 'Save Order', 'Cancel', 'after confirmation', 'resets the published-single order', 'Newly published singles appear after your saved order', 'Prices, purchases, and fan playlists do not change.']) expect(guide).toContain(text);
  });
  it('uses the same owner-gated component for both release managers', () => {
    expect(reorder.indexOf('if (!enabled || !ownerAccountId) return null;')).toBeLessThan(reorder.indexOf('<SingleOrderQuickGuide kind={kind} />'));
    expect(guide).toContain('kind === "music" ? "Music Releases" : "Content Releases"');
  });
  it('provides visible dialog tips and hover titles without changing move callbacks', () => {
    expect(reorder).toContain('Quick tip:');
    expect(reorder).toContain('title="Move this single one position up"');
    expect(reorder).toContain('title="Move this single one position down"');
    expect(reorder).toContain('onClick={() => moveItem(index, index - 1)}');
  });
  it('opens the existing full article in a safe new tab so the manager draft is not lost', () => {
    expect(guide).toContain('/help?article=reorder-profile-singles#reorder-profile-singles');
    expect(guide).toContain('target="_blank" rel="noopener noreferrer"');
    const article=getRequestedHelpArticle('?article=reorder-profile-singles');
    expect(article?.id).toBe('reorder-profile-singles');
    expect(article?.answer).toContain('tap How to reorder beside that button');
  });
  it.each(['','?article=unknown','?article=javascript%3Aalert(1)','?article=%3Cscript%3E','?article=%E0%A4%A'])('ignores unknown or malformed article selectors: %s', search => {
    expect(getRequestedHelpArticle(search)).toBeUndefined();
  });
  it('supports known URL-encoded article IDs without changing normal search/filter controls', () => {
    expect(getRequestedHelpArticle('?article=reorder%2Dprofile%2Dsingles')?.category).toBe('Content Releases');
    expect(help).toContain('setSelectedCategory(article.category)');
    expect(help).toContain('setExpandedId(article.id)');
    expect(help).toContain('id={item.id}');
    expect(help).toContain('aria-expanded={expandedId === item.id}');
    expect(help).toContain('cancelAnimationFrame(frame)');
  });
  it('makes the quick guide discoverable in deterministic AI answers', () => {
    expect(getCanonicalNavigationAnswer('How do I use Reorder Singles?')).toBe(SINGLE_ORDER_GUIDANCE);
    expect(SINGLE_ORDER_GUIDANCE).toContain('Choose How to reorder beside that button');
  });
});
