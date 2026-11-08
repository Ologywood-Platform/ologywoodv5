# OlogyWood API Endpoint Audit

**Date:** 2026-11-08  
**Scope:** Read-only source audit of the active Express runtime and mounted route modules. No application records, OAuth integrations, payments, or external settings were changed.

## Executive summary

The active runtime is `server/_core/index.ts`. It mounts the Stripe webhook before JSON parsing, bounded media-upload parsers, event CRUD/search, release upload/download/checkout, booking checkout, contract PDFs, video uploads, eBook files, rider PDFs, calendar feeds/sync, OAuth, OG endpoints, rate-limited tRPC, and scheduled handlers.

The audit confirmed strong protections in several sensitive areas: Stripe signature ordering, authenticated eBook/rider delivery, owner-bound signed video-upload sessions, strict positive-ID parsers on recently hardened legacy routes, generic error responses on the audited endpoints, and private/no-store rider PDFs. The critical follow-ups—OAuth state/redirect integrity, release-checkout input/origin handling, legacy event validation/ownership, test-email authorization/validation/rate limiting, legacy video duration/extension handling, and release-preview MIME/data-URL normalization—have now been hardened and regression-tested. Remaining findings include the unmounted legacy test module's cleanup review, the local-only nature of the current in-memory email limiter, the release-download preview route's local positive-ID check, sensitive-value log redaction, and the broader endpoint coverage items listed below.

## Verified protections

- `server/routes/bookFiles.ts`: positive integer item/access IDs, authenticated upload/download, owner/email entitlement checks, rights confirmation, MIME/size limits, private storage keys, bounded download counts, and client-safe errors.
- `server/routes/releaseDownload.ts`: authenticated ownership checks for purchased downloads, strict purchase IDs, published-only public previews, and generic provider errors. The public preview route still uses a local numeric guard and should be normalized to the shared route-ID parser in a follow-up.
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

7. **Public release preview should use the shared route-ID parser.**
   - File: `server/routes/releaseDownload.ts`, `/preview/:releaseId`.
   - It has a local positive integer check that is functionally close to the shared helper. Normalize it to the shared helper to prevent parser drift.

8. **Release-preview MIME/data-URL parser — resolved in this increment.**
   - File: `server/services/releasePreviewMedia.ts`.
   - Data URLs now require supported canonical or aliased audio/video MIME types, declared MIME must agree with the route MIME when both are supplied, raw base64 remains supported for compatibility, and malformed/non-canonical data fails before FFmpeg. Release-preview API/media tests pass 30/30 and TypeScript validation passes.

9. **Google OAuth timeout — resolved in this increment.**
   - File: `server/routes/googleAuth.ts`.
   - Google token/userinfo fetches now use bounded timeouts and fixed provider-error mapping, aligned with the Spotify route. Covered by the OAuth regression suite; no provider flow was completed.

10. **Sensitive identifiers are logged in OAuth/PDF paths.**
   - Google/Spotify log provider email and IDs; contract PDF logs booking/profile/contract IDs. These are not returned to clients, but production log retention should be treated as sensitive. Prefer stable internal correlation IDs and redact personal email/provider identifiers.

## Audit limitations

This was a source and runtime-configuration audit, not a production penetration test. It did not submit OAuth callbacks, send email, create payments/refunds, mutate events, or run destructive cleanup. The open findings above should be fixed with focused tests and then verified on the preview before publication.
