import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'client/src/components/StripeTestModeBanner.tsx'), 'utf8');
const paymentSection = readFileSync(resolve(process.cwd(), 'client/src/components/PaymentSection.tsx'), 'utf8');

describe('Stripe test-mode banner', () => {
  it('is gated by the publishable-key mode and never renders in live mode', () => {
    expect(source).toContain("startsWith('pk_test_')");
    expect(source).toContain('if (!isTestMode || dismissed) return null;');
  });

  it('shows the canonical Stripe test card and explains that charges are not real', () => {
    expect(source).toContain('4242 4242 4242 4242');
    expect(source).toContain('No real charges will be made');
    expect(source).toContain('12/28');
    expect(source).toContain('123');
  });

  it('supports copy and dismissal without persisting state across users', () => {
    expect(source).toContain("navigator.clipboard.writeText('4242424242424242')");
    expect(source).toContain('setDismissed(true)');
    expect(source).not.toMatch(/localStorage|sessionStorage/);
    expect(paymentSection).toContain('<StripeTestModeBanner />');
  });
});
