# Stripe test credentials and default-client repair — October 23, 2026

## Status

The owner correctly updated **`VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_TEST_SECRET_KEY`, and `STRIPE_TEST_WEBHOOK_SECRET`**. The request to duplicate the new values into protected default fields was based on an incorrect assumption about which settings the owner had saved; those duplicate updates are no longer required for this repair.

Read-only Stripe account/balance requests accept the dedicated test API key and identify the intended OlogyWood account in test mode. The configured publishable key has test publishable-key format. Local cryptographic tests accept the new test signing secret and reject cross-mode claims; read-only Stripe metadata confirms an enabled test destination using the existing webhook URL.

The legacy default test API key is rejected by Stripe with HTTP 401. The app previously instantiated ten default Stripe client paths from that legacy value even though verified test webhook follow-ups already preferred the dedicated test key. This was a client-selection mismatch, not an environment synchronization problem or an error in the owner's three field names.

**The implementation is validated locally and awaits publication plus a Stripe-originated delivery check.** No real checkout, charge, refund, payout, account creation, token creation, event dispatch, permission change, or record mutation was performed during validation.

## Minimal repair

`getDefaultStripeApiKey` preserves the existing primary mode. If that primary mode is test, it uses the already-configured dedicated `STRIPE_TEST_SECRET_KEY`. If the primary mode is live, it retains the original primary live key exactly; a separate live webhook API override cannot change default live account selection. Missing/unknown primary mode and wrong-mode dedicated test credentials fail closed. Existing same-mode legacy fallback remains only when no dedicated test key is configured; an invalid configured dedicated key or provider authentication failure does not trigger fallback or a mode switch.

All ten raw default client constructors now call that resolver. Their Stripe API-version options, request payloads, account/destination lookups, authorization, subscription products, and transaction behavior are unchanged. The existing explicit webhook-mode client resolver remains separate and unchanged. Hosted Content Release paths already using that explicit selector for test mode remain untouched.

When a dedicated signing secret exists for a mode, it supersedes the generic signing secret for that same mode. An old generic test signature is therefore no longer accepted after the test-secret rotation. The same precedence rule applies to an explicit live signing secret, while generic live support remains when no explicit live secret exists. Configuring the same signing value for test and live is rejected rather than silently deduplicated. Event `livemode` enforcement remains intact.

No protected environment value was overwritten in code or through a `.env` file. No secret value was logged, returned by an endpoint, asserted in a real-key test, or committed.

## Existing commerce preserved

Stripe Connect account and transfer routing are unchanged. Existing platform-fee amounts—including the existing 1% single-release/pay-what-you-want mechanism—and subscription, Fan Club, booking, merch, ticketing, tips, and Ology Live business rules are not rewritten. The payment-module diff is exclusively a resolver import and constructor argument replacement. There are no schema changes or account/customer/creator data writes.

Live credential values and default live selection were not changed. This is not a claim that live keys were rotated or independently tested. The previously published Node.js 22.23.4 production patch is unchanged.

## Exact validation

| Check | Result |
|---|---|
| Focused client/selection/webhook/configuration regressions | 29 passed, zero failed |
| Explicit read-only real test credential validation | 4 passed, zero failed |
| Full platform suite | 3,633 passed, 23 existing skipped, zero failed; 3,656 total |
| TypeScript | Passed |
| Production build under Node.js 22.23.4 | Passed, 17.84 seconds |
| Repaired development health | HTTP 200 |
| Constructor-only payment diff and scoped credential/conflict hygiene | Passed |

The real-credential test is opt-in. Ordinary test runs make no external requests or real-secret reads through this test. Validation covers effective default-key equality with the dedicated test key, intended account/test mode, retired generic signing rejection, mode isolation, unchanged live selection, all constructor integrations, and actual shared-client construction with synthetic mocks.

Local signing proves the app accepts its configured secret; it does **not** prove that Stripe uses that secret for the destination. No provider-originated event was delivered as part of these tests. Deployed new-key usage and a real purchase are not asserted.

## Next steps

Publish the validated checkpoint so the server selects the dedicated rotated test key and the frontend is rebuilt with the saved test publishable key. Verify production health and public pages non-mutatively, then inspect a Stripe-originated test delivery for the existing destination. Do not create a payment or refund merely to verify credentials without a separate authorized test. Do not revoke additional keys or change live configuration as part of this test-mode repair.
