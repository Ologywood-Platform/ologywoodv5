/**
 * Tier Compliance Tests for Rider Template System
 * Verifies that all features are properly gated by subscription tier
 */

import { describe, it, expect } from "vitest";
import { PRICING_TIERS } from "./pricingTierService";

describe("Rider Template Tier Compliance", () => {
  describe("Tier Feature Access", () => {
    it("FREE tier should NOT have riderBuilder access", () => {
      expect(PRICING_TIERS.free.features.riderBuilder).toBe(false);
    });

    it("STARTER tier SHOULD have riderBuilder access", () => {
      expect(PRICING_TIERS.starter.features.riderBuilder).toBe(true);
    });

    it("PROFESSIONAL tier SHOULD have riderBuilder access", () => {
      expect(PRICING_TIERS.professional.features.riderBuilder).toBe(true);
    });
  });

  describe("Tier Feature Consistency", () => {
    it("All tiers should have consistent feature keys", () => {
      const freeFeatures = Object.keys(PRICING_TIERS.free.features).sort();
      const starterFeatures = Object.keys(PRICING_TIERS.starter.features).sort();
      const professionalFeatures = Object.keys(PRICING_TIERS.professional.features).sort();

      expect(freeFeatures).toEqual(starterFeatures);
      expect(starterFeatures).toEqual(professionalFeatures);
    });

    it("PROFESSIONAL tier should have all features enabled", () => {
      const professionalFeatures = Object.values(PRICING_TIERS.professional.features);
      const allEnabled = professionalFeatures.every((feature) => feature === true);
      expect(allEnabled).toBe(true);
    });
  });

  describe("Tier Pricing", () => {
    it("FREE tier should be free", () => {
      expect(PRICING_TIERS.free.price).toBe(0);
    });

    it("STARTER tier should be cheaper than PROFESSIONAL", () => {
      expect(PRICING_TIERS.starter.price).toBeLessThan(PRICING_TIERS.professional.price);
    });

    it("Pricing should be positive for paid tiers", () => {
      expect(PRICING_TIERS.starter.price).toBeGreaterThan(0);
      expect(PRICING_TIERS.professional.price).toBeGreaterThan(0);
    });
  });

  describe("Booking Limits", () => {
    it("FREE tier should have limited bookings per month", () => {
      expect(PRICING_TIERS.free.bookingsPerMonth).toBeLessThan(Infinity);
    });

    it("STARTER and PROFESSIONAL tiers should have unlimited bookings", () => {
      expect(PRICING_TIERS.starter.bookingsPerMonth).toBe(Infinity);
      expect(PRICING_TIERS.professional.bookingsPerMonth).toBe(Infinity);
    });
  });

  describe("Rider Builder Feature Requirements", () => {
    it("riderBuilder feature should be available in STARTER and PROFESSIONAL", () => {
      const tiers = ["starter", "professional"] as const;
      tiers.forEach((tier) => {
        expect(PRICING_TIERS[tier].features.riderBuilder).toBe(true);
      });
    });

    it("riderBuilder feature should NOT be available in FREE", () => {
      expect(PRICING_TIERS.free.features.riderBuilder).toBe(false);
    });

    it("All rider-related features should follow tier hierarchy", () => {
      // If a feature is in starter, it should also be in professional
      const starterFeatures = PRICING_TIERS.starter.features;
      const professionalFeatures = PRICING_TIERS.professional.features;

      Object.entries(starterFeatures).forEach(([feature, enabled]) => {
        if (enabled) {
          expect(professionalFeatures[feature as keyof typeof professionalFeatures]).toBe(true);
        }
      });
    });
  });

  describe("Feature Availability Matrix", () => {
    it("should have correct feature availability across tiers", () => {
      const expectedMatrix = {
        basicProfile: [true, true, true],
        messaging: [true, true, true],
        bookingCalendar: [true, true, true],
        paymentProcessing: [true, true, true],
        emailSupport: [true, true, true],
        mobileResponsive: [true, true, true],
        advancedProfile: [false, false, true],
        prioritySupport: [false, false, true],
        analytics: [false, false, true],
        riderBuilder: [false, true, true], // ✓ CRITICAL: STARTER has access
        contractTemplates: [false, false, true],
        paymentHistory: [false, false, true],
        bulkMessaging: [false, false, true],
        featuredProfile: [false, false, true],
        customBranding: [false, false, true],
      };

      const tiers = ["free", "starter", "professional"] as const;
      const tierValues = tiers.map((tier) => PRICING_TIERS[tier].features);

      Object.entries(expectedMatrix).forEach(([feature, expected]) => {
        const actual = tierValues.map((tier) => tier[feature as keyof typeof tier]);
        expect(actual).toEqual(expected);
      });
    });
  });
});
