# Stripe test credentials and default-client repair — October 23, 2026

## Status

The owner correctly updated **`VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_TEST_SECRET_KEY`, and `STRIPE_TEST_WEBHOOK_SECRET`**. The request to duplicate the new values into protected default fields was based on an incorrect assumption about which settings the owner had saved; those duplicate updates are no longer required for this repair.

Read-only Stripe account/balance requests accept the dedicated test API key and identify the intended OlogyWood account in test mode. The configured publishable key has test publishable-key format. Local cryptographic tests accept the new test signing secret and reject cross-mode claims; read-only Stripe metadata confirms an enabled test destination using the existing webhook URL.

The legacy default test API key is rejected by Stripe with HTTP 401. The app previously instantiated ten default Stripe client paths from that legacy value even though verified test webhook follow-ups already preferred the dedicated test key. This was a client-selection mismatch, not an environment synchronization problem or an error in the owner's three field names.

**The owner published checkpoint 76489844, then reported saving all three live credentials. The saved live API key authenticates to the intended live account, and both production domains accept the saved live signing secret. A Stripe-originated delivery, end-to-end purchase and old live API-key retirement remain unconfirmed.** No real checkout, charge, refund, payout, account creation, token creation, permission change, or application record mutation was performed during validation. Record-free synthetic unsupported probe events were sent only to verify deployed signature handling.

## Minimal repair

`getDefaultStripeApiKey` preserves the existing primary mode. If that primary mode is test, it uses the already-configured dedicated `STRIPE_TEST_SECRET_KEY`. If the primary mode is live, it retains the original primary live key exactly; a separate live webhook API override cannot change default live account selection. Missing/unknown primary mode and wrong-mode dedicated test credentials fail closed. Existing same-mode legacy fallback remains only when no dedicated test key is configured; an invalid configured dedicated key or provider authentication failure does not trigger fallback or a mode switch.

All ten raw default client constructors now call that resolver. Their Stripe API-version options, request payloads, account/destination lookups, authorization, subscription products, and transaction behavior are unchanged. The existing explicit webhook-mode client resolver remains separate and unchanged. Hosted Content Release paths already using that explicit selector for test mode remain untouched.

When a dedicated signing secret exists for a mode, it supersedes the generic signing secret for that same mode. An old generic test signature is therefore no longer accepted after the test-secret rotation. The same precedence rule applies to an explicit live signing secret, while generic live support remains when no explicit live secret exists. Configuring the same signing value for test and live is rejected rather than silently deduplicated. Event `livemode` enforcement remains intact.

No protected environment value was overwritten in code or through a `.env` file. No secret value was logged, returned by an endpoint, asserted in a real-key test, or committed.

## Existing commerce preserved

Stripe Connect account and transfer routing are unchanged. Existing platform-fee amounts—including the existing 1% single-release/pay-what-you-want mechanism—and subscription, Fan Club, booking, merch, ticketing, tips, and Ology Live business rules are not rewritten. The payment-module diff is exclusively a resolver import and constructor argument replacement. There are no schema changes or account/customer/creator data writes.

The test-client code repair did not modify live credential values or default live selection. The owner subsequently saved live replacements; the read-only and synthetic verification below does not prove the deployed default Checkout client uses the replacement API key or that the old live API key is revoked. The previously published Node.js 22.23.4 production patch is unchanged.

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

## Production verification and live/test boundary

After publication, normal-browser checks confirmed homepage, public artist music/merch sections, Shop and Pricing render. The primary domain's uncached health returned HTTP 200 and `runtimeVerified: true`, preserving the Node.js 22.23.4 guard. Both production domains accepted an unsupported test probe signed with the new dedicated test signing secret with HTTP 200; both rejected the retired generic test signature with HTTP 400. The unsupported event reaches no financial or application-data writer.

Production's loaded Pricing helper contains a live publishable key, not the saved development test publishable key. This is a frontend-mode observation, not proof of the production server's current secret-key value or successful live-secret rotation. No production mode switch was made. Read-only Stripe metadata confirms the existing test destination is enabled with its original eleven event selections, but the test account returned no retained events to resend. The proposed temporary test customer/event-subscription change has not been approved or performed.

Test and live credentials are separate. Replacing test keys does not rotate a potentially exposed live secret key. Stripe recommends rotating potentially compromised secret keys and confirming requests use the replacement before retiring the old key. Webhook signing secrets are separate from API keys; replace the live signing setting if its particular endpoint secret was rolled. A purchase through live Checkout uses real money and may incur processing/platform fees; it is not a sandbox test and does not by itself prove credential retirement. Sources: [Stripe API keys](https://docs.stripe.com/keys) and [Stripe compromised-key response](https://support.stripe.com/questions/protecting-against-compromised-api-keys).

## Live credential follow-up — October 23, 2026, 13:42 EDT

The saved `STRIPE_LIVE_SECRET_KEY` passed real read-only account and balance requests: intended OlogyWood account and `livemode: true`. Read-only metadata confirms an enabled live webhook destination at the existing OlogyWood URL. No balance amounts, customer details, secret values or request headers were printed. Live and test signing values are distinct.

Initial production probes returned HTTP 404, and the custom-domain browser showed a Manus not-found page. A subsequent managed deployment-success notification was observed, followed by recovered custom and managed domains. Fresh unsupported probes signed with the saved live secret and saved test secret each returned HTTP 200 with `{received: true}` on both domains. The current Pricing page renders, its loaded assets contain a live publishable key and no test publishable key, and uncached production health returns HTTP 200 with `runtimeVerified: true`. Exact equality of the deployed publishable key with the owner's replacement is not asserted because the development environment exposes its separate test setting.

Existing client/selection/webhook/configuration regressions were rerun under Node.js 22.23.4: 29 passed, zero failed or skipped. No application-source code was changed in this follow-up; previous full-suite, typecheck and build results apply to the unchanged code. The synthetic ignored event verifies signing configuration, not Stripe-originated delivery or payment fulfillment. No temporary customer was created and no webhook event selections were changed.

## Next steps

If the owner proceeds with their planned real single purchase, inspect that specific payment and its Stripe-originated webhook delivery read-only; confirm fulfillment in My Ology and the music library. Confirm requests use the replacement production API key before declaring API-key retirement complete. A real purchase is the owner's own action, not an automatic validation step. Do not run the temporary test-customer plan without approval; do not replay financial events, create payments/refunds, revoke additional keys, or change live settings on the basis of an ambiguous reply. Provider-originated delivery proof remains pending.
