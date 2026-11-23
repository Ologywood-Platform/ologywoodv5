# OlogyWood production-readiness follow-up — 2026-11-22

## Executive status

The application code and automated validation remain in a strong launch-candidate state, but this follow-up does **not** certify every provider-backed production gate. No live-money transaction, production migration-ledger mutation, Sentry integration, or destructive data operation was performed.

## Completed and verified

- **Redis-backed HTTP rate limiting:** The active Express middleware now uses the existing Redis-capable sliding-window limiter when `REDIS_URL` or `REDIS_HOST` is configured, with the existing in-process fallback when Redis is unavailable. Focused tests passed 40/40.
- **Automated validation:** The prior checkpoint passed the full test suite, TypeScript, production build, bundle budgets, Drizzle check, and `git diff --check`. The latest verified checkpoint is `b6613322`.
- **Heartbeat:** Five scheduled jobs are enabled and their current executions are succeeding: session reminders, premiere reminders, auto-complete bookings, credit expiration, and contract-expiry reminders. Historical failures remain in the logs, including older HTTP 500 session-reminder failures and HTTP 403 missing-cron-header failures for credit and contract reminders. They should remain on the operations watch list.
- **Sensitive-data inventory:** A fresh dry run found 0 Google Calendar rows, 1 legacy plaintext ordinary-signature row, and 4 legacy plaintext venue-contract-signature rows. No payload values were printed and no rows were changed.
- **SendGrid:** Exactly one authorized test message was sent to `garychisolm30@gmail.com`. SendGrid accepted it with HTTP 202 and provider message ID `xAB83ZKkSxyHwQ7BdCQT7Q`; the user confirmed that it arrived in the inbox. No additional test email was sent.
- **Stripe credential:** The dedicated `STRIPE_TEST_SECRET_KEY` is present, has the `sk_test_` prefix, and passed a read-only `/v1/account` request. No test payment or refund was created in this follow-up.
- **Google OAuth evidence:** The production workspace and settings pages loaded in an existing authenticated session, and the account settings displayed a Google profile avatar with “Using your Google profile picture.” A fresh OAuth attempt during this follow-up was not successful: the provider denied or did not return an authorization code and the token exchange timed out. The existing session evidence is retained, but the success-path callback is not certified.
- **Owner-confirmed provider workflows:** The owner reports that Google OAuth has been used successfully and that a purchase completed successfully. These are accepted as real-world functional evidence; the sandbox’s fresh OAuth attempt and the production endpoint’s live-mode Checkout behavior remain separately documented as non-certifying diagnostic results.

## Stripe tier-name audit and safe platform correction

The owner-provided Stripe Product Catalog screenshot showed legacy labels including Starter Tier, Professional Tier, Free Tier, and Starter Plan. The platform-side mismatch was corrected without relying on account-specific Stripe IDs. `server/config/stripePricing.ts` now derives names, amounts, and monthly/yearly lookup keys from `shared/products.ts` for Free, Starter, Professional, and Enterprise. `server/routers/pricing.ts` returns `stripePriceLookupKey` rather than stale `stripePriceId`. Active trial logic now emits `professional` rather than legacy `premium`, and subscription-upgrade email copy is plan-neutral.

## Stripe live reconciliation and staging payment/refund — completed

The authenticated Stripe **live account** was inspected read-only before mutation. It contained no active or trialing subscriptions. The live catalog was normalized to the six canonical paid prices:

- Starter: $9/month and $90/year on one active Starter Plan product.
- Professional: $29/month and $290/year on one active Professional Plan product.
- Enterprise: $79/month and $790/year on one active Enterprise Plan product.

The live changes preserved existing canonical prices, moved the Starter monthly lookup key onto the existing Starter Plan product, renamed Professional Tier to Professional Plan, created the missing Enterprise product and its two prices, and archived the duplicate Starter Tier and unused Free Tier products. Existing default prices on archived products could not be individually archived because Stripe protects a product’s default price; the products themselves are inactive and no active or trialing subscriptions were present. No live payment, refund, subscription, or payment mode was changed.

A staging/test-mode payment verification was completed using Stripe’s official test card path: a $2.00 PaymentIntent succeeded in test mode, a full $2.00 refund succeeded immediately, and the charge was verified as `paid=true`, `refunded=true`, `amount_refunded=200`, and `livemode=false`. The browser Checkout Session URL could not be completed because the browser connector altered Stripe’s required long client fragment; this did not create a charge. The successful PaymentIntent/refund validated test-mode authorization, capture, and refund settlement.

## Stripe catalog health check — implemented and scheduled

Added `server/services/stripeCatalogHealthService.ts`, deterministic regression coverage, and a cron-protected `/api/scheduled/stripe-catalog-health` endpoint. The check verifies all six canonical lookup keys, amounts, currencies, billing intervals, and active products in either live or test mode. It logs failures and sends a deduplicated SendGrid alert when `STRIPE_CATALOG_ALERT_EMAIL` is configured. The owner alert recipient is configured, and direct live and test health checks both passed with all six lookup keys present.

