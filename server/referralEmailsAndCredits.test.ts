import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Referral Email Notifications", () => {
  const emailSource = readFileSync(
    resolve(__dirname, "referralEmails.ts"),
    "utf-8"
  );

  it("exports sendReferralSignupEmail function", () => {
    expect(emailSource).toContain("export async function sendReferralSignupEmail");
  });

  it("exports sendReferralCreditEarnedEmail function", () => {
    expect(emailSource).toContain("export async function sendReferralCreditEarnedEmail");
  });

  it("includes unsubscribe link in emails", () => {
    expect(emailSource).toContain("unsubscribeUrl");
    expect(emailSource).toContain("Unsubscribe");
  });

  it("uses branded email wrapper with Ologywood logo", () => {
    expect(emailSource).toContain("referralEmailWrapper");
    expect(emailSource).toContain("Ologywood");
  });

  it("signup email mentions the referrer credit amount", () => {
    expect(emailSource).toContain("$5.00 referral credit");
  });

  it("credit earned email shows the credit amount prominently", () => {
    expect(emailSource).toContain("creditAmount.toFixed(2)");
  });

  it("includes privacy policy link", () => {
    expect(emailSource).toContain("Privacy Policy");
  });

  it("includes manage preferences link", () => {
    expect(emailSource).toContain("Manage preferences");
  });
});

describe("Referral Router Email Integration", () => {
  const routerSource = readFileSync(
    resolve(__dirname, "routers/referral.ts"),
    "utf-8"
  );

  it("imports referral email functions", () => {
    expect(routerSource).toContain("import { sendReferralSignupEmail, sendReferralCreditEarnedEmail }");
  });

  it("sends signup email after successful referral application", () => {
    expect(routerSource).toContain("sendReferralSignupEmail({");
  });

  it("sends credit earned email after successful referral application", () => {
    expect(routerSource).toContain("sendReferralCreditEarnedEmail({");
  });

  it("email sending is non-blocking (uses .catch)", () => {
    expect(routerSource).toContain('.catch((err: unknown) => console.error("[Referral] Failed to send signup email:"');
    expect(routerSource).toContain('.catch((err: unknown) => console.error("[Referral] Failed to send credit email:"');
  });

  it("looks up referrer info for email", () => {
    expect(routerSource).toContain("referrerInfo");
    expect(routerSource).toContain("referrerEmail");
  });
});

describe("Credit Redemption at Checkout", () => {
  const routersSource = readFileSync(
    resolve(__dirname, "routers.ts"),
    "utf-8"
  );

  it("createCheckoutSession accepts useCredits parameter", () => {
    expect(routersSource).toContain("useCredits: z.boolean().optional().default(false)");
  });

  it("calculates credit balance from earned minus redeemed", () => {
    expect(routersSource).toContain("const balance = earned - redeemed");
  });

  it("creates a Stripe coupon with the credit amount", () => {
    expect(routersSource).toContain("stripeClient.coupons.create");
    expect(routersSource).toContain("amount_off: amountOff");
  });

  it("records credit redemption in database", () => {
    expect(routersSource).toContain("type: 'redeemed'");
    expect(routersSource).toContain("Applied $");
  });

  it("passes couponId to createSubscriptionCheckoutSession", () => {
    expect(routersSource).toContain("couponId,");
  });
});

describe("Stripe Checkout Session Coupon Support", () => {
  const stripeSource = readFileSync(
    resolve(__dirname, "stripe.ts"),
    "utf-8"
  );

  it("accepts couponId parameter", () => {
    expect(stripeSource).toContain("couponId?: string");
  });

  it("applies discounts array when couponId is provided", () => {
    expect(stripeSource).toContain("sessionParams.discounts = [{ coupon: params.couponId }]");
  });

  it("disables allow_promotion_codes when coupon is used", () => {
    expect(stripeSource).toContain("allow_promotion_codes: params.couponId ? undefined : true");
  });

  it("skips trial when coupon is applied", () => {
    expect(stripeSource).toContain("&& !params.couponId");
  });
});

describe("Credit Redemption UI in Comparison Modal", () => {
  const modalSource = readFileSync(
    resolve(__dirname, "../client/src/components/UpgradeComparisonModal.tsx"),
    "utf-8"
  );

  it("accepts creditBalance prop", () => {
    expect(modalSource).toContain("creditBalance?: number");
  });

  it("accepts useCredits prop", () => {
    expect(modalSource).toContain("useCredits?: boolean");
  });

  it("accepts onToggleCredits callback", () => {
    expect(modalSource).toContain("onToggleCredits?: (value: boolean) => void");
  });

  it("shows credit toggle when balance > 0 and not downgrading", () => {
    expect(modalSource).toContain("creditBalance > 0 && !isDowngrade && onToggleCredits");
  });

  it("displays the credit amount in the toggle", () => {
    expect(modalSource).toContain("creditBalance.toFixed(2)");
  });

  it("shows confirmation text when credits are applied", () => {
    expect(modalSource).toContain("Your credit will be applied as a discount at checkout");
  });
});

describe("Pricing Page Credit Integration", () => {
  const pricingSource = readFileSync(
    resolve(__dirname, "../client/src/pages/Pricing.tsx"),
    "utf-8"
  );

  it("fetches credit stats from referral API", () => {
    expect(pricingSource).toContain("trpc.referral");
    expect(pricingSource).toContain("getMyStats");
  });

  it("has useCredits state", () => {
    expect(pricingSource).toContain("useCredits, setUseCredits");
  });

  it("passes useCredits to checkout mutation", () => {
    expect(pricingSource).toContain("useCredits: useCredits && creditBalance > 0");
  });

  it("passes credit props to UpgradeComparisonModal", () => {
    expect(pricingSource).toContain("creditBalance={creditBalance}");
    expect(pricingSource).toContain("useCredits={useCredits}");
    expect(pricingSource).toContain("onToggleCredits={setUseCredits}");
  });
});
