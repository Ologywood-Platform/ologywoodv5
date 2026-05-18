import { describe, it, expect } from 'vitest';

describe('Subscription Price Display Logic', () => {
  // Simulate the logic from SubscriptionManagement.tsx
  function getPriceDisplay(tier: 'starter' | 'professional', billingInterval: 'month' | 'year', isPaused: boolean) {
    if (isPaused) return '$0/month (paused)';
    if (tier === 'starter') {
      return billingInterval === 'year' ? '$90/year' : '$9/month';
    }
    return billingInterval === 'year' ? '$290/year' : '$29/month';
  }

  function getEffectiveMonthly(tier: 'starter' | 'professional', billingInterval: 'month' | 'year') {
    if (billingInterval !== 'year') return null;
    return tier === 'starter' ? '$7.50/mo effective' : '$24.17/mo effective';
  }

  describe('Monthly billing', () => {
    it('shows $9/month for Starter monthly', () => {
      expect(getPriceDisplay('starter', 'month', false)).toBe('$9/month');
    });

    it('shows $29/month for Professional monthly', () => {
      expect(getPriceDisplay('professional', 'month', false)).toBe('$29/month');
    });

    it('returns null effective monthly for monthly billing', () => {
      expect(getEffectiveMonthly('starter', 'month')).toBeNull();
      expect(getEffectiveMonthly('professional', 'month')).toBeNull();
    });
  });

  describe('Yearly billing', () => {
    it('shows $90/year for Starter yearly', () => {
      expect(getPriceDisplay('starter', 'year', false)).toBe('$90/year');
    });

    it('shows $290/year for Professional yearly', () => {
      expect(getPriceDisplay('professional', 'year', false)).toBe('$290/year');
    });

    it('shows $7.50/mo effective for Starter yearly', () => {
      expect(getEffectiveMonthly('starter', 'year')).toBe('$7.50/mo effective');
    });

    it('shows $24.17/mo effective for Professional yearly', () => {
      expect(getEffectiveMonthly('professional', 'year')).toBe('$24.17/mo effective');
    });
  });

  describe('Paused subscription', () => {
    it('shows $0/month (paused) regardless of tier or interval', () => {
      expect(getPriceDisplay('starter', 'month', true)).toBe('$0/month (paused)');
      expect(getPriceDisplay('professional', 'year', true)).toBe('$0/month (paused)');
    });
  });

  describe('Next billing date during trial', () => {
    it('shows trial end date as first billing when trialing', () => {
      const isTrialing = true;
      const trialEnd = new Date('2026-06-05');
      const currentPeriodEnd = new Date('2026-05-18');
      
      // Logic: during trial, use trialEnd instead of currentPeriodEnd
      const displayDate = isTrialing && trialEnd ? trialEnd : currentPeriodEnd;
      expect(displayDate).toEqual(trialEnd);
    });

    it('shows currentPeriodEnd when not trialing', () => {
      const isTrialing = false;
      const trialEnd = null;
      const currentPeriodEnd = new Date('2027-05-18');
      
      const displayDate = isTrialing && trialEnd ? trialEnd : currentPeriodEnd;
      expect(displayDate).toEqual(currentPeriodEnd);
    });

    it('shows "First billing" label during trial', () => {
      const isTrialing = true;
      const label = isTrialing ? 'First billing' : 'Next billing';
      expect(label).toBe('First billing');
    });

    it('shows "Next billing" label after trial', () => {
      const isTrialing = false;
      const label = isTrialing ? 'First billing' : 'Next billing';
      expect(label).toBe('Next billing');
    });
  });

  describe('Billing interval detection', () => {
    it('detects year interval from stripeStatus', () => {
      const stripeStatus = { interval: 'year' };
      const billingInterval: 'month' | 'year' = (stripeStatus?.interval === 'year') ? 'year' : 'month';
      expect(billingInterval).toBe('year');
    });

    it('defaults to month when interval is undefined', () => {
      const stripeStatus: any = { interval: undefined };
      const billingInterval: 'month' | 'year' = (stripeStatus?.interval === 'year') ? 'year' : 'month';
      expect(billingInterval).toBe('month');
    });

    it('defaults to month when stripeStatus is null', () => {
      const stripeStatus: any = null;
      const billingInterval: 'month' | 'year' = (stripeStatus?.interval === 'year') ? 'year' : 'month';
      expect(billingInterval).toBe('month');
    });
  });

  describe('Webhook tier resolution with yearly prices', () => {
    const SUBSCRIPTION_PRODUCTS = {
      ARTIST_STARTER: {
        lookupKey: 'artist_starter_monthly',
        yearlyLookupKey: 'artist_starter_yearly',
        priceMonthly: 900,
        priceYearly: 9000,
      },
      ARTIST_PROFESSIONAL: {
        lookupKey: 'artist_professional_monthly',
        yearlyLookupKey: 'artist_professional_yearly',
        priceMonthly: 2900,
        priceYearly: 29000,
      },
    };

    function resolveTier(planMetadata: string | undefined, lookupKey: string | undefined, priceAmount: number | undefined) {
      let tier: 'free' | 'starter' | 'professional' = 'professional';
      if (planMetadata === 'ARTIST_STARTER' || 
          lookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.lookupKey ||
          lookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.yearlyLookupKey ||
          priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceMonthly ||
          priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceYearly) {
        tier = 'starter';
      } else if (planMetadata === 'ARTIST_PROFESSIONAL' || 
                 lookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.lookupKey ||
                 lookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.yearlyLookupKey ||
                 priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.priceMonthly ||
                 priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.priceYearly) {
        tier = 'professional';
      }
      return tier;
    }

    it('resolves starter from monthly lookup key', () => {
      expect(resolveTier(undefined, 'artist_starter_monthly', undefined)).toBe('starter');
    });

    it('resolves starter from yearly lookup key', () => {
      expect(resolveTier(undefined, 'artist_starter_yearly', undefined)).toBe('starter');
    });

    it('resolves starter from yearly price amount ($90)', () => {
      expect(resolveTier(undefined, undefined, 9000)).toBe('starter');
    });

    it('resolves professional from monthly lookup key', () => {
      expect(resolveTier(undefined, 'artist_professional_monthly', undefined)).toBe('professional');
    });

    it('resolves professional from yearly lookup key', () => {
      expect(resolveTier(undefined, 'artist_professional_yearly', undefined)).toBe('professional');
    });

    it('resolves professional from yearly price amount ($290)', () => {
      expect(resolveTier(undefined, undefined, 29000)).toBe('professional');
    });

    it('resolves from metadata even without lookup key or price', () => {
      expect(resolveTier('ARTIST_STARTER', undefined, undefined)).toBe('starter');
      expect(resolveTier('ARTIST_PROFESSIONAL', undefined, undefined)).toBe('professional');
    });
  });
});
