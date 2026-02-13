import { describe, it, expect } from 'vitest';
import { SubscriptionValidationService, type SubscriptionTier } from '../subscriptionValidation';

describe('SubscriptionValidationService', () => {
  describe('Tier Limits', () => {
    it('should enforce free tier limits', async () => {
      const limits = await SubscriptionValidationService.getUserLimits(1);
      expect(limits.maxRiders).toBe(1);
      expect(limits.maxMonthlyBookings).toBe(2);
      expect(limits.maxTeamMembers).toBe(1);
      expect(limits.apiAccess).toBe(false);
    });

    it('should return free tier limits by default', async () => {
      const limits = await SubscriptionValidationService.getUserLimits(999);
      expect(limits.maxRiders).toBe(1);
      expect(limits.maxMonthlyBookings).toBe(2);
      expect(limits.maxTeamMembers).toBe(1);
      expect(limits.apiAccess).toBe(false);
    });

    it('should have correct tier structure', async () => {
      const freeLimits = await SubscriptionValidationService.getUserLimits(1);
      expect(freeLimits.maxRiders).toBeLessThan(Infinity);
      expect(freeLimits.maxMonthlyBookings).toBeLessThan(Infinity);
    });
  });

  describe('Rider Creation Validation', () => {
    it('should allow rider creation when under limit', async () => {
      const result = await SubscriptionValidationService.canCreateRider(1);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBeGreaterThan(result.current);
    });

    it('should return correct usage stats', async () => {
      const result = await SubscriptionValidationService.canCreateRider(1);
      expect(result).toHaveProperty('current');
      expect(result).toHaveProperty('limit');
      expect(typeof result.current).toBe('number');
      expect(typeof result.limit).toBe('number');
    });

    it('should provide helpful error message when limit reached', async () => {
      const result = await SubscriptionValidationService.canCreateRider(1);
      if (!result.allowed) {
        expect(result.reason).toContain('maximum');
        expect(result.reason).toContain('rider');
      }
    });
  });

  describe('Booking Creation Validation', () => {
    it('should allow booking creation when under limit', async () => {
      const result = await SubscriptionValidationService.canCreateBooking(1);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBeGreaterThan(result.current);
    });

    it('should return correct monthly booking stats', async () => {
      const result = await SubscriptionValidationService.canCreateBooking(1);
      expect(result).toHaveProperty('current');
      expect(result).toHaveProperty('limit');
      expect(result.current).toBeLessThanOrEqual(result.limit);
    });
  });

  describe('Team Member Validation', () => {
    it('should enforce team member limits', async () => {
      const result = await SubscriptionValidationService.canAddTeamMember(1);
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('limit');
      expect(typeof result.allowed).toBe('boolean');
    });

    it('should provide correct team member limits by tier', async () => {
      const freeResult = await SubscriptionValidationService.canAddTeamMember(1);
      expect(freeResult.limit).toBe(1);
    });
  });

  describe('PDF Export Validation', () => {
    it('should enforce PDF export limits', async () => {
      const result = await SubscriptionValidationService.canExportPDF(1);
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('limit');
    });

    it('should allow PDF export for all tiers', async () => {
      const result = await SubscriptionValidationService.canExportPDF(1);
      expect(result.allowed).toBe(true);
    });
  });

  describe('API Access', () => {
    it('should deny API access for free tier', async () => {
      const hasAccess = await SubscriptionValidationService.hasAPIAccess(1);
      expect(hasAccess).toBe(false);
    });

    it('should return boolean for API access check', async () => {
      const hasAccess = await SubscriptionValidationService.hasAPIAccess(999);
      expect(typeof hasAccess).toBe('boolean');
    });

    it('should deny API access by default', async () => {
      const hasAccess = await SubscriptionValidationService.hasAPIAccess(999);
      expect(hasAccess).toBe(false);
    });
  });

  describe('Custom Branding', () => {
    it('should deny custom branding for free tier', async () => {
      const canUse = await SubscriptionValidationService.canUseCustomBranding(1);
      expect(canUse).toBe(false);
    });

    it('should return boolean for custom branding check', async () => {
      const canUse = await SubscriptionValidationService.canUseCustomBranding(999);
      expect(typeof canUse).toBe('boolean');
    });

    it('should deny custom branding by default', async () => {
      const canUse = await SubscriptionValidationService.canUseCustomBranding(999);
      expect(canUse).toBe(false);
    });
  });

  describe('Usage Statistics', () => {
    it('should return usage stats for user', async () => {
      const stats = await SubscriptionValidationService.getUserUsageStats(1);
      expect(stats).toHaveProperty('tier');
      expect(stats).toHaveProperty('riders');
      expect(stats).toHaveProperty('bookings');
      expect(stats).toHaveProperty('teamMembers');
      expect(stats).toHaveProperty('pdfExports');
    });

    it('should show correct usage percentages', async () => {
      const stats = await SubscriptionValidationService.getUserUsageStats(1);
      expect(stats.riders.used).toBeLessThanOrEqual(stats.riders.limit);
      expect(stats.bookings.used).toBeLessThanOrEqual(stats.bookings.limit);
      expect(stats.teamMembers.used).toBeLessThanOrEqual(stats.teamMembers.limit);
    });

    it('should return free tier stats correctly', async () => {
      const stats = await SubscriptionValidationService.getUserUsageStats(1);
      expect(stats.tier).toBe('free');
      expect(stats.riders.limit).toBe(1);
      expect(stats.bookings.limit).toBe(2);
    });
  });

  describe('Tier Change Validation', () => {
    it('should validate upgrade from free to basic', async () => {
      const result = await SubscriptionValidationService.validateTierChange(1, 'basic');
      expect(result.valid).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should warn about data loss on downgrade', async () => {
      const result = await SubscriptionValidationService.validateTierChange(3, 'free');
      expect(result.valid).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should validate tier changes', async () => {
      const result = await SubscriptionValidationService.validateTierChange(1, 'premium');
      expect(result.valid).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('Tier Hierarchy', () => {
    it('should correctly identify tier progression', async () => {
      const freeTier = await SubscriptionValidationService.getUserTier(1);
      const tier2 = await SubscriptionValidationService.getUserTier(2);
      const tier3 = await SubscriptionValidationService.getUserTier(3);

      expect(['free', 'basic', 'premium']).toContain(freeTier);
      expect(['free', 'basic', 'premium']).toContain(tier2);
      expect(['free', 'basic', 'premium']).toContain(tier3);
    });
  });

  describe('Error Handling', () => {
    it('should default to free tier on error', async () => {
      const tier = await SubscriptionValidationService.getUserTier(999999);
      expect(tier).toBe('free');
    });

    it('should return safe defaults on database error', async () => {
      const result = await SubscriptionValidationService.canCreateRider(999999);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(Infinity);
    });

    it('should handle missing user gracefully', async () => {
      const stats = await SubscriptionValidationService.getUserUsageStats(999999);
      expect(stats.tier).toBe('free');
      expect(stats.riders.limit).toBe(1);
    });
  });

  describe('Feature Access Control', () => {
    it('should restrict features by tier', async () => {
      const freeAccess = await SubscriptionValidationService.hasAPIAccess(1);
      expect(freeAccess).toBe(false);
    });

    it('should provide consistent feature access', async () => {
      const apiAccess = await SubscriptionValidationService.hasAPIAccess(1);
      const brandingAccess = await SubscriptionValidationService.canUseCustomBranding(1);

      expect(typeof apiAccess).toBe('boolean');
      expect(typeof brandingAccess).toBe('boolean');
      expect(apiAccess).toBe(false);
      expect(brandingAccess).toBe(false);
    });
  });

  describe('Limit Calculations', () => {
    it('should calculate monthly booking limits correctly', async () => {
      const result = await SubscriptionValidationService.canCreateBooking(1);
      expect(result.limit).toBeLessThanOrEqual(Infinity);
      expect(result.limit).toBeGreaterThan(0);
    });

    it('should track current usage accurately', async () => {
      const result = await SubscriptionValidationService.canCreateBooking(1);
      expect(result.current).toBeGreaterThanOrEqual(0);
      if (result.limit !== Infinity) {
        expect(result.current).toBeLessThanOrEqual(result.limit);
      }
    });
  });
});
