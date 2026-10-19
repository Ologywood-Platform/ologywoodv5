# Uploaded single descriptions and individual sharing

**Date:** October 19, 2026  
**Status:** Implemented and validated in development; production publication is pending.

## Artist workflow

Open **Music Releases**. **Edit Description** lets the actual creator profile owner add, revise, or clear up to 2,000 characters on an existing uploaded single, including after publication. Choose **Save Description** to apply it or **Cancel** to discard unsaved text. A published single stays live during this edit. The existing full **Edit** form remains available for draft-release changes.

Choose **Share** on a published single in Music Releases or on its public profile card. The panel provides Copy Link, Facebook, X, LinkedIn, WhatsApp, Email, Text, and Device Share. Instagram instructions explain using the copied link in a bio or Story link sticker. These actions open the user's sharing/composer tools; they never automatically publish a post or send a fan broadcast.

Every shared uploaded single has its own readable, collision-safe URL: `/music/<title>-<id>`. Its page uses the existing music card for public previews of up to 30 seconds, purchase pricing/checkout, and entitled downloads, plus a complete description and a creator-profile link. My Ology playback and purchases remain unchanged.

## Safety and compatibility

The description endpoints return only ID, description, and status. The server derives and rechecks actual profile ownership, excludes collaborator/legacy team-member profiles, and gives no administrator-only bypass. An administrator who actually owns a creator profile remains eligible. Description updates use one READ COMMITTED transaction with user/profile/membership/release locks and exact nullable-description compare-and-swap. Only the description column changes. Conflicts and uncertain failures retain the local draft; reloading the saved description requires confirmation before discarding dirty text. Double submissions and dismissal during a pending save are blocked.

The public single endpoint, social crawler page, and image route all require a currently published standalone creator release. Draft, archived, taken-down, foreign/private, and missing releases cannot gain public access from a signed-in owner/admin context. The public DTO never returns paid audio, raw media keys, private download URLs, owner identities, or emails. Source outages are retryable errors rather than false empty/not-found success.

Social previews use current title, creator, description, price, and that single's cover art. Real verification identified a blocked website storage path that initially caused branded fallbacks. The final image route uses a newly resolved trusted HTTPS storage/CDN URL, validates the exact cover key and image namespace, rejects arbitrary/private/credentialed URLs and redirects, bounds input bytes/pixels/time, and preserves artwork with 1200 × 630 JPEG containment. Eligibility is checked before the server image-cache lookup. Third-party social caches may still need recrawling after edits.

Existing fees, Stripe handlers, prices, media files, sales/purchase records, publication state, release ordering, plan limits, fan email consent, Schedule, and six-destination navigation were not changed. No schema migration was needed.

## Verification

- Expanded focused regressions: **330 passed, zero failed**.
- Exact full platform suite: **3,481 passed, zero failed, 23 existing skipped** (3,504 total).
- TypeScript passed; production build passed in **17.02 seconds**; diff and scoped credential/conflict/artifact hygiene passed.
- Fully intercepted browser workflows passed at **390 px and 1440 px**: source-read failure/retry; unchanged-save protection; retained conflicting draft; reload dismiss/accept; save/clear/Cancel; Copy Link/social/native sharing; old-slug canonical landing; description rendered as literal text; existing checkout payload; draft/archive sharing exclusion; public missing/outage retry; denied collaborator controls and no private editor requests; no page errors or horizontal overflow. No real API mutation was permitted.
- Actual development public music list returned **nine existing songs**. Two real individual single reads returned HTTP 200 with safe DTOs. Their uploaded artworks produced distinct HTTP 200 **1200 × 630 JPEGs**, not the platform fallback; one was visually inspected. Actual crawler metadata used the clean current-title canonical and single-cover endpoint without paid-media data; an unknown single returned generic HTTP 404. Anonymous description access returned HTTP 401.
- Mobile editor, share panel, and single page were visually reviewed. Temporary fixtures and screenshots are disposable and removed before checkpointing.

## Publication

Publish the validated checkpoint, then verify Edit Description and Share in the deployed Music Releases UI and recrawl a published single link if a social service still shows a cached preview. Authenticated production edits, real checkout/payment, real sharing submissions, and real record changes are **not claimed** by this validation.
