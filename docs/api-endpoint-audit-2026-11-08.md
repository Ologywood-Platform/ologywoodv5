# OlogyWood API Endpoint Audit

**Date:** 2026-11-08  
**Scope:** Read-only source audit of the active Express runtime and mounted route modules. No application records, OAuth integrations, payments, or external settings were changed.

## Executive summary

The active runtime is `server/_core/index.ts`. It mounts the Stripe webhook before JSON parsing, bounded media-upload parsers, event CRUD/search, release upload/download/checkout, booking checkout, contract PDFs, video uploads, eBook files, rider PDFs, calendar feeds/sync, OAuth, OG endpoints, rate-limited tRPC, and scheduled handlers.

The audit confirmed strong protections in several sensitive areas: Stripe signature ordering, authenticated eBook/rider delivery, owner-bound signed video-upload sessions, strict positive-ID parsers on recently hardened legacy routes, generic error responses on the audited endpoints, and private/no-store rider PDFs. The audit also found several remaining issues that should be handled in a follow-up implementation pass, especially OAuth state/redirect integrity, an active release-checkout input/origin boundary, and insufficient validation/authorization in the legacy event router.

## Verified protections

- `server/routes/bookFiles.ts`: positive integer item/access IDs, authenticated upload/download, owner/email entitlement checks, rights confirmation, MIME/size limits, private storage keys, bounded download counts, and client-safe errors.
- `server/routes/releaseDownload.ts`: authenticated ownership checks for purchased downloads, strict purchase IDs, published-only public previews, and generic provider errors. The public preview route still uses a local numeric guard and should be normalized to the shared parser in a follow-up.
- `server/routes/riderDocuments.ts`: authenticated access, strict version/booking IDs, owner or booking-party authorization, transaction/rollback handling, encrypted document retrieval, no storage URL exposure, private no-store headers, safe content-disposition handling, and generic errors.
- `server/routes/mediaUploads.ts`: authentication occurs before raw-body allocation; metadata, content type, content length, chunk size, and chunk index are bounded; service errors are mapped to stable client-safe codes.
- `server/routes/videoUpload.ts`: owner/profile and plan checks, signed owner-bound upload sessions for direct uploads, bounded chunk sizes, source-format validation, conversion validation, and client-safe validation errors. The legacy `/upload` path has a separate duration-validation gap noted below.
- `server/routes/calendarFeed.ts` and the route-input helpers: calendar-feed token handling and recently hardened positive-ID boundaries are present.
- `server/_core/index.ts`: Stripe raw-body handling is registered before JSON middleware; the actual runtime installs HTTPS redirect and security headers before application routes; global error/not-found handlers are last.

## Findings requiring follow-up

### High priority

1. **OAuth callback state is unsigned and its redirect target is trusted.**
   - Files: `server/routes/googleAuth.ts` and `server/routes/spotifyAuth.ts`.
   - The `state` value is only base64-encoded JSON. The callback accepts a caller-supplied state, trusts `stateObj.origin` and `stateObj.returnPath`, and does not verify the generated CSRF value against a server-side or signed value.
   - Impact: tampered state can enable open redirects and weakens OAuth login CSRF/account-linking protection. Calendar sync has a related issue: an unsigned state carries `userId` and the callback does not bind it to the initiating session.
   - Recommended fix: use a short-lived signed/HMAC state envelope (or server-side nonce) containing the initiating user/session identity; derive the redirect origin from a configured allowlist; allow only same-origin relative return paths that begin with one `/` and reject `//`, backslashes, absolute URLs, and overlong values. Do not trust callback-provided origin.

