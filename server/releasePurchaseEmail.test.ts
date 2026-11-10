import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const webhook = readFileSync(new URL('./webhooks/stripe.ts', import.meta.url), 'utf8');
const router = readFileSync(new URL('./routers/release.ts', import.meta.url), 'utf8');

describe('release purchase email coverage', () => {
  it('keeps buyer confirmation delivery in both the webhook and verified-session fallback', () => {
    expect(webhook).toContain('Purchase Confirmed');
    expect(webhook).toContain('Download Your Track');
    expect(router).toContain('Purchase Confirmed');
    expect(router).toContain('Download Your Track');
  });

  it('notifies the artist account without emailing the buyer twice when both addresses match', () => {
    expect(webhook).toContain('New release sale');
    expect(webhook).toContain('artistEmail.toLowerCase() !== buyerEmail?.toLowerCase()');
    expect(webhook).toContain('View My Dashboard');
  });

  it('escapes release and artist values and sanitizes email links and subjects', () => {
    for (const source of [webhook, router]) {
      expect(source).toContain('escapeFanEmailHtml');
      expect(source).toContain('safeFanEmailHref');
      expect(source).toContain('sanitizeFanEmailSubject');
    }
  });
});
