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

24. **Legacy rider-template boundaries — resolved in this increment.**
   - Template IDs/types/names require safe bounded formats; template-data keys, top-level count, and serialized size are capped; all template inputs are strict; athlete templates retain owner gating; and user-controlled legacy rider values are HTML-escaped before preview generation.
   - Rider/template/athlete/contract regressions pass 74/74, with TypeScript and production build validation passing. No rider templates, previews, exports, records, or emails were changed.

25. **Touring availability and discovery boundaries — resolved in this increment.**
   - Profile IDs are safe integers; date windows require parseable dates with end-after-start validation; regions, tour types, windows, and notes are bounded; discovery filters are trimmed and capped; and batch touring-status requests are limited to 100 unique IDs.
   - Touring/search/portfolio regressions pass 64/64, with TypeScript and production build validation passing. No touring records, emails, or records were changed.

26. **Artist fan-update boundaries — resolved in this increment.**
   - Send payloads remain trimmed and bounded with strict objects; history limit/offset values require integers with a capped offset; and the consent-gated email renderer escapes subject, body, name, and link values before delivery.
   - Artist-update/fan-email/consent regressions pass 99/99, with TypeScript and production build validation passing. No broadcasts, emails, fan records, or records were changed.

27. **Blog publishing and cover-upload boundaries — resolved in this increment.**
   - Post IDs and public/admin pagination are safe bounded integers; slugs, title/excerpt/content/tags/status objects are strict and bounded; cover URLs are HTTP(S)-only; cover uploads validate allowlisted MIME/data URLs/base64/decoded size and derive extensions from MIME; and both blog-admin clients narrow browser MIME strings and upload new-post covers only after the server returns the post ID.
   - Blog/content/security regressions pass 95/95, with TypeScript and production build validation passing. No posts, cover uploads, emails, or records were changed.

28. **Venue profile, inquiry, media, and availability boundaries — resolved in this increment.**
   - Venue search/profile IDs and pagination/capacity filters are safe and bounded; profile fields, amenities, and operating hours are strict; profile/gallery images validate MIME/data/base64/decoded size with MIME-derived extensions; gallery photo IDs/captions/reorders are bounded and duplicate-safe; inquiry/date/calendar inputs are strict; public calendar imports reject common private hosts; inquiry email fields are escaped; and availability summaries/featured lists are capped.
   - Venue/security/contact/dashboard/contract regressions pass 93/93, with TypeScript and production build validation passing. No venues, uploads, inquiries, emails, calendar imports, or records were changed.

29. **Event and performance-portfolio boundaries — resolved in this increment.**
   - Event titles/descriptions/locations/times/rates/capacities/status/category/URLs are strict and bounded; public event reads exclude private events; search filters and pagination are finite; venue event artists must match confirmed booking artists; generic event update/delete and recurrence writes are owner/admin scoped; history references are artist-owned; direct photo add/delete/upload operations are owner-scoped; photo URLs/MIME/data/decoded sizes and history metadata are validated; and recent-photo limits remain backward-compatible while capped.
   - Event security/category/date/route/portfolio regressions pass 55/55, with TypeScript and production build validation passing. No events, history entries, photos, notifications, emails, or records were changed.

30. **Artist profile and legacy media boundaries — resolved in this increment.**
   - Public artist profile IDs/slugs and profile mutation fields are bounded and strict, including social/tip links, fees with minimum/maximum consistency, athlete stats/achievements/NIL data, and profile party size. Profile/gallery/event media uploads validate allowlisted MIME/data URLs, filenames, base64 syntax, and decoded size; profile photos use the shared validated image handler. Performance and portfolio video uploads validate MIME, duration, and size, derive storage extensions from MIME, bind performance upload keys to the authenticated artist, and keep portfolio edits/removals owner-scoped with bounded ordering.
   - Artist profile/photo/performance/portfolio suites pass 93/93, with TypeScript and production build validation passing. No profiles, media, moderation records, emails, or application records were changed.

