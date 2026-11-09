import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pricing = readFileSync(resolve(__dirname, 'routers/pricing.ts'), 'utf8');

describe('pricing router security boundaries', () => {
  it('uses a finite allowlist for feature access instead of arbitrary strings', () => {
    expect(pricing).toContain('const PRICING_FEATURES = [');
    expect(pricing).toContain('const pricingFeature = z.enum(PRICING_FEATURES)');
    expect(pricing).toContain('.input(z.object({ feature: pricingFeature }).strict())');
    expect(pricing).not.toContain('feature: z.string()');
  });

  it('falls back safely when a stored subscription tier is not configured', () => {
    expect(pricing).toContain("subscription.tier in PRICING_TIERS");
    expect(pricing).toContain(": 'free'");
    expect(pricing).toContain('tier: tierKey');
  });

  it('does not expose a caller-controlled feature key to the service as any', () => {
    expect(pricing).not.toContain('input.feature as any');
    expect(pricing).toContain('input.feature\n      );');
  });
});
