# Automatic complimentary-access confirmations

## Requested behavior

After the verified platform owner confirms **Admin → Users → Manage complimentary access → Confirm grant** (or **Confirm replace**), OlogyWood automatically attempts the previously approved branded confirmation email. The owner no longer needs to ask for a separate send.

The template is unchanged: approved logo, actual granted plan, $0 subscription charge while the grant is active, expiry or no-expiry explanation, owner revocation boundary, unchanged transaction/Stripe/fan-purchase fees, account links and visible unsubscribe links. No internal grant reason is emailed.

## Implementation and safeguards

- The owner-only grant API waits for the grant and append-only audit transaction to finish successfully before invoking notification delivery. Failed grants, rejected permissions, inspection and revocation do not send grant confirmations.
- Notification targets the exact newly committed revision. Delivery rechecks that the account is still on that active revision, has no conflicting Stripe billing, and has a valid verified email address.
- Existing `frequency=never` and `unsubscribedAt` preferences are honored. Skipped opt-outs do not create a send reservation.
- Automatic delivery and the explicit manual backfill share one service and the existing `complimentary_access_r{revision}` email-log key. Already attempted revisions are not resent. A genuinely new grant revision can receive one new confirmation.
- The service locks the recipient user first (the same lock order as grant/revoke), inspects current state, checks prior attempts, and commits a send reservation before contacting SendGrid. Concurrent automatic/manual attempts cannot both reserve the same revision through these paths.
- Provider requests for this template have an eight-second abort timeout. Other email callers keep their existing behavior.
- Email errors never undo the granted access or turn a committed grant into a failed mutation. Admin success feedback distinguishes provider acceptance, preference skips, missing/unverified addresses and unconfirmed attempts.
- No user/role/access/billing/fee tables were changed for validation. No new database migration, scheduler or external automation is required. Help and deterministic AI guidance now explain automatic confirmations.

### Delivery limits

**Provider acceptance is not inbox delivery.** A timeout, process interruption after reservation, or failed audit update can leave a reserved/unconfirmed attempt. It is intentionally not retried blindly because the provider may already have accepted it. Review delivery evidence before an explicit retry. This implementation is a bounded post-grant notification, not a durable retry queue. A grant changed after the final reservation check cannot recall an already-submitted email.

## Verification

- **86 focused tests passed** across delivery, template, grant-router, grant-service, UI and guidance regressions.
- **3,071 full-platform tests passed; 23 skipped; zero failures.**
- TypeScript, production build and `git diff --check` passed. Changed-file credential/conflict-marker and temporary-validator checks passed.
- Fully intercepted browser tests at **1280 px** and **390 px** verified automatic-email disclosure in the review flow, accepted/opt-out/unconfirmed success messages, retained grant access after email uncertainty, replacement revisions and Cancel. All API operations were synthetic; no real grant was issued or changed.
- Shared sender behavioral tests verify transaction ordering, concurrent deduplication, legacy manual-log compatibility, stale/revoked/expired grants, billing conflict, preferences, provider failure and audit-update failure.

## Catch-up confirmations

The current-account dry run identified **one eligible unnotified grant revision**. Its confirmation was sent with the existing authorized template and accepted by the email provider. **Thirteen previously attempted revisions were skipped**, and the subsequent dry run found **zero eligible unsent confirmations**. No grant or billing record was changed by the catch-up. Inbox receipt is not independently verified.

## Publication

The automatic trigger is implemented and tested in the development code. Publish the feature checkpoint to enable it on the live platform. Until publication, the deployed grant route retains its earlier behavior. After publication, verify the visible automatic-email review note; a real new grant should be issued only when the owner intentionally chooses to give that account access. Existing older revisions are not automatically broadcast again on deployment.
