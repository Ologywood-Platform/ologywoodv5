# OlogyWood API Endpoint Audit

**Date:** 2026-11-08  
**Scope:** Read-only source audit of the active Express runtime and mounted route modules. No application records, OAuth integrations, payments, or external settings were changed.

## Executive summary

The active runtime is `server/_core/index.ts`. It mounts the Stripe webhook before JSON parsing, bounded media-upload parsers, event CRUD/search, release upload/download/checkout, booking checkout, contract PDFs, video uploads, eBook files, rider PDFs, calendar feeds/sync, OAuth, OG endpoints, rate-limited tRPC, and scheduled handlers.

The audit confirmed strong protections in several sensitive areas: Stripe signature ordering, authenticated eBook/rider delivery, owner-bound signed video-upload sessions, strict positive-ID parsers on recently hardened legacy routes, generic error responses on the audited endpoints, and private/no-store rider PDFs. The critical follow-ups—OAuth state/redirect integrity, release-checkout input/origin handling, legacy event validation/ownership, test-email authorization/validation/rate limiting, legacy video duration/extension handling, release-preview MIME/data-URL normalization, release-download preview ID parsing, and identified sensitive-log redaction—have now been hardened and regression-tested. Remaining findings include the unmounted legacy test module's cleanup review, the local-only nature of the current in-memory email limiter, and broader endpoint coverage items listed below.

## Verified protections

- `server/routes/bookFiles.ts`: positive integer item/access IDs, authenticated upload/download, owner/email entitlement checks, rights confirmation, MIME/size limits, private storage keys, bounded download counts, and client-safe errors.
- `server/routes/releaseDownload.ts`: authenticated ownership checks for purchased downloads, strict purchase IDs, published-only public previews, generic provider errors, and the shared positive route-ID parser on both download and preview paths.
- `server/routes/riderDocuments.ts`: authenticated access, strict version/booking IDs, owner or booking-party authorization, transaction/rollback handling, encrypted document retrieval, no storage URL exposure, private no-store headers, safe content-disposition handling, and generic errors.
- `server/routes/mediaUploads.ts`: authentication occurs before raw-body allocation; metadata, content type, content length, chunk size, and chunk index are bounded; service errors are mapped to stable client-safe codes.
- `server/routes/videoUpload.ts`: owner/profile and plan checks, signed owner-bound upload sessions for direct uploads, bounded chunk sizes, source-format validation, conversion validation, and client-safe validation errors. The legacy `/upload` path has a separate duration-validation gap noted below.
- `server/routes/calendarFeed.ts` and the route-input helpers: calendar-feed token handling and recently hardened positive-ID boundaries are present.
- `server/_core/index.ts`: Stripe raw-body handling is registered before JSON middleware; the actual runtime installs HTTPS redirect and security headers before application routes; global error/not-found handlers are last.

## Findings requiring follow-up

### High priority

1. **OAuth state and redirect integrity — resolved in this increment.**
   - Files: `server/services/oauthState.ts`, `server/routes/googleAuth.ts`, `server/routes/spotifyAuth.ts`, and `server/routes/googleCalendarSync.ts`.
   - Google and Spotify now use a short-lived HMAC-signed state envelope with version/issued-at checks and safe same-origin relative return paths. Calendar Sync signs the initiating user ID and requires the callback session to match it. Provider error text is mapped to fixed client-safe codes, and Google token/userinfo requests have bounded timeouts.
   - Regression coverage: signed round-trip, tamper rejection, expiry, path normalization, route wiring, fixed error codes, and TypeScript/build validation all pass; no OAuth flow was completed during validation.

2. **Legacy event routes — resolved in this increment.**
   - Files: `server/routes/events.ts`, `server/routes/eventInput.ts`, and `server/db.ts`.
   - Create/update/history/recurrence/photo bodies now use explicit validators for allowlisted fields, lengths, dates/times, rates, capacities, references, recurrence values, and HTTP(S) photo URLs. Event updates no longer spread arbitrary request fields. Photo add/delete requires the authenticated artist who owns the event history; deletion performs a read-only photo/history ownership lookup before mutation.
   - Regression coverage: 17 event-route/schema/calendar/search tests pass, plus TypeScript and production build validation. No event, history, photo, or user record was created or modified during validation.

