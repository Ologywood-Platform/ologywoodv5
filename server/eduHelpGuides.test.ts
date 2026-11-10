import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
vi.mock('@/components/SiteHeader', () => ({ default: () => null }));
vi.mock('@/utils/seoMeta', () => ({ setMetaTags: vi.fn(), pageMetaTags: { help: {} } }));
import { getRequestedHelpArticle } from '../client/src/pages/Help';
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('EDU feature support guides', () => {
  it.each(['edu-enrollment-guide', 'edu-sharing-guide', 'edu-school-pilot-guide'])('provides a searchable, directly openable %s article', id => {
    const article = getRequestedHelpArticle(`?article=${id}`);
    expect(article?.id).toBe(id); expect(article?.category).toBe('Getting Started'); expect(article?.answer.length).toBeGreaterThan(200);
  });
  it('distinguishes interest, manual evidence review, renewal and paid activation', () => {
    const answer = getRequestedHelpArticle('?article=edu-enrollment-guide')!.answer;
    for (const text of ['not an account registration or eligibility approval', 'Refresh status', 'Continue in your workspace', 'eligibility and grace dates stay unchanged', 'does not charge a payment', 'inputs remain available', 'rather than assuming an email was delivered']) expect(answer).toContain(text);
  });
  it('explains public sharing, copy failures, device support and no automatic posts', () => {
    const answer = getRequestedHelpArticle('?article=edu-sharing-guide')!.answer;
    for (const text of ['Facebook, X, and LinkedIn', 'only after copying succeeds', 'copy it manually', 'when supported', 'private enrollment evidence', 'Nothing is posted or emailed automatically', 'cached preview']) expect(answer).toContain(text);
  });
  it('directs professors into school inquiry without fabricated student eligibility', () => {
    const answer = getRequestedHelpArticle('?article=edu-school-pilot-guide')!.answer;
    expect(answer).toContain('I represent a school'); expect(answer).toContain('do not need to submit student enrollment evidence'); expect(answer).toContain('does not create an account, activate a pilot, or start billing');
  });
  it('keeps the pricing article consistent with the deployed manual-review safeguards', () => {
    const answer = getRequestedHelpArticle('?article=payment-edu')!.answer;
    expect(answer).toContain('manually approved'); expect(answer).toContain('separate successful checkout'); expect(answer).toContain('Approval alone does not activate'); expect(answer).toContain('rather than relying on email reminders'); expect(answer).not.toContain('Students receive renewal reminders');
  });
  it('links each feature to help and preserves drafts when opening form guidance', () => {
    expect(read('client/src/components/EduShareButtons.tsx')).toContain('/help?article=edu-sharing-guide');
    const interest = read('client/src/pages/EduApply.tsx'), verification = read('client/src/pages/EduVerification.tsx');
    expect(interest).toContain('/help?article=edu-school-pilot-guide'); expect(interest).toContain('/help?article=edu-enrollment-guide'); expect(verification).toContain('/help?article=edu-enrollment-guide');
    for (const source of [interest, verification]) expect(source).toContain('target="_blank" rel="noopener noreferrer"');
  });
});