31. **Legacy artist availability boundaries — resolved in this increment.**
   - Public artist IDs require safe positive integers; optional availability windows use the shared schedule-date validator with end-after-start ordering; availability mutation objects are strict; notes are capped at 2,000 characters; delete IDs are safe positive integers; and the existing maximum-90-day range guards remain before writes.
   - Availability security/calendar regressions pass 6/6, with TypeScript and production build validation passing. No availability rows, notifications, emails, or records were changed.

32. **Legacy booking privacy and deposit-payment boundaries — resolved in this increment.**
   - Venue/client/artist booking creation fields use safe profile IDs, parseable dates, bounded names/addresses/details/contacts, strict objects, and finite money/percentage bounds. Private booking reads reject unrelated authenticated users while preserving client-booker access; status, counter-offer, venue-response, saved-artist, settlement, and rider inputs are strict and safe. Deposit creation/confirmation require a booking party, cap against the agreed deposit, bind confirmation to the stored Stripe PaymentIntent and booking metadata, and check the received amount.
   - Booking security/workflow/calendar/message/notification regressions pass 31/31, with TypeScript and production build validation passing. No bookings, PaymentIntents, payments, notifications, emails, or records were changed.

33. **Review trust boundaries — resolved in this increment.**
   - Review IDs, booking/profile IDs, and rating fields are strict and safe; ratings are integer values from 1–5; titles, bodies, and responses are trimmed and bounded. Profile reviews require an authenticated venue profile; completed booking reviews verify both booking parties and the target profile before writing; artist and venue response mutations retain owner checks.
   - Review security/persistence/workflow regressions pass 60/60 executed (21 legacy router tests remain intentionally skipped), with TypeScript and production build validation passing. No reviews, responses, notifications, emails, or records were changed.

34. **Subscription checkout and sync boundaries — resolved in this increment.**
   - Success/cancel URLs are strict bounded HTTP(S) values and must resolve to the approved application origin; plan/interval/credit inputs are strict; referral-credit coupons are capped at the selected configured plan total; and subscription sync logs no longer expose customer/subscription IDs or account email.
   - Subscription/security/billing/management/pause/pricing/mobile regressions pass 151/151, with TypeScript and production build validation passing. No checkout sessions, coupons, subscription records, emails, or Stripe mutations changed.

35. **Legacy favorites, booking templates, diagnostics, calendar, and payment boundaries — resolved in this increment.**
   - Favorite artist IDs, analytics IDs/windows, calendar date ranges, and booking-template IDs/fields are strict and bounded; template reads/updates/deletes are venue-scoped, and persistence is limited to schema-backed fields. Unused debug/database probes and the legacy manual reminder trigger are administrator-only rather than public.
   - Legacy deposit/full-payment Checkout creation and payment history/refund routes require safe booking IDs and booking-party authorization; cancelled/completed/refunded states and positive finite amounts are rejected, Checkout return URLs use the approved-origin helper, paid-session fallback verification requires a matching paid Stripe session and trusted amount, duplicate refunds are rejected, and connected-account logs omit account identifiers.
   - Legacy-router, booking/security/workflow, availability/calendar, and follow regressions pass 50/50 executed, with TypeScript and production build validation passing. No templates, favorites, reminder emails, bookings, PaymentIntents, Checkout sessions, refunds, or records were changed.

36. **Legacy content, role, and review-read boundaries — resolved in this increment.**
   - The duplicate inline rider-template router now uses safe positive IDs, bounded strict names/data, and schema-safe update fields; newsletter email/name/source payloads are normalized and bounded, and subscriber addresses are not written to operational error logs.
   - The legacy `auth.setUserRole` mutation is administrator-only with strict target IDs; ordinary public review reads return sanitized fields without booking/reviewer identifiers and hide unfinished booking reviews; protected venue/artist review lists and booking details require the owning profile, a completed booking party, or admin before returning sanitized rows.
   - Legacy-content/role/review/router regressions pass 36/36 executed (21 legacy router tests remain intentionally skipped), with TypeScript and production build validation passing. No templates, newsletter subscriptions, roles, reviews, emails, or records were changed.

