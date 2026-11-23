import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Stripe catalog alert configuration", () => {
  it("accepts the configured owner alert email when present", () => {
    const recipient = process.env.STRIPE_CATALOG_ALERT_EMAIL;
    if (recipient) {
      expect(recipient).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }
  });

  it("wires the alert recipient into the health-check notification path", () => {
    const source = readFileSync(
      resolve(__dirname, "services/stripeCatalogHealthService.ts"),
      "utf8",
    );
    expect(source).toContain("process.env.STRIPE_CATALOG_ALERT_EMAIL");
    expect(source).toContain("sendEmail({");
  });
});
