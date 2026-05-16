import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const readFile = (filePath: string) =>
  fs.readFileSync(path.resolve(__dirname, '..', filePath), 'utf-8');

describe('Yearly Pricing - Shared Products Config', () => {
  const content = readFile('shared/products.ts');

  it('should define yearlyLookupKey for ARTIST_STARTER', () => {
    expect(content).toContain("yearlyLookupKey: 'artist_starter_yearly'");
  });

  it('should define yearlyLookupKey for ARTIST_PROFESSIONAL', () => {
    expect(content).toContain("yearlyLookupKey: 'artist_professional_yearly'");
  });

  it('should define priceYearly for Starter at $90 (9000 cents)', () => {
    expect(content).toContain('priceYearly: 9000');
  });

  it('should define priceYearly for Professional at $290 (29000 cents)', () => {
    expect(content).toContain('priceYearly: 29000');
  });

  it('should export BillingInterval type', () => {
    expect(content).toContain("export type BillingInterval = 'month' | 'year'");
  });

  it('should export getYearlySavingsPercent function', () => {
    expect(content).toContain('export function getYearlySavingsPercent');
  });

  it('should export getYearlyMonthlyEquivalent function', () => {
    expect(content).toContain('export function getYearlyMonthlyEquivalent');
  });
});

describe('Yearly Pricing - Stripe Service', () => {
  const content = readFile('server/stripe.ts');

  it('should accept interval parameter in createSubscriptionCheckoutSession', () => {
    expect(content).toContain("interval?: BillingInterval");
  });

  it('should resolve yearly lookup key when interval is year', () => {
    expect(content).toContain("interval === 'year' ? product.yearlyLookupKey : product.lookupKey");
  });

  it('should resolve yearly amount when interval is year', () => {
    expect(content).toContain("interval === 'year' ? product.priceYearly : product.priceMonthly");
  });

  it('should include interval in subscription metadata', () => {
    expect(content).toContain('interval,');
  });

  it('should skip trial for yearly subscriptions', () => {
    expect(content).toContain("product.trialDays > 0 && interval === 'month'");
  });
});

describe('Yearly Pricing - Router', () => {
  const content = readFile('server/routers.ts');

  it('should accept interval parameter in createCheckoutSession input', () => {
    expect(content).toContain("interval: z.enum(['month', 'year']).optional().default('month')");
  });

  it('should pass interval to createSubscriptionCheckoutSession', () => {
    expect(content).toContain('interval: input.interval');
  });
});

describe('Yearly Pricing - Pricing Page UI', () => {
  const content = readFile('client/src/pages/Pricing.tsx');

  it('should define BillingInterval type', () => {
    expect(content).toContain("type BillingInterval = 'month' | 'year'");
  });

  it('should have billingInterval state', () => {
    expect(content).toContain("useState<BillingInterval>('month')");
  });

  it('should render Monthly/Yearly toggle buttons', () => {
    expect(content).toContain("setBillingInterval('month')");
    expect(content).toContain("setBillingInterval('year')");
  });

  it('should show "2 months free" label on yearly toggle', () => {
    expect(content).toContain('2 months free');
  });

  it('should pass billingInterval to PricingCard', () => {
    expect(content).toContain('billingInterval={billingInterval}');
  });

  it('should pass interval to checkout mutation', () => {
    expect(content).toContain('interval: billingInterval');
  });

  it('should display yearly savings badge', () => {
    expect(content).toContain('tier.yearlySavings');
  });

  it('should show yearly price for Starter ($90)', () => {
    expect(content).toContain('yearlyPrice: "$90"');
  });

  it('should show yearly price for Professional ($290)', () => {
    expect(content).toContain('yearlyPrice: "$290"');
  });

  it('should show effective monthly price for Starter ($7.50)', () => {
    expect(content).toContain('yearlyMonthly: "$7.50"');
  });

  it('should show effective monthly price for Professional ($24.17)', () => {
    expect(content).toContain('yearlyMonthly: "$24.17"');
  });
});