A recurring schedule named **Stripe catalog health check** is active for daily execution at 09:00 America/New_York. It is configured to inspect live mode, preserve mismatch details, and never modify Stripe automatically. The schedule is attached to the project and is currently in `ask_user` run mode; if fully unattended execution is required, the schedule must be switched to the project’s approved unattended/Heartbeat execution mode by an authorized operator.

Regression coverage verifies canonical tier names, amounts, lookup keys, absence of stale hard-coded IDs, health-check mismatch detection, and alert wiring. The latest focused validation passed 115 tests, TypeScript, production build, and `git diff --check`.

## Blocked or incomplete gates

### Signature re-encryption — completed

The configured `RIDER_DOCUMENT_ENCRYPTION_KEY` is present and has the expected 64-hex-character format; the code supports it as the documented fallback for `PRIVATE_DATA_ENCRYPTION_KEY`. AWS RDS inspection confirmed an active encrypted automated-backup stream for the production MySQL instance, with 35-day retention and a current restorable time. After explicit approval, the controlled procedure was run and verified:

1. The operator verified the encrypted RDS automated backup and recorded its backup reference.
2. During a controlled window, ran `ALLOW_PRIVATE_DATA_REENCRYPTION=1 pnpm exec tsx scripts/reencrypt-sensitive-data.ts --apply`.
3. The post-run read-only inventory found 0 legacy ordinary-signature rows and 0 legacy venue-contract-signature rows; focused encryption tests passed.

### OAuth success path — live session verified; fresh provider retry remains blocked at token exchange

Google and Spotify client configuration is present. The signed-in My Browser session successfully loaded the live OlogyWood Creator Workspace, confirming that an existing authenticated production session is valid. The Google callback now uses a consistent public origin: configured `BASE_URL` when present, otherwise the forwarded protocol/host. After publishing, a clean live test reached Google with the expected OlogyWood client and `https://www.ologywood.com/api/auth/google/callback`, but account selection returned `TOKEN_EXCHANGE_FAILED`. This isolates the remaining gate to the production Google token-exchange configuration (most likely the deployed client secret or an OAuth client/redirect pairing), not the route or callback-origin construction. No provider settings or credentials were changed here; the secret must be verified or rotated by an authorized operator in the deployment configuration and Google Cloud OAuth client.

### Migration ledger — controlled reconciliation required

The read-only production query found 147 ledger rows, compared with 129 local journal entries and 136 local SQL files. All 34 production SHA-256 hash-form rows map exactly to local SQL files by SHA-256 content. After normalizing those hash-form rows, 98 unique local migrations are represented in production and 38 newer local SQL files are not represented in the production ledger. Representative schema objects from recent local migrations already exist in production. Do **not** insert missing metadata rows or run `pnpm db:push` automatically. Reconciliation should be handled by the DBA/release owner by confirming whether the 38 newer migrations were applied manually or through another release path, then documenting the mapping before any metadata repair.

### Backups, monitoring, and capacity

The repository documents RDS automated backups, S3 durability, Manus checkpoints, and GitHub synchronization, but the AWS backup claims were not independently verified in this environment. The project does not use Sentry per the owner’s direction; no Sentry signup or integration is recommended. Production-load and provider-capacity evidence should be recorded separately from bounded smoke tests and automated unit/integration tests.

## Signature re-encryption — completed after AWS backup verification

Read-only AWS RDS inspection confirmed that the production MySQL instance `ologywood` is active, has encrypted automated backups, retains backups for 35 days, and had a latest restorable time of November 22, 2026 at 21:36 Eastern. The automated-backup ARN was captured in the operator record without exposing credentials or changing AWS settings.

After explicit owner approval, the controlled remediation ran with `ALLOW_PRIVATE_DATA_REENCRYPTION=1`. Exactly 1 ordinary signature row and 4 venue-contract signature rows were re-encrypted in place. A post-run dry run verified `signatureLegacyRows=0` and `venueContractSignatureLegacyRows=0`; no Google Calendar rows were present or changed. Focused encryption and Stripe monitoring tests passed 14/14, and `git diff --check` passed. No records were deleted.

## Recommendation

Treat OlogyWood as a **launch candidate for demos and controlled release**, but do not mark fresh Google OAuth as fully ready until the deployed Google token-exchange credential/configuration is corrected and retested. The backup-dependent signature re-encryption is complete and verified, and the live signed-in workspace is working. The catalog schedule is active daily at 09:00 Eastern but remains in `ask_user` mode; the available schedule controls do not expose an unattended-mode switch, and no fallback automation was created because that would require a separate approved design. The migration-ledger reconciliation remains a controlled release/DBA task rather than an automatic repair.