2. **Legacy event routes accept broad bodies and have authorization gaps.**
   - File: `server/routes/events.ts`.
   - Create/update/history/photo inputs lack comprehensive type, length, date, URL, and numeric validation. `PUT /api/events/:id` spreads the entire request body into `updateEvent`, allowing fields beyond an explicit allowlist. `DELETE /api/events/photos/:photoId` authenticates but does not verify that the caller owns the photo/event history. Photo creation likewise verifies authentication but not event-history ownership. `bookingId`/`venueId`/`attendeeCount` in history are not strictly validated.
   - Impact: malformed data and potential cross-user event-photo mutation.
   - Recommended fix: define route-specific schemas, allowlist update fields, enforce length/date/rate/capacity bounds, validate URLs, and verify event-history ownership for photo add/delete.

3. **Release checkout has permissive numeric parsing and trusts the request Origin.**
   - File: `server/routes/releaseCheckout.ts`.
   - `parseInt(releaseId)` and `parseInt(customAmountCents)` accept values such as `12junk`; custom amounts are not explicitly required to be finite safe integers when supplied. `req.headers.origin` is used directly to construct Stripe success/cancel URLs.
   - Impact: malformed input reaches the database/price logic, and a caller-controlled Origin can influence redirect destinations.
   - Recommended fix: use the shared positive integer parser and explicit integer/currency bounds; construct URLs from a configured same-origin allowlist (`BASE_URL`/approved domains), never arbitrary request headers.

### Medium priority

4. **Unauthenticated payment-testing module can mutate booking status if mounted.**
   - File: `server/routes/paymentTestingRoutes.ts` and `server/services/paymentTestingService.ts`.
   - The routes do not authenticate or authorize the booking party, while service methods directly change booking status to confirmed/cancelled/pending. The current active runtime entrypoint does not mount this module, so it is not presently reachable through `server/_core/index.ts`; it should not be deleted blindly because legacy entrypoints/tests may reference it.
   - Recommended fix: remove from runtime or make it an owner/admin-only test tool behind an explicit non-production guard and POST-only semantics. Add a mount inventory test so it cannot become reachable accidentally.

5. **Unauthenticated email-test endpoint can send arbitrary mail.**
   - File: `server/routes/emailRoutes.ts`.
   - `POST /api/email/test` checks only whether the string contains `@`, sends to the submitted address, and echoes that address. There is no visible authentication, admin authorization, rate limit, or strict email schema in the route.
   - Recommended fix: restrict to authenticated owner/admin or remove from production, add strict schema/rate limiting, and avoid reflecting addresses unnecessarily.

6. **Legacy video upload duration and filename validation is weaker than direct upload.**
   - File: `server/routes/videoUpload.ts`, legacy `POST /upload`.
   - `parseFloat(req.body.durationSeconds || '0')` checks only `> 300`; `NaN`, negative, and non-finite values can pass and be stored. The extension is derived from the original filename without an allowlist.
   - Recommended fix: require a finite duration in `[0, 300]` with an explicit policy for zero, and derive a fixed extension from the validated MIME type.

### Low priority / consistency

7. **Public release preview should use the shared route-ID parser.**
   - File: `server/routes/releaseDownload.ts`, `/preview/:releaseId`.
   - It has a local positive integer check that is functionally close to the shared helper. Normalize it to the shared helper to prevent parser drift.

8. **Google OAuth lacks the timeout pattern already used by Spotify.**
   - File: `server/routes/googleAuth.ts`.
   - Token/userinfo fetches have no visible `AbortSignal.timeout`; a provider stall can hold a request longer than intended. Add the same bounded timeout and safe provider-error mapping used by Spotify.

9. **Sensitive identifiers are logged in OAuth/PDF paths.**
   - Google/Spotify log provider email and IDs; contract PDF logs booking/profile/contract IDs. These are not returned to clients, but production log retention should be treated as sensitive. Prefer stable internal correlation IDs and redact personal email/provider identifiers.

## Audit limitations

This was a source and runtime-configuration audit, not a production penetration test. It did not submit OAuth callbacks, send email, create payments/refunds, mutate events, or run destructive cleanup. The open findings above should be fixed with focused tests and then verified on the preview before publication.
