# Music visibility and hosted-content purchases

**Date:** October 9, 2026  
**Status:** Implemented and validated in development; publication and live verification pending.

## Findings

- Adonis's original **Keep Pushin test release** remains published, with two recorded sales. It was not deleted. Its public listing failed because the optional Music Release disclosure schema guard used `ADD COLUMN IF NOT EXISTS`, which the active MySQL/TiDB-compatible runtime does not support.
- The externally hosted **Try Again 2** is published as a Single with Pay What You Want and a **$1.50 minimum**. Its public controls previously used `price` instead of `minPrice`, making the purchase action misleading.
- The hosted-content purchase endpoint previously wrote a purchase entitlement directly rather than starting and verifying a Stripe payment. It has been replaced with actual Checkout and webhook-backed fulfillment.
- Professional and Enterprise release limits remain unlimited. The owner's local subscription record is Enterprise with status cancelled and an expired period end, while tier-based UI reflects Enterprise benefits. No subscription, Stripe billing record, or user permissions were changed. Reconciliation is a separate task and must not be treated as confirmation of an active paid subscription.

## Implementation

### Original uploaded music

The optional schema guard now inspects existing columns and adds only missing declared disclosure columns using compatible syntax. It deduplicates concurrent checks, isolates readiness by database object, and retries failed checks. No song, purchase, media file, or download allowance is rewritten.

The public profile shows Music loading/error/retry states instead of silently omitting the section after a query failure. Existing previews, Name Your Price, Music purchases, stream/download separation and five-download enforcement remain in their existing system.

### Hosted-content purchases

- Clear fixed-price and Pay What You Want labels and amount fields, using server-authoritative prices and the proper minimum.
- Owner previews are distinguished from fan purchase controls.
- Signed-out fans use the existing in-place login modal rather than a nonexistent login page.
- Positive-price purchases start authenticated Stripe Checkout and do **not** create access before payment.
- Checkout requires creator payment readiness, uses the existing **1% hosted-content platform fee**, separate processing and a connected-account destination; other fees are unchanged.
- Verified `checkout.session.completed` and `payment_intent.succeeded` events use a distinct hosted-content metadata namespace, separate from downloadable Music Releases.
- Fulfillment validates amount, currency, identity metadata, PaymentIntent presence, mode and current Stripe payment state. A full refund preceding a delayed success cannot grant access.
- Transactional creator row locking and the existing unique purchaser/release constraint prevent duplicate entitlements, counters and emails from ordinary retries.
- Zero-price claims are allowed only for published zero-minimum releases. Paid records cannot be granted without verified payment proof.
- Public listing responses redact protected hosting URLs. Owner previews and authenticated access checks return them only when authorized.
- Full refunds mark receipts refunded without deleting them, and stale success retries cannot reopen the same refunded PaymentIntent.
- Hosted purchases are included in My Ology counts and shown in a separate purchaser panel alongside existing music downloads; the deduplicated playable Music library is not replaced.
- Profile Buy navigation now reaches uploaded music first, then hosted releases, with merchandise as fallback.
- Updated Help and deterministic AI assistance explain buying, owner preview and unlimited-tier rules.

### Additive database change

Reviewed migration `0113_boring_gunslinger.sql` adds only `paymentStatus` to `content_release_purchases`, defaulting existing rows to completed. The corresponding schema guard inspects and repairs this one column when runtime parity is missing. No release/purchase/payment/user data was deleted or rewritten for validation.

## Validation

- **2,889 passing platform tests; 23 skipped; no failures** on the complete implementation.
- **53 focused tests** across commerce, Stripe webhook, Music Release schema, release save and AI navigation; includes **14 behavioral hosted-commerce tests**.
- TypeScript and production build passed; build retains its pre-existing large-chunk warnings.
- Actual development profile renders the original song with two sales and Try Again 2 with its $1.50 minimum, while the public paid-content URL is redacted.
- Isolated desktop (1280px) and mobile (390px) browser tests intercept all API requests: original music visibility, minimum amount, below-minimum blocking, retained amount after an error, retry to mocked Checkout, and in-place login modal all passed. No real fan login, checkout, payment or entitlement was created.
- Final read-only database audit confirmed both real releases remain published and the owner's existing subscription status is unchanged. Disposable audit scripts were removed.
- Diff whitespace checks and changed-file conflict-marker/credential/artifact review passed.

## Required production closeout

Publish the checkpoint, then verify the original song, hosted price, cover-art controls, purchaser login and Help on the live site. Do not represent mocked Checkout as a completed live payment. A controlled Stripe test-mode end-to-end purchase/refund requires a separately scoped test transaction and should not modify real creator releases or customer receipts.

External hosting remains external: OlogyWood protects its own access handoff, but a public or shared YouTube URL cannot be made private or DRM-protected by this paywall.
