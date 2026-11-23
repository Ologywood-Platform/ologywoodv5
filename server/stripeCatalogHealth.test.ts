import { describe, expect, it } from "vitest";
import { inspectStripeCatalog, getCanonicalStripeLookupKeys } from "./services/stripeCatalogHealthService";

const products = [
  { id: "prod_starter", name: "Starter Plan", active: true },
  { id: "prod_professional", name: "Professional Plan", active: true },
  { id: "prod_enterprise", name: "Enterprise Plan", active: true },
];

const prices = [
  { id: "price_sm", product: "prod_starter", active: true, unit_amount: 900, currency: "usd", lookup_key: "artist_starter_monthly", recurring: { interval: "month" } },
  { id: "price_sy", product: "prod_starter", active: true, unit_amount: 9000, currency: "usd", lookup_key: "artist_starter_yearly", recurring: { interval: "year" } },
  { id: "price_pm", product: "prod_professional", active: true, unit_amount: 2900, currency: "usd", lookup_key: "artist_professional_monthly", recurring: { interval: "month" } },
  { id: "price_py", product: "prod_professional", active: true, unit_amount: 29000, currency: "usd", lookup_key: "artist_professional_yearly", recurring: { interval: "year" } },
  { id: "price_em", product: "prod_enterprise", active: true, unit_amount: 7900, currency: "usd", lookup_key: "artist_enterprise_monthly", recurring: { interval: "month" } },
  { id: "price_ey", product: "prod_enterprise", active: true, unit_amount: 79000, currency: "usd", lookup_key: "artist_enterprise_yearly", recurring: { interval: "year" } },
];

const client = (overrides: { prices?: unknown[]; products?: unknown[] } = {}) => ({
  prices: { list: async () => ({ data: overrides.prices ?? prices }) },
  products: { list: async () => ({ data: overrides.products ?? products }) },
}) as any;

describe("Stripe catalog health", () => {
  it("recognizes the complete canonical catalog", async () => {
    const result = await inspectStripeCatalog(client(), "test");
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(getCanonicalStripeLookupKeys()).toHaveLength(6);
  });

  it("reports a missing lookup key and amount mismatch", async () => {
    const result = await inspectStripeCatalog(
      client({
        prices: prices
          .filter((price) => price.lookup_key !== "artist_enterprise_monthly")
          .map((price) => price.lookup_key === "artist_professional_monthly" ? { ...price, unit_amount: 3000 } : price),
      }),
      "live",
    );
    expect(result.ok).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      { lookupKey: "artist_enterprise_monthly", message: "Missing active Stripe price" },
      { lookupKey: "artist_professional_monthly", message: "Amount is 3000; expected 2900" },
    ]));
  });
});
