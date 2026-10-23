# Stripe test credentials update — October 23, 2026

## Current status

The owner supplied replacement `STRIPE_TEST_SECRET_KEY` and `STRIPE_TEST_WEBHOOK_SECRET` values through secure project forms. The dedicated API key passed read-only Stripe account and balance checks, matched the existing OlogyWood account, and returned test-mode metadata. The new signing secret passed local cryptographic verification and test/live mismatch rejection. Read-only Stripe metadata confirmed an enabled test destination using the existing webhook URL.

**The overall rotation is not yet complete.** The forms rejected updates to the protected built-in `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLISHABLE_KEY` settings; those attempts made no change. At the last alignment check, the default and dedicated API keys were both test keys but differed. The owner has the new publishable key and has been directed to Settings → Secrets to enter the protected values.

| Protected setting | Required value |
|---|---|
| `STRIPE_SECRET_KEY` | The same newly rotated test `sk_test_…` API key as `STRIPE_TEST_SECRET_KEY` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | The matching test `pk_test_…` publishable key from the same OlogyWood account |
| `STRIPE_WEBHOOK_SECRET` | The same new test `whsec_…` signing secret as `STRIPE_TEST_WEBHOOK_SECRET` |

The owner has not yet confirmed that all three protected settings are saved. Do not replace live credentials, switch to live payment mode, change the existing webhook URL, or revoke an old credential on the basis of this incomplete state. Old default credentials must not be described as fully retired until configuration alignment and deployed behavior are confirmed.

## Scope and boundaries

Only the two dedicated custom test secrets were successfully changed through the forms. No credential value was printed, written to source control, or included in test assertions. Live API credentials, live webhook secrets, fees, subscriptions, purchases, payouts, Stripe Connect routing, permissions, and application records were not changed.

The ordinary Stripe client uses the protected `STRIPE_SECRET_KEY`. Verified test webhook payment lookups prefer `STRIPE_TEST_SECRET_KEY`. The generic signing secret remains a candidate alongside mode-specific secrets, so it must also be aligned rather than left indefinitely with an old signing value. The browser publishable value is read at build time and must be included in the correct deployed build.

Validation used account, balance, and webhook destination GET requests plus local signature generation/verification. No checkout, payment, token, refund, payout, customer creation, actual event dispatch, webhook-setting update, or key revocation occurred. Local signing proves the app accepts the configured secret and rejects a mode mismatch; it does **not** prove the secret is the one Stripe uses for that destination. A Stripe-originated delivery is still needed for that proof.

## Validation

The explicit credential-and-signing validation passed **three tests**. Its real API branch runs only when `VALIDATE_STRIPE_TEST_CONFIGURATION=1`; webhook checks additionally require `VALIDATE_STRIPE_TEST_WEBHOOK=1`. Ordinary platform tests make no external requests or real-secret reads through the new test. After the owner confirms the protected settings, `REQUIRE_STRIPE_TEST_ALIGNMENT=1` verifies test formats and exact default/dedicated equality without printing values.

The exact final focused credential-selection and dual-mode webhook suite passed **14 tests**. The full platform suite passed **3,618 tests**, with **23 existing skipped tests** and **zero failures**. TypeScript, the production build, and scoped diff/credential hygiene passed under Node.js 22.23.4. The only new code is a gated validation test, not a payment-flow modification.

## Remaining work

Await the owner's Settings confirmation or a description of any non-editable field. Then validate the protected settings, save the resulting checkpoint, and publish/reload the project configuration through the supported interface. Check production health and a Stripe-originated test delivery without claiming a purchase or financial-record mutation that was not authorized. Deployed adoption of the rotated credentials and complete retirement of old credentials are not yet asserted.