3. **Release checkout input/origin boundary — resolved in this increment.**
   - File: `server/routes/releaseCheckout.ts`.
   - `releaseId` now uses the shared strict positive-ID parser. Supplied custom amounts must be positive safe integers, at least the release base price and Stripe's $0.50 minimum, and no more than $100,000; custom pricing is rejected when the release does not allow it. Success/cancel URLs use a configured `BASE_URL`, or a strict allowlist of Ologywood, localhost, and Manus preview origins.
   - Regression coverage: four release-checkout security tests pass, plus TypeScript and production build validation. No checkout session or charge was created.

### Medium priority

4. **Payment-testing module — unreachable from active runtime; mount guard added.**
   - File: `server/routes/paymentTestingRoutes.ts` and `server/services/paymentTestingService.ts`.
   - The routes remain legacy test code and are not mounted by the active `server/_core/index.ts`, so they are not presently reachable. `server/routeMountInventory.test.ts` now asserts the module and `/api/payment-test` mount are absent while intended media/email/Stripe mounts remain present. No deletion or payment-state mutation occurred; legacy entrypoints/tests still require separate cleanup review.

5. **Email-test endpoint — authorization, validation, and local rate limiting resolved.**
   - File: `server/routes/emailRoutes.ts`.
   - `POST /api/email/test` now requires an authenticated admin, trims/lowercases the address, enforces a 320-character maximum and strict email shape, applies the existing sliding-window limiter by client IP and normalized recipient, returns `429` with `Retry-After`, and leaves the public unsubscribe router independent. Focused email/mount/event/input tests pass 11/11; no email was sent.
   - Remaining follow-up: replace the process-local limiter with a shared store if this endpoint is deployed across multiple application instances.

6. **Legacy video upload — duration and extension validation resolved.**
   - File: `server/routes/videoUpload.ts`, legacy `POST /upload`.
   - Duration is now converted with `Number`, rejected when non-finite/negative/over 300 seconds, and explicitly treats omitted/empty duration as zero for backward compatibility. Storage extension is selected from the validated MIME allowlist (`mp4`, `mov`, `webm`) rather than the client filename. Focused video/email/event tests pass 9/9 and TypeScript validation passes.

### Low priority / consistency

7. **Public release preview route-ID parser — resolved in this increment.**
   - File: `server/routes/releaseDownload.ts`, `/preview/:releaseId`.
   - The local `Number`/`Number.isInteger` guard now uses `positiveRouteId`, preventing parser drift. `server/releaseDownloadInput.test.ts`, route-input tests, and release-preview API tests pass; no download or payment was created.

8. **Release-preview MIME/data-URL parser — resolved in this increment.**
   - File: `server/services/releasePreviewMedia.ts`.
   - Data URLs now require supported canonical or aliased audio/video MIME types, declared MIME must agree with the route MIME when both are supplied, raw base64 remains supported for compatibility, and malformed/non-canonical data fails before FFmpeg. Release-preview API/media tests pass 30/30 and TypeScript validation passes.

9. **Google OAuth timeout — resolved in this increment.**
   - File: `server/routes/googleAuth.ts`.
   - Google token/userinfo fetches now use bounded timeouts and fixed provider-error mapping, aligned with the Spotify route. Covered by the OAuth regression suite; no provider flow was completed.

10. **Sensitive identifiers in the identified OAuth/PDF paths — resolved in this increment.**
   - Google/Spotify no longer log provider email, provider IDs, response bodies, session-linked open IDs, or redirect targets; Contract PDF no longer logs booking/profile/contract IDs, filenames, raw exception messages, or stacks. Focused `sensitiveLogSafety`/OAuth/private-data tests pass 17/17. A broader inventory of non-sensitive operational IDs and production log-retention policy remains outside this route-focused audit.

