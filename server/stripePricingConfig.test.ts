import { describe, expect, it } from "vitest";
import { STRIPE_PRICING, getStripePriceLookupKey } from "./config/stripePricing";
import { SUBSCRIPTION_PRODUCTS } from "../shared/products";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("canonical Stripe pricing configuration", () => {
  it("matches the platform tier names and amounts", () => {
    expect(STRIPE_PRICING.free.name).toBe("Free");
    expect(STRIPE_PRICING.starter).toMatchObject({
      name: "Starter",
      monthly: { amount: 900 },
      yearly: { amount: 9000 },
    });
    expect(STRIPE_PRICING.professional).toMatchObject({
      name: "Professional",
      monthly: { amount: 2900 },
      yearly: { amount: 29000 },
    });
    expect(STRIPE_PRICING.enterprise).toMatchObject({
      name: "Enterprise",
      monthly: { amount: 7900 },
      yearly: { amount: 79000 },
    });
  });

  it("derives lookup keys from shared products for every paid tier and interval", () => {
    expect(getStripePriceLookupKey("starter", "month")).toBe(
      SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.lookupKey,
    );
    expect(getStripePriceLookupKey("starter", "year")).toBe(
      SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.yearlyLookupKey,
    );
    expect(getStripePriceLookupKey("professional", "month")).toBe(
      SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.lookupKey,
    );
    expect(getStripePriceLookupKey("professional", "year")).toBe(
      SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.yearlyLookupKey,
    );
    expect(getStripePriceLookupKey("enterprise", "month")).toBe(
      SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.lookupKey,
    );
    expect(getStripePriceLookupKey("enterprise", "year")).toBe(
      SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.yearlyLookupKey,
    );
    expect(getStripePriceLookupKey("free")).toBeNull();
  });

  it("does not contain account-specific Stripe IDs or placeholder price IDs", () => {
    const source = readFileSync(
      resolve(__dirname, "config/stripePricing.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/prod_[A-Za-z0-9]+/);
    expect(source).not.toMatch(/price_[A-Za-z0-9]+/);
    expect(source).toContain("lookupKey");
  });
});

describe("pricing router contract", () => {
  it("exposes lookup keys instead of price IDs", () => {
    const source = readFileSync(resolve(__dirname, "routers/pricing.ts"), "utf8");
    expect(source).toContain("stripePriceLookupKey");
    expect(source).not.toContain("stripePriceId:");
  });
});
