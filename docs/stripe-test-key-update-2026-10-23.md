# Stripe credential repair and webhook verification — October 23, 2026

## Closed work — do not reopen

**The default test-client repair, test/live webhook signing correction, sandbox purchase check, and Stripe-originated test delivery are complete.** The owner published checkpoint `f186c97b`; production verification was recorded in documentation-only checkpoint `9df30408`. No additional publication, secret entry, purchase, or event replay is required for these completed issues.

Both production domains accept their corrected test and live signing secrets with HTTP 200 and `{received: true}`. Stripe Workbench records the existing sandbox Checkout event as **200 OK — Delivered** at **14:33:44 EDT**, and the independent test event API reports **zero pending webhooks**. Wrong-mode signatures remain rejected with HTTP 400.

Earlier failed deliveries and temporary deployment responses are historical evidence, not outstanding work. The successful final delivery supersedes the earlier signature-mismatch attempts. Do not repeat the completed setup or testing merely because older Stripe logs retain failed attempts.

## Repairs implemented

The owner saved the dedicated test API key, test signing secret and test publishable key in the correct project settings. The initial request to duplicate these into protected default fields was withdrawn. The actual test-client defect was that ten default Stripe constructors still used the rejected legacy test API key.

At the October 23 closeout, `getDefaultStripeApiKey` used the dedicated rotated test key when the existing primary mode was test, but preserved the original primary live key in live mode. That historical live behavior caused the separately reported October 25 expired-key payouts defect and is superseded by [the default-live credential repair](stripe-payouts-expired-key-repair-2026-10-25.md). The new repair preserves primary mode and uses the verified same-platform replacement for it; missing/unknown/wrong-mode configuration remains fail-closed, with no fallback after authentication failure. All ten integrations retain their API versions, request payloads, Connect destinations and business rules. This does not reopen completed webhook signing or sandbox-delivery work.

Mode-specific signing secrets supersede generic secrets for the same mode. The existing cross-mode ambiguity guard rejects identical test/live signing values; event `livemode` must match the verified signing mode. With the owner's separate approvals, the signing values were corrected through secure forms and matched to their exact Stripe destinations through one-way comparisons. No plaintext secret was printed or committed, and the secret display was hidden after comparison.

The final matching configuration became accepted in production after the fresh checkpoint publication. The precise internal cause of the preceding deployment/configuration difference was not independently established; do not invent a confirmed caching or hosting root cause.

## Sandbox purchase and real provider delivery

| Item | Verified result |
|---|---|
| Actual Stripe-hosted Checkout | $0.50 USD, Stripe public fake card, explicitly test mode |
| Session / PaymentIntent | Paid / succeeded; no real-money charge |
| Application test harness | Actual single Checkout, webhook, library and stream code; in-memory database, captured email and local test audio |
| Isolated fulfillment | One receipt and one library item; sequential replay did not duplicate the receipt |
| Stream access | Unauthorized streaming denied; test audio returned |
| Production provider delivery | Stripe-originated `checkout.session.completed`, HTTP 200, response `{received: true}` |
| Pending webhook count | Zero after the successful retry |
| Real application fixture rows | Zero matching release, profile, user and purchase records after successful delivery |

The harness did not create real creator/profile/purchase records. Its synthetic payment is intentionally absent from real My Ology. The owner-approved retries reused the same event; no second purchase, live charge, refund, customer, Connect transfer, payout or actual email send occurred. The temporary customer/event-subscription proposal was never performed.

The test destination remains `we_1TYHyTAjAqXCmw11dOtjgZK7`; the live destination remains `we_1TXZ7SAjAqXCmw11rLDR7XYp`. Both retain `https://ologywood-mp6flm6c.manus.space/api/stripe/webhook` and their eleven original subscribed events. Fees, schemas, account permissions, publication rules and application payment logic were not changed during the signing correction.

### Retained audit identifiers

- Session: `cs_test_b1aupw8Uhne6MTcPTaAcOzTNJxMv5zCnQIwK8IF6r1P3ki6wlTeEGFmbpq`
- Event: `evt_1UTmgRAjAqXCmw11pSWngVGu`
- Successful delivery attempt: `wc_1UTnHgAjAqXCmw11aeOZwBup`
- Delivered: October 23, 2026, 14:33:44 EDT
- Published corrected configuration: `f186c97b`
- Verified delivery closeout: `9df30408`

## Validation evidence

| Check | Result |
|---|---|
| Focused client/selection/webhook/configuration regressions | 29 passed, zero failed |
| Explicit read-only/signature configuration validation | 4 passed, zero failed |
| Full platform suite for unchanged repair code | 3,633 passed, 23 existing skipped, zero failed; 3,656 total |
| TypeScript | Passed |
| Production build under Node.js 22.23.4 | Passed, 17.84 seconds |
| Corrected test and live signature probes | HTTP 200 on both production domains |
| Wrong-mode signature probes | HTTP 400 |
| Primary-domain normal-browser health | HTTP 200, status `ok`, `runtimeVerified: true` |
| Credential/diff hygiene and real fixture isolation | Passed |

The real-credential validator is opt-in; its ordinary tests do not make external requests. Saved test and live API keys passed read-only intended-account/mode validation. The Node.js 22.23.4 deployment remains unchanged and verified; see [the runtime deployment record](node-runtime-security-update-2026-10-23.md).

A Python outbound health request received HTTP 403, while the independent normal-browser health check succeeded. That client-path response is not an unresolved application outage. Documentation-only maintenance does not require repeating the completed application test suite or redeploying the application.

## Separate verification limits — not reopened defects

These checks do not establish real-money purchase fulfillment, creator payout, inbox delivery, concurrent retry safety, exact replacement publishable-key equality, or use of the replacement API key by the default production Checkout client. They also do not prove retirement of the old live API key. The remaining security follow-up is explicitly separate in `todo.md`.

Do not mark those facts verified without evidence. Do not rotate or revoke further keys, replay unrelated events, change fees/URLs/event selections, create another purchase, or issue a refund automatically. A later real-money purchase requires its own authorization. The completed webhook/signing/sandbox work must not be reopened to answer that separate question.

## Sources

- [Stripe API keys and rotation](https://docs.stripe.com/keys)
- [Stripe guidance for potentially compromised API keys](https://support.stripe.com/questions/protecting-against-compromised-api-keys)