37. **Authentication projection, public artist search, and credential recovery — resolved in this increment.**
   - `auth.me` now returns an explicit client-safe user projection without password hashes, email-verification tokens, OAuth-provider IDs, or a hardcoded owner email; owner recognition uses configured environment values only. Public artist search uses a strict bounded schema for genre, location, fee, and availability filters, including minimum/maximum and date-range checks.
   - OAuth password setup is protected and bound to the authenticated user ID rather than an arbitrary email; public email lookup helpers only respond for the signed-in account, credentials/tokens/avatar payloads are bounded, reset-email names are HTML-escaped, and auth recovery responses/logs no longer expose account existence or raw exceptions.
   - Auth/search/recovery/security/account-link regressions pass 79/79, with TypeScript and production build validation passing. No passwords, tokens, avatars, emails, accounts, or records were changed.

38. **Email-testing exposure — resolved in this increment.**
   - Both test-all and single-template email procedures are administrator-only rather than publicly callable; recipient and template inputs are normalized, strict, and bounded, success payloads omit recipient addresses, and failure logs/errors no longer include raw exception details.
   - Email-testing/public-endpoint/email-route/legacy-content regressions pass 45/45, with TypeScript and production build validation passing. No test emails, templates, accounts, or records were changed.

39. **Public contact-form HTML and payload safety — resolved in this increment.**
   - Contact name/email/message/subject/honeypot inputs are trimmed, normalized, strict, and bounded; all user-controlled values are escaped before team and confirmation email interpolation, IP/email rate limits remain active, and fallback logs no longer write submitted contact PII or raw payloads.
   - Contact/email/public-endpoint regressions pass 58/58, with TypeScript and production build validation passing. No contact emails, submissions, accounts, or records were changed.

40. **Public AI support assistant abuse and prompt boundaries — resolved in this increment.**
   - Prompt/history messages are trimmed and bounded with strict nested objects and finite history; expensive LLM calls are capped at 30 per minute per client IP, generated output is capped before return, and raw LLM exceptions are no longer logged.
   - AI-chat/navigation/header/public-rate-limit regressions pass 52/52, with TypeScript and production build validation passing. No LLM calls, user records, emails, or external settings were changed during validation.

41. **NIL contract-analysis LLM boundaries — resolved in this increment.**
   - Analysis remains signed-in and athlete-profile-owned, contract input is strict with a 50–50,000-character bound, per-user LLM requests are capped at 6 per 15 minutes, and raw contract-analysis exceptions are no longer logged.
   - Contract-analysis/AI/public-rate-limit regressions pass 51/51, with TypeScript and production build validation passing. No LLM calls, contract text, NIL records, emails, or external settings were changed.

42. **Team invitation capability and collaboration privacy — resolved in this increment.**
   - Invitation tokens must match the generated 64-hex capability format; public previews and pending lists omit raw tokens/full invitee email; accept/decline require the authenticated invitee email; invitation/member IDs and activity limits are safe bounded integers; invitation emails escape user-controlled names; invite activity details omit email PII; and activity responses expose only UI-required fields.
   - Team/rider/UI regressions pass 11/11, with TypeScript and production build validation passing. No invitations, team memberships, emails, activity rows, or records were changed.

43. **Project-preview media and public-read boundaries — resolved in this increment.**
   - Project/track IDs and mutation objects are strict and safe, titles/descriptions/dates/HTTPS links/file names/media payloads are bounded, cover/audio data URLs must match allowlisted MIME types and basic file signatures with decoded-size checks and MIME-derived storage extensions, reorder requests reject duplicate/foreign/missing IDs, public projects are limited to artist accounts with safe field projections, and public play-count increments are capped at 30 per minute per client IP.
   - Project-preview/layout/release-section regressions pass 18/18, with TypeScript and production build validation passing. No projects, media uploads, play counts, or records were changed.

## Audit limitations

This was a source and runtime-configuration audit, not a production penetration test. It did not submit OAuth callbacks, send email, create payments/refunds, mutate events, or run destructive cleanup. The open findings above should be fixed with focused tests and then verified on the preview before publication.
