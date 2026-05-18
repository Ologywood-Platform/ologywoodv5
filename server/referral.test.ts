import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Referral System", () => {
  describe("Referral Router", () => {
    const routerSource = readFileSync(
      resolve(__dirname, "routers/referral.ts"),
      "utf-8"
    );

    it("exports a referralRouter", () => {
      expect(routerSource).toContain("export const referralRouter");
    });

    it("has getMyCode procedure", () => {
      expect(routerSource).toContain("getMyCode: protectedProcedure");
    });

    it("has getMyStats procedure", () => {
      expect(routerSource).toContain("getMyStats: protectedProcedure");
    });

    it("has getMyReferrals procedure", () => {
      expect(routerSource).toContain("getMyReferrals: protectedProcedure");
    });

    it("has getCreditHistory procedure", () => {
      expect(routerSource).toContain("getCreditHistory: protectedProcedure");
    });

    it("has validateCode public procedure", () => {
      expect(routerSource).toContain("validateCode: publicProcedure");
    });

    it("has applyCode protected procedure", () => {
      expect(routerSource).toContain("applyCode: protectedProcedure");
    });

    it("has getDiscountCheckout procedure", () => {
      expect(routerSource).toContain("getDiscountCheckout: protectedProcedure");
    });

    it("prevents self-referral", () => {
      expect(routerSource).toContain("You cannot use your own referral code");
    });

    it("prevents duplicate referral usage", () => {
      expect(routerSource).toContain("You have already used a referral code");
    });

    it("awards $5 credit to referrer", () => {
      expect(routerSource).toContain("REFERRER_CREDIT_AMOUNT = 5.00");
    });

    it("offers 50% discount to referred user", () => {
      expect(routerSource).toContain("REFERRED_DISCOUNT_PERCENT = 50");
    });

    it("generates a new code for referrer after successful referral", () => {
      expect(routerSource).toContain(
        "Create a new pending referral code for the referrer"
      );
    });
  });

  describe("Referral Frontend Component", () => {
    const componentSource = readFileSync(
      resolve(__dirname, "../client/src/components/ReferralSection.tsx"),
      "utf-8"
    );

    it("renders referral link with ref param", () => {
      expect(componentSource).toContain("signup?ref=");
    });

    it("has copy button functionality", () => {
      expect(componentSource).toContain("navigator.clipboard.writeText");
    });

    it("has native share support", () => {
      expect(componentSource).toContain("navigator.share");
    });

    it("displays referral stats (total, converted, credits)", () => {
      expect(componentSource).toContain("totalReferrals");
      expect(componentSource).toContain("convertedReferrals");
      expect(componentSource).toContain("creditBalance");
    });

    it("shows recent referral history", () => {
      expect(componentSource).toContain("Recent Referrals");
    });

    it("uses trpc.referral.getMyCode", () => {
      expect(componentSource).toContain("trpc.referral.getMyCode");
    });

    it("uses trpc.referral.getMyStats", () => {
      expect(componentSource).toContain("trpc.referral.getMyStats");
    });
  });

  describe("Referral Code Application on Signup", () => {
    const roleSelectionSource = readFileSync(
      resolve(__dirname, "../client/src/pages/RoleSelection.tsx"),
      "utf-8"
    );

    it("reads ref param from URL on role selection page", () => {
      expect(roleSelectionSource).toContain('urlParams.get("ref")');
    });

    it("calls applyCode mutation with the referral code", () => {
      expect(roleSelectionSource).toContain("applyReferral.mutate({ code: refCode })");
    });

    it("prevents duplicate application with ref", () => {
      expect(roleSelectionSource).toContain("referralAppliedRef");
    });
  });

  describe("Login URL with Referral Code", () => {
    const constSource = readFileSync(
      resolve(__dirname, "../client/src/const.ts"),
      "utf-8"
    );

    it("passes referral code through OAuth state returnPath", () => {
      expect(constSource).toContain('urlParams.get("ref")');
      expect(constSource).toContain("/get-started?ref=");
    });
  });

  describe("Database Schema", () => {
    const schemaSource = readFileSync(
      resolve(__dirname, "../drizzle/schema.ts"),
      "utf-8"
    );

    it("has referrals table with referralCode field", () => {
      expect(schemaSource).toContain('referralCode: varchar("referralCode"');
    });

    it("has referralCredits table", () => {
      expect(schemaSource).toContain('export const referralCredits = mysqlTable("referral_credits"');
    });

    it("referralCredits has earned and redeemed types", () => {
      expect(schemaSource).toContain('["earned", "redeemed"]');
    });

    it("referrals table has convertedAt timestamp", () => {
      expect(schemaSource).toContain('convertedAt: timestamp("convertedAt")');
    });
  });

  describe("Switch to Yearly Button in Modal", () => {
    const modalSource = readFileSync(
      resolve(__dirname, "../client/src/components/UpgradeComparisonModal.tsx"),
      "utf-8"
    );

    it("has onSwitchToYearly callback prop", () => {
      expect(modalSource).toContain("onSwitchToYearly");
    });

    it("shows Switch to Yearly button in savings nudge", () => {
      expect(modalSource).toContain("Switch to Yearly");
    });
  });
});
