import Stripe from "stripe";
import { SUBSCRIPTION_PRODUCTS } from "../../shared/products";
import { sendEmail } from "../email";

const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000;
let lastAlertFingerprint: string | null = null;
let lastAlertAt = 0;

export type StripeCatalogMode = "live" | "test";

export interface StripeCatalogIssue {
  lookupKey: string;
  message: string;
}

export interface StripeCatalogHealthResult {
  ok: boolean;
  mode: StripeCatalogMode;
  checkedAt: string;
  issues: StripeCatalogIssue[];
  expectedLookupKeys: string[];
}

const paidProducts = [
  SUBSCRIPTION_PRODUCTS.ARTIST_STARTER,
  SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL,
  SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE,
] as const;

function expectedPrices() {
  return paidProducts.flatMap((product) => [
    {
      product,
      lookupKey: product.lookupKey,
      amount: product.priceMonthly,
      interval: "month" as const,
    },
    {
      product,
      lookupKey: product.yearlyLookupKey,
      amount: product.priceYearly,
      interval: "year" as const,
    },
  ]);
}

export async function inspectStripeCatalog(
  client: Pick<Stripe, "prices" | "products">,
  mode: StripeCatalogMode,
): Promise<StripeCatalogHealthResult> {
  const [prices, products] = await Promise.all([
    client.prices.list({ active: true, limit: 100 }),
    client.products.list({ active: true, limit: 100 }),
  ]);
  const productsById = new Map(products.data.map((product) => [product.id, product]));
  const pricesByLookupKey = new Map(
    prices.data
      .filter((price) => price.lookup_key)
      .map((price) => [price.lookup_key as string, price]),
  );
  const issues: StripeCatalogIssue[] = [];

  for (const expected of expectedPrices()) {
    const actual = pricesByLookupKey.get(expected.lookupKey);
    if (!actual) {
      issues.push({ lookupKey: expected.lookupKey, message: "Missing active Stripe price" });
      continue;
    }
    if (actual.unit_amount !== expected.amount) {
      issues.push({ lookupKey: expected.lookupKey, message: `Amount is ${actual.unit_amount ?? "null"}; expected ${expected.amount}` });
    }
    if (actual.currency !== expected.product.currency) {
      issues.push({ lookupKey: expected.lookupKey, message: `Currency is ${actual.currency}; expected ${expected.product.currency}` });
    }
    if (actual.recurring?.interval !== expected.interval) {
      issues.push({ lookupKey: expected.lookupKey, message: `Interval is ${actual.recurring?.interval ?? "null"}; expected ${expected.interval}` });
    }
    const stripeProduct = productsById.get(typeof actual.product === "string" ? actual.product : actual.product.id);
    if (!stripeProduct) {
      issues.push({ lookupKey: expected.lookupKey, message: "Price belongs to a missing or inactive product" });
    } else if (!stripeProduct.active) {
      issues.push({ lookupKey: expected.lookupKey, message: "Price belongs to an inactive product" });
    }
  }

  return {
    ok: issues.length === 0,
    mode,
    checkedAt: new Date().toISOString(),
    issues,
    expectedLookupKeys: expectedPrices().map((expected) => expected.lookupKey),
  };
}

function htmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

async function alertCatalogFailure(result: StripeCatalogHealthResult): Promise<void> {
  const recipient = process.env.STRIPE_CATALOG_ALERT_EMAIL;
  const fingerprint = JSON.stringify(result.issues);
  const now = Date.now();
  if (!recipient || (fingerprint === lastAlertFingerprint && now - lastAlertAt < ALERT_COOLDOWN_MS)) return;

  lastAlertFingerprint = fingerprint;
  lastAlertAt = now;
  const items = result.issues.map((issue) => `<li><strong>${htmlEscape(issue.lookupKey)}</strong>: ${htmlEscape(issue.message)}</li>`).join("");
  await sendEmail({
    to: recipient,
    subject: `[Ologywood] Stripe ${result.mode} catalog mismatch`,
    html: `<p>The scheduled Stripe catalog health check found these issues in ${htmlEscape(result.mode)} mode:</p><ul>${items}</ul><p>Checked at ${htmlEscape(result.checkedAt)}.</p>`,
  }, { timeoutMs: 10_000 });
}

export async function runStripeCatalogHealthCheck(mode: StripeCatalogMode = "live"): Promise<StripeCatalogHealthResult> {
  const key = mode === "live" ? process.env.STRIPE_LIVE_SECRET_KEY : process.env.STRIPE_TEST_SECRET_KEY;
  if (!key) throw new Error(`Stripe ${mode} secret key is not configured`);
  const result = await inspectStripeCatalog(new Stripe(key), mode);
  if (!result.ok) {
    console.error(`[StripeCatalogHealth] ${mode} mismatch`, result.issues);
    await alertCatalogFailure(result);
  } else {
    console.log(`[StripeCatalogHealth] ${mode} catalog OK (${result.expectedLookupKeys.length} lookup keys)`);
  }
  return result;
}

export function getCanonicalStripeLookupKeys(): string[] {
  return expectedPrices().map((expected) => expected.lookupKey);
}
