# Stripe payouts expired-key repair — October 25, 2026

## Status

**Closed.** The owner confirmed “Its working.” on October 25, 2026 at 21:01:48 EDT after receiving repair checkpoint `901bc88a` and instructions to publish and retry the payouts button. Record this as owner-confirmed working payouts-link behavior, not an independently inspected Stripe session or payout. This is a new default-live credential defect, not a reopening of the completed October 23 webhook signing and sandbox-delivery work.

## Confirmed cause

The owner clicked **Open Stripe payouts** on Creator Shop Orders and received Stripe's expired live API-key error. The button calls the protected `stripeConnect.getDashboardLink` endpoint, whose module constructs its Stripe client through `getDefaultStripeApiKey`.

The existing selector preferred the rotated dedicated key in test mode but returned the original `STRIPE_SECRET_KEY` verbatim in live mode. Consequently, saving a replacement `STRIPE_LIVE_SECRET_KEY` repaired explicit live webhook API calls but did not replace the credential used by default live Connect and payment clients.

Read-only Stripe account requests confirmed that the current saved legacy primary key is rejected with HTTP 401 / `api_key_expired`, while both dedicated live/test keys are valid and identify the intended OlogyWood platform account. The local primary configuration is test mode; the owner's production screenshot identifies the rejected live credential. Those environments must not be conflated. No plaintext credentials, headers or provider response bodies were returned in diagnostic output.

## Narrow repair and boundaries

- Preserve the primary key's existing live/test mode. Default clients now prefer the configured replacement for that same mode. A live default never selects the test key; a test default never selects the live key.
- Retain the primary live fallback only when no dedicated replacement is configured. A malformed configured live replacement fails closed rather than silently using a retired credential. No fallback after a provider authentication error is introduced.
- For this deployment, the replacement live key was independently verified to identify OlogyWood's intended platform account. The selector is not a general cross-account identity verifier: future administrator credential changes must likewise belong to the same platform account.
- Keep all ten existing default client integrations, Stripe API versions, connected-account IDs, Checkout request bodies, subscription behavior, payment amounts and fee rules unchanged. No Stripe keys, signing secrets or publishable-key settings were edited or rotated during this repair.
- Sanitize payouts-link failures at the server: return a fixed support/retry message without an original error cause, provider message or key fragment. Preserve the safe no-connected-account response. The related Connect status log no longer prints provider messages.
- Keep dashboard-link lookup scoped to the authenticated user's stored connected account. Anonymous requests remain unauthorized; validation did not generate a real Express login link or initiate a payout.

The central selector correction also reaches other default live clients so they do not continue using the same expired credential. This is credential selection, not a change to payment or revenue routing. No bank reconnection or new Stripe account is required for this fix.

## Validation

| Check | Result |
|---|---|
| Focused payouts/client/selection/webhook/configuration tests | 51 passed, zero failed |
| Full platform suite | 3,735 passed, 23 existing skipped, zero failed; 3,758 total |
| TypeScript under Node.js 22.23.4 | Passed |
| Production build | Passed, 18.04 seconds |
| Read-only dedicated live/test identity | Intended OlogyWood account confirmed |
| Repaired live selector branch with saved replacement | Intended account confirmed through a read-only request; persisted mode not changed |
| Anonymous actual local payouts-link endpoint | JSON HTTP 401, no key fragments |
| Endpoint tests | Actual router construction, user-scoped lookup, safe missing-account response, provider/database error sanitization and no authentication fallback |
| Diff/conflict/actual-secret scan | Passed |

Existing webhook signature, live/test separation and fee regressions passed. All endpoint login-link calls in tests were mocked. No real creator/user/profile/order/payment/Connect/bank/payout record was modified, no real purchase or transfer was made, and no webhook event was replayed.

## Publication and closeout

The owner reported that **Open Stripe payouts** is now working. The expired-key link repair is complete; no additional secret entry, account reconnection, purchase, webhook replay or repeated payouts-link test is required. This confirmation does not establish payout availability, completed settlement, bank changes or real-money purchase fulfillment.

The module-level clients are reconstructed on deployment/startup. The implementation retains its 3,735 passing tests, TypeScript and production-build validation. This closeout changes only the implementation record and tracker; no application code or financial records were changed and no new financial operation was performed. No further publication is needed for this documentation-only closeout. Do not repeat the completed webhook/signing setup or rotate further keys to address this closed selector bug.
