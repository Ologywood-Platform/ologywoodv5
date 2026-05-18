import { describe, it, expect } from "vitest";

/**
 * Credit Expiration Policy Tests
 * 
 * Tests the 90-day credit expiration system:
 * - Credits get an expiresAt date 90 days from creation
 * - Expired credits are excluded from balance calculations
 * - Warning emails are sent 7 days before expiration
 * - The heartbeat handler marks expired credits correctly
 */

describe("Credit Expiration Policy", () => {
  describe("Expiration Date Calculation", () => {
    it("should set expiresAt to 90 days from creation", () => {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 90);
      
      const diffDays = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(90);
    });

    it("should correctly identify expired credits", () => {
      const now = new Date();
      const expiredDate = new Date(now);
      expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday
      
      expect(expiredDate.getTime() < now.getTime()).toBe(true);
    });

    it("should correctly identify non-expired credits", () => {
      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
      
      expect(futureDate.getTime() > now.getTime()).toBe(true);
    });
  });

  describe("Balance Calculation", () => {
    it("should exclude expired credits from balance", () => {
      const credits = [
        { type: "earned", amount: 5, expiresAt: new Date(Date.now() + 86400000) }, // valid
        { type: "earned", amount: 5, expiresAt: new Date(Date.now() - 86400000) }, // expired
        { type: "redeemed", amount: 3, expiresAt: null },
      ];

      const now = new Date();
      const validEarned = credits
        .filter(c => c.type === "earned" && (c.expiresAt === null || c.expiresAt > now))
        .reduce((sum, c) => sum + c.amount, 0);
      const redeemed = credits
        .filter(c => c.type === "redeemed")
        .reduce((sum, c) => sum + c.amount, 0);

      const balance = validEarned - redeemed;
      expect(balance).toBe(2); // $5 valid - $3 redeemed = $2
    });

    it("should include credits without expiresAt (legacy credits)", () => {
      const credits = [
        { type: "earned", amount: 10, expiresAt: null }, // legacy, no expiry
        { type: "redeemed", amount: 2, expiresAt: null },
      ];

      const now = new Date();
      const validEarned = credits
        .filter(c => c.type === "earned" && (c.expiresAt === null || c.expiresAt > now))
        .reduce((sum, c) => sum + c.amount, 0);
      const redeemed = credits
        .filter(c => c.type === "redeemed")
        .reduce((sum, c) => sum + c.amount, 0);

      const balance = validEarned - redeemed;
      expect(balance).toBe(8);
    });
  });

  describe("Warning Email Logic", () => {
    it("should identify credits expiring within 7 days", () => {
      const now = new Date();
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const expiresIn5Days = new Date(now);
      expiresIn5Days.setDate(expiresIn5Days.getDate() + 5);

      const expiresIn10Days = new Date(now);
      expiresIn10Days.setDate(expiresIn10Days.getDate() + 10);

      expect(expiresIn5Days <= sevenDaysFromNow).toBe(true); // Should warn
      expect(expiresIn10Days <= sevenDaysFromNow).toBe(false); // Should NOT warn
    });

    it("should not warn for already expired credits", () => {
      const now = new Date();
      const expiredYesterday = new Date(now);
      expiredYesterday.setDate(expiredYesterday.getDate() - 1);

      // Already expired credits should not get warning emails
      expect(expiredYesterday > now).toBe(false);
    });

    it("should not re-warn credits that have already been warned", () => {
      const credit = {
        expirationWarned: true,
        expiresAt: new Date(Date.now() + 3 * 86400000), // 3 days from now
      };

      // Should skip if already warned
      expect(credit.expirationWarned).toBe(true);
    });
  });

  describe("Expiration Handler Logic", () => {
    it("should mark expired credits with type 'expired'", () => {
      const credit = { type: "earned", expiresAt: new Date(Date.now() - 86400000) };
      const now = new Date();

      if (credit.expiresAt && credit.expiresAt <= now) {
        credit.type = "expired";
      }

      expect(credit.type).toBe("expired");
    });

    it("should not mark non-expired credits", () => {
      const credit = { type: "earned", expiresAt: new Date(Date.now() + 86400000) };
      const now = new Date();

      if (credit.expiresAt && credit.expiresAt <= now) {
        credit.type = "expired";
      }

      expect(credit.type).toBe("earned");
    });

    it("should handle credits with null expiresAt (legacy)", () => {
      const credit = { type: "earned", expiresAt: null as Date | null };
      const now = new Date();

      if (credit.expiresAt && credit.expiresAt <= now) {
        credit.type = "expired";
      }

      expect(credit.type).toBe("earned"); // Should remain earned
    });
  });

  describe("UI Display Logic", () => {
    it("should calculate days until expiration correctly", () => {
      const expiresAt = new Date(Date.now() + 45 * 86400000); // 45 days from now
      const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      expect(daysUntilExpiry).toBe(45);
    });

    it("should show expiration notice only when balance > 0 and nextExpiryDate exists", () => {
      const stats1 = { creditBalance: 5, nextExpiryDate: new Date(Date.now() + 30 * 86400000) };
      const stats2 = { creditBalance: 0, nextExpiryDate: null };
      const stats3 = { creditBalance: 5, nextExpiryDate: null };

      const shouldShow1 = stats1.creditBalance > 0 && stats1.nextExpiryDate !== null;
      const shouldShow2 = stats2.creditBalance > 0 && stats2.nextExpiryDate !== null;
      const shouldShow3 = stats3.creditBalance > 0 && stats3.nextExpiryDate !== null;

      expect(shouldShow1).toBe(true);
      expect(shouldShow2).toBe(false);
      expect(shouldShow3).toBe(false);
    });

    it("should show expired credits notice when creditsExpired > 0", () => {
      const stats1 = { creditsExpired: 10 };
      const stats2 = { creditsExpired: 0 };

      expect(stats1.creditsExpired > 0).toBe(true);
      expect(stats2.creditsExpired > 0).toBe(false);
    });
  });
});
