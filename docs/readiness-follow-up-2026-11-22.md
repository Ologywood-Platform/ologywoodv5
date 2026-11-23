# OlogyWood production-readiness follow-up — 2026-11-22

## Executive status

The application code and automated validation remain in a strong launch-candidate state, but this follow-up does **not** certify every provider-backed production gate. No live-money transaction, production migration-ledger mutation, Sentry integration, or destructive data operation was performed.

## Completed and verified

- **Redis-backed HTTP rate limiting:** The active Express middleware now uses the existing Redis-capable sliding-window limiter when `REDIS_URL` or `REDIS_HOST` is configured, with the existing in-process fallback when Redis is unavailable. Focused tests passed 40/40.
- **Automated validation:** The prior checkpoint passed the full test suite, TypeScript, production build, bundle budgets, Drizzle check, and `git diff --check`. The latest verified checkpoint is `b6613322`.
- **Heartbeat:** Five scheduled jobs are enabled and their current executions are succeeding: session reminders, premiere reminders, auto-complete bookings, credit expiration, and contract-expiry reminders. Historical failures remain in the logs, including older HTTP 500 session-reminder failures and HTTP 403 missing-cron-header failures for credit and contract reminders. They should remain on the operations watch list.
- **Sensitive-data inventory:** A fresh dry run found 0 Google Calendar rows, 1 legacy plaintext ordinary-signature row, and 4 legacy plaintext venue-contract-signature rows. No payload values were printed and no rows were changed.
- **SendGrid:** Exactly one authorized test message was sent to `garychisolm30@gmail.com`. SendGrid accepted it with HTTP 202 and provider message ID `xAB83ZKkSxyHwQ7BdCQT7Q`; the user confirmed that it arrived in the inbox. No additional test email was sent.
- **Stripe credential:** The dedicated `STRIPE_TEST_SECRET_KEY` is present, has the `sk_test_` prefix, and passed a read-only `/v1/account` request. No payment or refund was created in this follow-up.
- **Google OAuth evidence:** The production workspace and settings pages loaded in an existing authenticated session, and the account settings displayed a Google profile avatar with “Using your Google profile picture.” A fresh OAuth attempt during this follow-up was not successful: the provider denied or did not return an authorization code and the token exchange timed out. The existing session evidence is retained, but the success-path callback is not certified.

## Blocked or incomplete gates

### Signature re-encryption — blocked pending backup confirmation

The configured `RIDER_DOCUMENT_ENCRYPTION_KEY` is present and has the expected 64-hex-character format; the code supports it as the documented fallback for `PRIVATE_DATA_ENCRYPTION_KEY`. However, the sandbox has no AWS CLI or independently verified RDS snapshot/backup evidence. Because re-encryption changes five production rows, apply mode was intentionally **not** run. The required controlled procedure remains:

1. DBA/operator verifies a current restorable database backup or snapshot.
2. Operator records the backup identifier and confirms the encryption key is retained securely.
3. During a controlled window, run `ALLOW_PRIVATE_DATA_REENCRYPTION=1 pnpm exec tsx scripts/reencrypt-sensitive-data.ts --apply`.
4. Re-run the read-only inventory and focused encryption tests.

### Stripe purchase/refund — blocked by approved amount below product minimum

Test mode was verified, but an application-backed Checkout purchase was not executed because the authorized amount was `$0.50` and the Holiday release enforces a `$2.00` minimum. The guest flow was verified far enough to confirm that the public single page shows the guest email field, “No account required” guidance, the Name Your Price control, and the minimum-price validation. The owner account correctly hides purchase controls on its own release; signing out of the isolated browser exposed the guest control. No payment or refund was created. To finish this gate, either authorize a purchase at or above the displayed `$2.00` minimum or create/use a dedicated test item whose minimum is `$0.50`, then verify application records and issue the immediate full refund. Live mode must remain untouched.

### OAuth success path — fresh attempt failed; existing session evidence only

Google and Spotify client configuration is present. The sandbox browser reached an authenticated production workspace and settings page, and the settings page showed a Google profile avatar and “Using your Google profile picture.” However, the fresh Google OAuth attempt logged provider denial/no authorization code and a token-exchange timeout. A final success claim requires retrying from the owner’s existing logged-in browser or after confirming the provider consent/redirect configuration; no provider settings were changed here.

### Migration ledger — controlled reconciliation required

Production has 23 ledger rows versus 129 local journal entries and 136 SQL files, including custom/out-of-order identities such as `0046_certain_mockingbird`. Representative schema objects from recent local migrations already exist in production. Do **not** insert missing metadata rows automatically. Reconciliation should be handled by the DBA/release owner using migration-file hashes, schema inspection, deployment history, and an explicit mapping of custom production entries.

### Backups, monitoring, and capacity

The repository documents RDS automated backups, S3 durability, Manus checkpoints, and GitHub synchronization, but the AWS backup claims were not independently verified in this environment. The project does not use Sentry per the owner’s direction; no Sentry signup or integration is recommended. Production-load and provider-capacity evidence should be recorded separately from bounded smoke tests and automated unit/integration tests.

## Recommendation

Treat OlogyWood as a **launch candidate for demos and controlled release**, not as having every final operational gate independently proven. Before broad public launch, complete: (1) verified backup followed by signature re-encryption, (2) authorize a test purchase at or above the product’s `$2.00` minimum and complete the Stripe refund verification, and (3) retry one Google or Spotify OAuth flow until the callback and resulting integration state are observed. Separately retain the migration-ledger reconciliation as a controlled release/DBA task rather than an automatic repair.
