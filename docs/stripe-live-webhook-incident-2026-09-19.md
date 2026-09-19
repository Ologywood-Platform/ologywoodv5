# Stripe Live Webhook Incident — September 19, 2026

## Confirmed cause

Stripe Workbench showed that the active live destination `we_1TXZ7SAjAqXCmw11rLDR7XYp` at `https://ologywood-mp6flm6c.manus.space/api/stripe/webhook` listens to 11 event types and had **2,574 failed deliveries** for the displayed week at 12:26 PM EDT on September 19, 2026. Recent deliveries returned **HTTP 400**, and the response body was Stripe’s signature-mismatch error. The destination response-time graph showed 96 ms minimum, 814 ms average, and 3.86 seconds maximum, so the dominant problem was not a timeout or network outage.

The configured event set is correct for the current handler: `charge.refunded`, `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.deleted`, `customer.subscription.updated`, `invoice.paid`, `invoice.payment_failed`, `payment_intent.payment_failed`, `payment_intent.succeeded`, `payout.failed`, and `payout.paid`.

The application supported a shared live/test URL, but associated the generic `STRIPE_WEBHOOK_SECRET` with the mode of `STRIPE_SECRET_KEY`. That configuration becomes unsafe when the project’s primary development key is test-mode while Stripe also sends live events to the same URL. The handler then has no independently named live signing secret to try and rejects legitimate live deliveries before business logic runs.

## Customer-impact review

Two live `payment_intent.succeeded` events for **$4.99 each** on September 16, 2026 carried OlogyWood merchandise metadata for orders **49** (`OWM-20260916-FF4D33`) and **53** (`OWM-20260916-A82DBE`). A read-only database check showed that both orders still had `paymentStatus = pending`, no stored Stripe PaymentIntent ID, and no paid timestamp. This confirms that two paid live merchandise orders were not fulfilled by the platform because their webhooks were rejected.

Stripe Workbench also showed repeated failed-payment events. Those events were also rejected at signature verification. Failed merchandise payments are intended to move pending orders to a failed/cancelled state when the event contains an OlogyWood order ID.

## Repair

The webhook verifier now supports explicit, independently named credentials:

- `STRIPE_LIVE_WEBHOOK_SECRET` for the live destination signing secret.
- `STRIPE_TEST_WEBHOOK_SECRET` for the test destination signing secret.
- `STRIPE_LIVE_SECRET_KEY` for optional live-mode API follow-up calls, with safe fallback to a valid live `STRIPE_SECRET_KEY`.
- `STRIPE_TEST_SECRET_KEY` for test-mode API follow-up calls.

The existing generic variables remain supported for backward compatibility, but a test-mode primary key can no longer cause the live destination secret to be misclassified.

The merchandise handler now also treats `payment_intent.succeeded` with `type = merch_purchase` and an `orderId` as a fallback fulfillment signal. It maps that event into the same transactionally idempotent order-finalization path used by `checkout.session.completed`. If both events arrive, only the first can change the order from non-paid to paid, so inventory, downloadable-book access, seller notifications, and order state cannot be duplicated.

After live recovery, the state transitions were hardened further for Stripe’s unordered retry model. Merchandise success can now move only `pending` or `failed` orders to `paid`; merchandise failure cannot downgrade `paid` or `refunded` orders; refunds can move only `paid` orders to `refunded`; booking success/failure cannot overwrite refunded or fully paid terminal states; invoice-failure retries persist the subscription’s current Stripe state rather than blindly writing `past_due`; and payout retries update the existing transfer record instead of inserting duplicates or downgrading a completed payout.

Subscription-created and subscription-cancelled emails are now non-critical side effects after the subscription state is saved. Email-provider failures are logged but no longer convert a successfully persisted financial event into an HTTP 500 retry.

## Production verification plan (completed)

After publishing the repair with the live signing secret, send a harmless correctly signed live probe and confirm HTTP 200, then resend the two known `payment_intent.succeeded` events from Stripe Workbench. Verify that orders 49 and 53 each become paid exactly once and receive their PaymentIntent references. Review the remaining unique failed live events from September 16 onward and resend any fulfillment-critical events that did not succeed automatically. No charge, refund, payout, or customer object should be created during verification.

## Local validation

The live destination signing secret was entered through encrypted project configuration and was not written to source code. The running application returned HTTP 200 for a harmless live-signed probe, HTTP 200 for a harmless test-signed probe, and HTTP 400 for an invalid signature. The live API-key row in Stripe exposed only its `mk_` key-record ID after the secret had previously been revealed; the code therefore ignores that invalid optional override and continues to use an already configured live `STRIPE_SECRET_KEY` when available.

The focused Stripe, checkout, merchandise, ticketing, and payout regression set passed **183 tests across 13 files**. The complete platform suite passed **2,825 tests with 23 skipped** and no failures. TypeScript, the production build, diff hygiene, conflict-marker scanning, and credential-literal scanning all passed.

## Production verification

Checkpoint `a8593bcc` was published on September 19, 2026. A harmless event signed with the configured live destination secret returned **HTTP 200** from the production webhook, while the same endpoint returned **HTTP 400** for an invalid signature. This confirms the deployed endpoint now recognizes the live destination secret without weakening signature enforcement.

Stripe redelivery was initiated for order 49’s `payment_intent.succeeded` event (`evt_3UGLR8AjAqXCmw111lQ6qCSR`) as delivery attempt `wc_1UHRlyAjAqXCmw119t4cc9vS`. A read-only database audit then confirmed that order 49 changed from pending to **paid**, gained its Stripe PaymentIntent reference, and gained a paid timestamp.

Stripe redelivery was initiated for order 53’s `payment_intent.succeeded` event (`evt_3UGLTLAjAqXCmw110vVzg4KD`) as delivery attempt `wc_1UHRndAjAqXCmw11i7vO9lnD`. A read-only database audit confirmed that order 53 also changed from pending to **paid**, gained its Stripe PaymentIntent reference, and gained a paid timestamp. The Workbench event-detail list remained visually stale immediately after redelivery, but the attempt identifier and resulting database state independently confirmed processing.

A final read-only audit after both redeliveries confirmed that orders 49 and 53 remained paid, retained their PaymentIntent references, and retained paid timestamps. No charge, refund, payout, customer object, or new order was created during verification.

Final state-ordering checkpoint `f3c389c6` was then published. Production again returned **HTTP 200** for a valid live signature and **HTTP 400** for an invalid signature. A controlled, correctly signed `payment_intent.payment_failed` replay targeting already-paid order 49 returned **HTTP 200**, while a read-only audit proved that neither order 49 nor order 53 was downgraded, cancelled, or assigned the probe PaymentIntent. This closes the live incident and validates the stale-event guard on the production runtime.

## Sources

Stripe requires the exact endpoint signing secret and unmodified raw request body for verification. Stripe retries live webhook deliveries for up to three days, does not guarantee event order, recommends tracking event IDs or using idempotent object-level handling, and advises returning a successful response only after safe handling. See [Stripe webhooks](https://docs.stripe.com/webhooks) and [Stripe signature troubleshooting](https://docs.stripe.com/webhooks/signature).
