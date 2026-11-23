

## Stripe tier-name audit and safe correction

The owner-provided Stripe Product Catalog screenshot confirms a catalog naming mismatch: the visible active products are **Starter Plan**, **Starter Tier**, **Professional Tier**, and **Free Tier**; the visible catalog does not show Enterprise. This inspection was read-only. No Stripe product, price, subscription, payment mode, or live setting was changed.

The platform-side mismatch was corrected without relying on account-specific Stripe IDs. `server/config/stripePricing.ts` now derives names, amounts, and monthly/yearly lookup keys from `shared/products.ts` for the canonical platform tiers: Free, Starter, Professional, and Enterprise. `server/routers/pricing.ts` now returns `stripePriceLookupKey` rather than exposing a stale `stripePriceId`. Email copy no longer says “Welcome to Premium,” and the beta trial service now emits `professional` rather than legacy `premium` terminology while preserving the existing three-month behavior.

Regression coverage now verifies the canonical amounts, lookup keys, absence of hard-coded Stripe product/price IDs, pricing-router field naming, and current subscription email terminology. Validation passed: 97 focused tests, TypeScript, production build, and `git diff --check`.

The Stripe catalog itself still requires an owner-approved, controlled decision if the visible legacy labels should be renamed or if Enterprise should be created/activated in that Stripe account. That decision is intentionally deferred; the application correction does not mutate Stripe and does not certify the catalog as ready for production until the account/mode-specific catalog is reconciled by the owner.
