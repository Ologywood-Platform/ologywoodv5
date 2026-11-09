import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('server/routers/release.ts', 'utf8');

describe('release purchase security boundaries', () => {
  it('uses strict input objects for buyer-facing release purchase and review operations', () => {
    expect(source).toContain('sessionId: z.string().trim().min(1).max(255).regex(/^cs_(?:test|live)_[A-Za-z0-9]+$/, "Invalid Stripe checkout session ID") }).strict()');
    expect(source).toContain('purchaseId: z.number().int().safe().positive() }).strict()');
    expect(source).toContain('reviewId: z.number().int().safe().positive() }).strict()');
    expect(source).toContain('releaseId: z.number().int().safe().positive() }).strict()');
  });

  it('escapes purchase-confirmation content and constrains generated links', () => {
    expect(source).toContain('escapeFanEmailHtml(release.title)');
    expect(source).toContain('escapeFanEmailHtml(artistProfile.artistName)');
    expect(source).toContain('safeFanEmailHref(unsubscribeUrl)');
    expect(source).toContain('trustedCheckoutOrigin(process.env.BASE_URL, undefined)');
    expect(source).toContain('sanitizeFanEmailSubject(`Purchase Confirmed');
  });

  it('redacts storage, email, and Stripe verification failures and recipient logs', () => {
    expect(source).toContain('Failed to resolve S3 URLs');
    expect(source).toContain("kind: error instanceof Error ? error.name : 'UnknownError'");
    expect(source).toContain("console.log('[Release VerifyPurchase] Confirmation email sent');");
    expect(source).not.toContain('Confirmation email sent to ${buyerEmail}');
    expect(source).not.toContain("console.error('[Release VerifyPurchase] Stripe error:', err)");
    expect(source).not.toContain("console.error('[Release VerifyPurchase] Email error:', emailErr)");
  });
});
