import { describe, it, expect } from 'vitest';

describe('Enterprise Tier & Sponsor System', () => {
  describe('Pricing Tier Configuration', () => {
    it('should have enterprise tier in pricing config', async () => {
      const { STRIPE_PRICING } = await import('./config/stripePricing');
      expect(STRIPE_PRICING).toHaveProperty('enterprise');
      expect(STRIPE_PRICING.enterprise.monthly.amount).toBe(7900);
      expect(STRIPE_PRICING.enterprise.yearly!.amount).toBe(79000);
    });

    it('should have enterprise features in PRICING_TIERS', async () => {
      const { PRICING_TIERS } = await import('./services/pricingTierService');
      const features = PRICING_TIERS.enterprise.features;
      expect(features.sponsorShowcase).toBe(true);
      expect(features.sponsorAnalytics).toBe(true);
      expect(features.mediaKit).toBe(true);
      expect(PRICING_TIERS.enterprise.maxSponsorSlots).toBe(5);
    });

    it('should include all Professional features in Enterprise', async () => {
      const { PRICING_TIERS } = await import('./services/pricingTierService');
      const proFeatures = PRICING_TIERS.professional.features;
      const entFeatures = PRICING_TIERS.enterprise.features;
      // Enterprise should have everything Professional has
      expect(entFeatures.unlimitedBookings).toBe(proFeatures.unlimitedBookings);
      expect(entFeatures.riderBuilder).toBe(proFeatures.riderBuilder);
      expect(entFeatures.contractManagement).toBe(proFeatures.contractManagement);
      expect(entFeatures.analytics).toBe(proFeatures.analytics);
      expect(entFeatures.prioritySupport).toBe(proFeatures.prioritySupport);
    });

    it('should NOT give sponsor features to lower tiers', async () => {
      const { PRICING_TIERS } = await import('./services/pricingTierService');
      const freeFeatures = PRICING_TIERS.free.features;
      const starterFeatures = PRICING_TIERS.starter.features;
      const proFeatures = PRICING_TIERS.professional.features;
      
      expect(freeFeatures.sponsorShowcase).toBe(false);
      expect(freeFeatures.sponsorAnalytics).toBe(false);
      expect(freeFeatures.mediaKit).toBe(false);
      
      expect(starterFeatures.sponsorShowcase).toBe(false);
      expect(starterFeatures.sponsorAnalytics).toBe(false);
      expect(starterFeatures.mediaKit).toBe(false);
      
      expect(proFeatures.sponsorShowcase).toBe(false);
      expect(proFeatures.sponsorAnalytics).toBe(false);
      expect(proFeatures.mediaKit).toBe(false);
    });
  });

  describe('Stripe Product Configuration', () => {
    it('should have enterprise pricing in stripePricing config', async () => {
      const { STRIPE_PRICING } = await import('./config/stripePricing');
      expect(STRIPE_PRICING.enterprise).toBeDefined();
      expect(STRIPE_PRICING.enterprise.monthly.amount).toBe(7900);
      expect(STRIPE_PRICING.enterprise.yearly!.amount).toBe(79000);
      // Yearly should be less than 12x monthly (discount)
      expect(STRIPE_PRICING.enterprise.yearly!.amount).toBeLessThan(STRIPE_PRICING.enterprise.monthly.amount * 12);
    });
  });

  describe('Sponsor Schema', () => {
    it('should export sponsor tables from schema', async () => {
      const schema = await import('../drizzle/schema');
      expect(schema).toHaveProperty('sponsorSlots');
      expect(schema).toHaveProperty('sponsorAnalytics');
      expect(schema).toHaveProperty('mediaKits');
    });
  });

  describe('Tier Hierarchy', () => {
    it('enterprise should be the highest tier', async () => {
      const { PRICING_TIERS } = await import('./services/pricingTierService');
      // Enterprise price should be higher than Professional
      expect(PRICING_TIERS.enterprise.price).toBeGreaterThan(PRICING_TIERS.professional.price);
    });
  });
});
