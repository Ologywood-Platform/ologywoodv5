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

### OAuth success path — token exchange fixed; clean-browser session persistence still needs owner-browser confirmation

Google and Spotify client configuration is present. The signed-in My Browser session successfully loaded the live OlogyWood Creator Workspace, confirming that an existing authenticated production session is valid. The Google callback uses a consistent public origin: configured `BASE_URL` when present, otherwise the forwarded protocol/host. The newly regenerated Google client secret was securely installed; a non-destructive token-endpoint test returned the expected `invalid_grant` for a fake code, proving the client credentials were accepted without creating a session. A subsequent clean live OAuth flow passed Google device verification and returned to OlogyWood without `TOKEN_EXCHANGE_FAILED`. OAuth callbacks now explicitly use `SameSite=None; Secure` on HTTPS while ordinary first-party cookies remain `SameSite=Lax`; 42 focused OAuth/cookie/session tests, TypeScript, and diff checks pass. The owner then confirmed in the normal browser that Google sign-in succeeded and the session remained active in Workspace. The OAuth gate is complete.

### Migration ledger — controlled reconciliation required

The read-only production query found 147 ledger rows, compared with 129 local journal entries and 136 local SQL files. All 34 production SHA-256 hash-form rows map exactly to local SQL files by SHA-256 content; the remaining production rows map by their ledger filename form. After normalization, all 147 production rows map to local files, 98 unique local migrations are represented, and 38 local SQL files are not represented in the production ledger. The detailed non-mutating mapping is saved in `docs/migration-ledger-reconciliation-2026-11-23.md`. Representative schema objects from recent local migrations already exist in production. Do **not** insert missing metadata rows or run `pnpm db:push` automatically. Reconciliation remains a DBA/release-owner task: confirm whether the 38 files were applied manually or through another release path, then document that mapping before any metadata repair.

### Backups, monitoring, and capacity

The repository documents RDS automated backups, S3 durability, Manus checkpoints, and GitHub synchronization, but the AWS backup claims were not independently verified in this environment. The project does not use Sentry per the owner’s direction; no Sentry signup or integration is recommended. Production-load and provider-capacity evidence should be recorded separately from bounded smoke tests and automated unit/integration tests.

## Signature re-encryption — completed after AWS backup verification

Read-only AWS RDS inspection confirmed that the production MySQL instance `ologywood` is active, has encrypted automated backups, retains backups for 35 days, and had a latest restorable time of November 22, 2026 at 21:36 Eastern. The automated-backup ARN was captured in the operator record without exposing credentials or changing AWS settings.

After explicit owner approval, the controlled remediation ran with `ALLOW_PRIVATE_DATA_REENCRYPTION=1`. Exactly 1 ordinary signature row and 4 venue-contract signature rows were re-encrypted in place. A post-run dry run verified `signatureLegacyRows=0` and `venueContractSignatureLegacyRows=0`; no Google Calendar rows were present or changed. Focused encryption and Stripe monitoring tests passed 14/14, and `git diff --check` passed. No records were deleted.

## Recommendation

Treat OlogyWood as a **launch candidate for demos and controlled release**, with Google OAuth token exchange and session persistence confirmed in the owner’s normal browser. The backup-dependent signature re-encryption is complete and verified, and the live signed-in workspace is working. The catalog schedule is active daily at 09:00 Eastern but remains in `ask_user` mode; `manus-config schedule update --help` exposes no unattended-mode switch, so it was intentionally left unchanged and no fallback automation was created. A mobile smoke capture at 390×844 rendered the homepage, workspace, bookings, pricing, shop, and events routes; the riders capture tool reported a capture failure, while direct route inspection returned the Riders & Contracts content and the responsive shell, so this is recorded as a tooling limitation rather than a confirmed application defect. The migration-ledger reconciliation remains a controlled release/DBA task rather than an automatic repair.


## Published mobile Rider verification — 2026-11-23

The corrected Rider Builder was published, and the owner confirmed that the mobile editor now looks correct in production. The Hospitality checklist no longer renders duplicated navigation headers inside checkbox rows, and the checklist content fits within the mobile card without the previously observed horizontal clipping. The code-level regression test, TypeScript check, and diff check passed before publication. No additional production data, migration, payment, schedule, or provider changes were made.

The remaining controlled-release items are unchanged: DBA-owned migration-ledger reconciliation, independent production capacity/load evidence, and confirmation or documented limitations for any provider-side monitoring configuration. The Stripe catalog schedule remains active in `ask_user` mode because the available schedule controls expose no unattended-mode switch; it was intentionally not changed.


## Post-publication validation — 2026-11-23

After the published mobile Rider confirmation, the complete automated suite passed: 373 test files passed, 2 were skipped, with 4,455 tests passed and 26 skipped. TypeScript noEmit, the production Vite/server build, bundle-budget checks, `pnpm drizzle-kit check`, and `git diff --check` also passed. The build still emits advisory size warnings for the known application shell and PDF vendor chunk; the enforced bundle budgets remain within limits. No production data, migrations, payments, schedules, or provider configuration changed during this validation.


## Bounded capacity and bundle decision — 2026-11-23

A read-only health-only capacity probe is documented in `docs/capacity-and-bundle-audit-2026-11-23.md`. The local server returned 60/60 successes with a 198.52 ms p95. A smaller 20-request/5-worker burst returned 20/20 on both deployed hostnames; the custom domain was materially slower than the Manus hostname in this sample, and a larger custom-domain burst produced 403 responses consistent with edge/WAF burst protection. This is a follow-up for normal regional monitoring, not a confirmed application defect.

The JavaScript chunk audit found route lazy loading and dynamic PDF imports already in place. Enforced budgets pass, including a 577,664-byte application shell against a 600,000-byte limit. The approximately 983 KB PDF vendor chunk is on-demand. No broad manual-chunk rewrite was approved because it would carry regression risk without evidence of a launch-blocking initial-load problem. Future optimization should target measured application-shell/dashboard dependencies after real-user Web Vitals or route traces are available.


## Stripe PaymentIntent return URL warning — 2026-11-23

The Stripe test warning was audited against every PaymentIntent confirmation and creation path in the repository. The browser tip flow already supplied `return_url: window.location.href` with `redirect: 'if_required'`. Three server-created PaymentIntent paths—booking deposits, promotion service fees, and tips—were updated to use a shared `automatic_payment_methods` policy with `allow_redirects: 'never'`. This prevents a server-created intent from advertising redirect-capable methods when a confirmation surface does not provide a return URL. No SetupIntent paths or server-side implicit confirmations were found.

Added `server/services/stripePaymentIntentConfig.ts` and regression coverage in `server/stripePaymentIntentRedirects.test.ts`. Focused Stripe/payment validation passed 19/19. The complete suite then passed 374 test files, 4,460 tests, and 26 skipped. TypeScript, production build, bundle budgets, Drizzle check, and `git diff --check` all passed. This fix is checkpointed but not published; no live or test payment, customer data, migration, or provider setting was changed.