11. **Booking rider and message boundaries — resolved in this increment.**
   - Booking deposit, rider, unread-message, and message/send-rider inputs now require finite positive integer IDs/amounts with bounded payment-intent identifiers. Booking riders are party-scoped, and message/send-rider recipients are resolved from the booking's participant profile IDs rather than the sender's profile, preventing cross-booking recipient confusion for artists and venues.
   - Runtime booking/message integration, authorization, notification, and input-boundary tests pass 25/25; TypeScript validation passes. No booking, message, notification, payment, or rider record was created or modified during validation.

12. **Rider-contract private reads and signing inputs — resolved in this increment.**
   - Rider-contract booking, contract, and revision identifiers now require positive integers; performance fees, signature payloads, signer names, revision labels/field counts, and rejection reasons are bounded. Rider previews and contract verification now require the authenticated booking artist/venue or an admin before returning rendered content or signatures.
   - Rider-contract and NIL readiness regressions pass 33/33, and the combined booking/message regression suite passes 25/25. TypeScript and production build validation pass; no contracts, signatures, riders, payments, or notifications were changed.

13. **Dispute ownership and evidence boundaries — resolved in this increment.**
   - Dispute creation and booking-existence checks now require an actual artist/venue party to the booking. Dispute/status/ID inputs, evidence URL lists, base64 evidence payloads, MIME types, filenames, resolution text, and admin notes are bounded; evidence storage extensions derive from validated MIME and mismatched data-URL MIME is rejected.
   - Dispute/admin/critical-gap regressions pass 35/35, with rider-contract regressions 19/19; TypeScript and production build validation pass. No disputes, evidence, emails, payments, or records were changed.

14. **Music-release lifecycle and paid-content fallback — resolved in this increment.**
   - Release lifecycle, review, library, stream, and purchase identifiers now require safe positive integers; release media keys, duration, file size, price, currency, descriptions, and review/session fields are bounded and strict. The Stripe fallback verifier now requires a paid payment-mode session with a payment intent, signed-in buyer ownership, a published release, matching release/artist metadata, supported currency, and an amount consistent with the release price/PWYW rule before creating a purchase.
   - Release/public-media/commerce/description/library regressions pass 57/57, with TypeScript and production build validation passing. No purchases, downloads, Stripe sessions, emails, or records were changed.

15. **Creator Shop and merch-order boundaries — resolved in this increment.**
   - Merch item mutations now scope ownership by both user ID and active seller type. Reorder lists reject duplicates, are bounded, and are prechecked against owned items. Image uploads require bounded base64, allowlisted MIME, matching data-URL MIME when present, and MIME-derived storage extensions. Checkout/session/variant/address/order fields are strict and bounded, and fulfillment IDs are safe positive integers.
   - Merch/book/schema/security regressions pass 29/29, with TypeScript and production build validation passing. No merch items, orders, image uploads, Stripe sessions, emails, or records were changed.

16. **Ticketing checkout and transfer boundaries — resolved in this increment.**
   - Ticket tier, purchase, promo, ticket-code, and transfer inputs are bounded and strict. Buyer email is required before ticket-order creation, Stripe return URLs use the approved checkout-origin helper rather than the request `Origin`, transfer-history reads require ownership of the underlying ticket, and public transfer lookups return only acceptance-page fields. UUID/session/order formats are validated.
   - Ticketing/security/mobile regressions pass 60/60, with TypeScript and production build validation passing. No tickets, orders, promo codes, transfers, emails, Stripe sessions, or records were changed.

