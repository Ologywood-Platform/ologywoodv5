import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { paymentIntentWithoutRedirects } from './services/stripePaymentIntentConfig';

const root = resolve(__dirname, '..');

describe('Stripe PaymentIntent redirect policy', () => {
  it('disables redirect-based methods for server-created intents', () => {
    expect(paymentIntentWithoutRedirects).toEqual({
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });
  });

  it.each([
    'server/routers.ts',
    'server/routers/promote.ts',
    'server/routers/tip.ts',
  ])('applies the shared policy in %s', (relativePath) => {
    const source = readFileSync(resolve(root, relativePath), 'utf8');
    expect(source).toContain('paymentIntentWithoutRedirects');
    expect(source).toContain('...paymentIntentWithoutRedirects');
  });

  it('keeps the browser tip confirmation return_url for any explicit redirect flow', () => {
    const source = readFileSync(resolve(root, 'client/src/components/TipModal.tsx'), 'utf8');
    expect(source).toContain('return_url: window.location.href');
    expect(source).toContain("redirect: 'if_required'");
  });
});
