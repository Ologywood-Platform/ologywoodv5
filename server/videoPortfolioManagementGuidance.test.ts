import { describe, expect, it, vi } from 'vitest';
vi.mock('./_core/llm', () => ({ invokeLLM: vi.fn() }));
import { getCanonicalNavigationAnswer, VIDEO_PORTFOLIO_MANAGEMENT_GUIDANCE, SINGLE_ORDER_GUIDANCE } from './routers/aiChat';
import { readFileSync } from 'node:fs';

const help = readFileSync(new URL('../client/src/pages/Help.tsx', import.meta.url), 'utf8');
describe('Video Portfolio management support', () => {
  it.each([
    'How do I edit a Video Portfolio title?',
    'I need to fix spelling in my portfolio videos',
    'How do I arrange my video portfolio order?',
    'Help with Video Portfolio',
  ])('routes %s without a model call', message => {
    expect(getCanonicalNavigationAnswer(message)).toBe(VIDEO_PORTFOLIO_MANAGEMENT_GUIDANCE);
  });
  it('keeps single ordering guidance separate', () => {
    expect(getCanonicalNavigationAnswer('How do I reorder singles?')).toBe(SINGLE_ORDER_GUIDANCE);
  });
  it('documents exact controls, owner-only access, and preserved video identity', () => {
    expect(help).toContain("id: 'video-portfolio-manage-guide'");
    for (const label of ['Edit Title', 'Save Title', 'Reorder Videos', 'Save Order', 'Move Up', 'Move Down', 'Cancel']) {
      expect(VIDEO_PORTFOLIO_MANAGEMENT_GUIDANCE).toContain(label);
      expect(help).toContain(label);
    }
    expect(VIDEO_PORTFOLIO_MANAGEMENT_GUIDANCE).toContain('actual talent profile owner');
    expect(VIDEO_PORTFOLIO_MANAGEMENT_GUIDANCE).toContain('no new pre-screening');
    expect(VIDEO_PORTFOLIO_MANAGEMENT_GUIDANCE).toContain('existing share links');
    expect(VIDEO_PORTFOLIO_MANAGEMENT_GUIDANCE).toContain('moderation status stay unchanged');
  });
});