17. **Fan Club access and subscription boundaries — resolved in this increment.**
   - Members-only feed access no longer falls through to unauthenticated viewers. Selected minimum tiers are persisted and enforced by tier price; post likes/comments require access to the post and parent comments must belong to the same post. Tier, membership, post, like, comment, and subscription inputs are strict and bounded; self-subscription and missing Stripe price IDs are rejected; connected payout routing requires charges and payouts enabled.
   - Fan Club/security/commerce/owner-access regressions pass 34/34, with TypeScript and production build validation passing. No memberships, posts, comments, likes, Stripe sessions, emails, or records were changed.

18. **Ology Live paid-session boundaries — resolved in this increment.**
   - Experience pricing is cents-safe; descriptions, tags, URLs, recurring schedules, notes, reasons, and join links are bounded and validated. Management, slot, booking, and browse IDs/pagination are safe integers with strict status/capacity values. Paused experiences are excluded from public detail reads, while checkout remains tied to the locked reservation participants and self-booking is rejected.
   - Ology Live security/checkout/lock/schedule/phase regressions pass 227/227, with TypeScript and production build validation passing. No experiences, slots, bookings, payments, Stripe sessions, or records were changed.

19. **Managed promotion boundaries — resolved in this increment.**
   - AI/budget fields, campaign budgets, goals/audience/notes/timelines, platform selections, admin status/report inputs, and edit IDs are bounded and strict. Optional event/release/profile targets are safe integers and, when supplied, are resolved to the submitting artist before a Stripe PaymentIntent is created. The promotion client state now matches the server’s platform enum.
   - Promotion/admin/Stripe credential regressions pass 45/45, with TypeScript and production build validation passing. No promotion requests, PaymentIntents, emails, or records were changed.

20. **Artist sponsor and media-kit boundaries — resolved in this increment.**
   - Public/profile IDs, sponsor IDs/order/date/text fields, HTTPS logo/site URLs, analytics windows, media-kit metrics/contacts/URLs, and nested social-stat objects are bounded and strict. Public analytics now resolve profile identifiers and verify that an active sponsor slot belongs to the claimed artist before writing an impression/click. The event-page client field mismatch was corrected.
   - Sponsor/security/ecosystem/sitemap regressions pass 62/62, with TypeScript and production build validation passing. No sponsors, analytics, media kits, emails, or records were changed.

21. **Venue sponsorship packages and applications — resolved in this increment.**
   - Package/application/sponsor/message/public IDs are safe integers; price strings are positive USD values with at most two decimals; package capacity cannot be lowered below active sponsors; package/application text and HTTPS URLs are bounded; application date windows are validated; approval package lookup is venue-scoped; browse pagination is bounded; message reads/sends remain applicant/venue-party scoped; and sponsor-dashboard venue joins use stored venue user IDs.
   - Venue sponsorship/security/schema/enhancement/admin regressions pass 26/26, with TypeScript and production build validation passing. No packages, applications, sponsors, messages, emails, payments, or records were changed.

22. **Stripe tip boundaries — resolved in this increment.**
   - Artist profile IDs and tip amounts require safe integers; payer name/message fields are bounded and strict; both public eligibility and PaymentIntent creation require active Connect accounts with charges and payouts enabled; and operational logs no longer expose connected-account or PaymentIntent identifiers.
   - Tip/Stripe credential/Tip QR/link regressions pass 42/42, with TypeScript and production build validation passing. No PaymentIntents, charges, transfers, tips, emails, or records were changed.

23. **Follow/social graph and fan-email list boundaries — resolved in this increment.**
   - Follow targets, public stats, mutual counts, and consent IDs require safe user IDs; follow/list/recommendation objects are strict; personal and fan-email pagination is capped with bounded offsets; recommendations/suggestions have finite limits; and consent revisions are bounded while paid-tier creator/CSV protections remain intact.
   - Follow/fan-email/suggestion regressions pass 101/101, with TypeScript and production build validation passing. No follows, consent records, emails, exports, or records were changed.

## Audit limitations

This was a source and runtime-configuration audit, not a production penetration test. It did not submit OAuth callbacks, send email, create payments/refunds, mutate events, or run destructive cleanup. The open findings above should be fixed with focused tests and then verified on the preview before publication.
