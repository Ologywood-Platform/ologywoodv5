# Stripe Same-URL Dual-Mode Webhook Repair

## Incident

Stripe reported ten failed **test-mode** deliveries to `https://ologywood-mp6flm6c.manus.space/api/stripe/webhook`, beginning August 31, 2026 at 2:33:45 AM UTC. The deployed handler accepted only one `STRIPE_WEBHOOK_SECRET`. A harmless event signed with the configured test-mode endpoint secret was sent to the deployed URL and received HTTP 400 with Stripe's `No signatures found matching the expected signature for payload` message, confirming that the production deployment was verifying with a different signing secret.

## Stripe requirements

Stripe states that every webhook endpoint has a unique signing secret and that, when the same URL is used in test and live modes, the signing secrets are different. Stripe also requires signature verification to use the unmodified raw request body, `Stripe-Signature` header, and endpoint-specific `whsec_` secret. In Express, the webhook route must be registered before `express.json()` so the raw bytes are preserved. Valid deliveries must receive an HTTP 2xx response; invalid signatures should receive HTTP 400.

Stripe also states that test and live API objects are isolated. A test-mode object cannot be retrieved with a live API key. This matters for `invoice.payment_failed`, whose handler retrieves the related subscription after signature verification.

## OlogyWood design

The user approved keeping one URL. The handler now:

1. Tries the primary mode-specific signing secret and the separate test signing secret without weakening verification.
2. Confirms that `event.livemode` matches the credential mode that verified the signature.
3. Uses the matching live or test Stripe API key for any follow-up retrieval.
4. Keeps the webhook route before JSON parsing.
5. Returns 200 for valid unsupported events and 400 for missing or invalid signatures.
6. Makes ticket fulfillment atomic and conditional on a pending order so Stripe retries cannot issue duplicate tickets or increment inventory twice.

## Validation

The supplied `STRIPE_TEST_SECRET_KEY` successfully authenticated to Stripe's read-only test-mode balance endpoint, and the supplied endpoint secret passed format validation. Through the running Express application, a correctly test-signed request to the existing `/api/stripe/webhook` URL returned HTTP 200 with `{"received":true}`, while an invalid signature returned HTTP 400. A pre-fix probe sent to the currently published deployment returned HTTP 400 with Stripe's signature-mismatch message, reproducing the reported mode mismatch without creating payment data.

The focused payment suite passed **327 tests across 16 files**. The complete platform suite passed **2,750 tests**, with **23 skipped**, across **154 files**. TypeScript passed with zero errors, and the production build completed successfully in **27.15 seconds**. No real charge, refund, payout, invoice, order, subscription, or customer record was created or changed during diagnosis.

The production endpoint will continue running the previously published single-secret handler until the repair checkpoint is published. After publication, use Stripe test mode to retry one failed delivery; a 2xx result confirms production is using both mode-specific signing secrets.

The completed implementation and validation state was saved as checkpoint **100aa60e**.

## References

1. [Stripe: Receive Stripe events in your webhook endpoint](https://docs.stripe.com/webhooks)
2. [Stripe: Resolve webhook signature verification errors](https://docs.stripe.com/webhooks/signature)
3. [Stripe: Testing use cases](https://docs.stripe.com/testing-use-cases)
