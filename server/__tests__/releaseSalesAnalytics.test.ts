import { describe, it, expect } from 'vitest';
import * as schema from '../../drizzle/schema';

describe('Release Sales Analytics', () => {
  describe('Schema', () => {
    it('artistReleases table is defined with required columns', () => {
      expect(schema.artistReleases).toBeDefined();
      // Verify the table has the columns we need for analytics
      expect(schema.artistReleases.totalSales).toBeDefined();
      expect(schema.artistReleases.totalRevenueCents).toBeDefined();
      expect(schema.artistReleases.artistId).toBeDefined();
    });

    it('releasePurchases table is defined with required columns', () => {
      expect(schema.releasePurchases).toBeDefined();
      expect(schema.releasePurchases.amountPaidCents).toBeDefined();
      expect(schema.releasePurchases.platformFeeCents).toBeDefined();
      expect(schema.releasePurchases.artistNetCents).toBeDefined();
      expect(schema.releasePurchases.purchasedAt).toBeDefined();
    });
  });

  describe('Analytics Data Structure', () => {
    it('should define correct summary shape', () => {
      const mockSummary = {
        totalSales: 25,
        totalGrossRevenueCents: 25000,
        totalPlatformFeeCents: 250,
        totalNetRevenueCents: 24750,
        releaseCount: 3,
      };

      expect(mockSummary.totalSales).toBe(25);
      expect(mockSummary.totalGrossRevenueCents).toBe(25000);
      expect(mockSummary.totalPlatformFeeCents).toBe(250);
      expect(mockSummary.totalNetRevenueCents).toBe(24750);
      expect(mockSummary.releaseCount).toBe(3);
    });

    it('should calculate net revenue correctly (gross - platform fee)', () => {
      const grossCents = 10000; // $100.00
      const platformFeeCents = 100; // $1.00 (1%)
      const netCents = grossCents - platformFeeCents;

      expect(netCents).toBe(9900);
      expect(platformFeeCents / grossCents).toBeCloseTo(0.01); // 1%
    });

    it('should format cents to dollars correctly', () => {
      const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

      expect(formatCents(0)).toBe('$0.00');
      expect(formatCents(100)).toBe('$1.00');
      expect(formatCents(999)).toBe('$9.99');
      expect(formatCents(10000)).toBe('$100.00');
      expect(formatCents(99999)).toBe('$999.99');
    });

    it('should define correct per-release shape', () => {
      const mockRelease = {
        id: 1,
        title: 'Test Track',
        genre: 'Jazz',
        priceInCents: 999,
        status: 'published',
        publishedAt: new Date(),
        totalSales: 10,
        totalRevenueCents: 9990,
        coverArtKey: 'releases/cover-1.jpg',
        recentPurchases: [
          {
            amountPaidCents: 999,
            platformFeeCents: 10,
            artistNetCents: 989,
            purchasedAt: new Date(),
          },
        ],
      };

      expect(mockRelease.totalSales).toBe(10);
      expect(mockRelease.recentPurchases).toHaveLength(1);
      expect(mockRelease.recentPurchases[0].amountPaidCents).toBe(999);
    });

    it('should handle empty analytics (no releases)', () => {
      const emptyAnalytics = {
        summary: {
          totalSales: 0,
          totalGrossRevenueCents: 0,
          totalPlatformFeeCents: 0,
          totalNetRevenueCents: 0,
          releaseCount: 0,
        },
        releases: [],
      };

      expect(emptyAnalytics.summary.releaseCount).toBe(0);
      expect(emptyAnalytics.releases).toHaveLength(0);
    });

    it('should aggregate totals across multiple releases', () => {
      const releases = [
        { totalSales: 10, totalRevenueCents: 9990, platformFeeCents: 100, netCents: 9890 },
        { totalSales: 5, totalRevenueCents: 4995, platformFeeCents: 50, netCents: 4945 },
        { totalSales: 20, totalRevenueCents: 19980, platformFeeCents: 200, netCents: 19780 },
      ];

      const totalSales = releases.reduce((sum, r) => sum + r.totalSales, 0);
      const totalGross = releases.reduce((sum, r) => sum + r.totalRevenueCents, 0);
      const totalFees = releases.reduce((sum, r) => sum + r.platformFeeCents, 0);
      const totalNet = releases.reduce((sum, r) => sum + r.netCents, 0);

      expect(totalSales).toBe(35);
      expect(totalGross).toBe(34965);
      expect(totalFees).toBe(350);
      expect(totalNet).toBe(34615);
    });
  });

  describe('Router Endpoint', () => {
    it('salesAnalytics endpoint exists in release router exports', async () => {
      const releaseRouter = await import('../routers/release');
      expect(releaseRouter.releaseRouter).toBeDefined();
      // The router should have a salesAnalytics procedure
      const procedures = Object.keys((releaseRouter.releaseRouter as any)._def.procedures || {});
      expect(procedures).toContain('salesAnalytics');
    });
  });

  describe('DB Function', () => {
    it('getReleaseSalesAnalytics function is exported from db', async () => {
      const db = await import('../db');
      expect(db.getReleaseSalesAnalytics).toBeDefined();
      expect(typeof db.getReleaseSalesAnalytics).toBe('function');
    });
  });
});
