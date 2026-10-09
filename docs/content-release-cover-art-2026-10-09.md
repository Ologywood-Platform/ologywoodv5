# Content Release cover-art uploads

Date: October 9, 2026

## Scope

Added optional creator-uploaded cover art to every externally hosted Content Release type, including Single. The existing `thumbnailUrl` field is used, so no database migration is needed. Music Releases and all current payment percentages are unchanged.

## Creator experience

The create/edit form includes Cover Art with upload, preview, replace and remove controls. Supported formats are JPG/JPEG, PNG and WebP, up to 10 MB. Square artwork is recommended but not required. Neither server processing nor display crops the artwork. Existing covers load into the editor; dashboard and public release cards display them, with the previous category icon as a fallback when missing or unreadable.

Artwork is attached or removed only through Create Release or Update Release. Uploading does not change an existing record. A failed upload keeps the previous artwork and form entries, resets the loading state and permits selecting the same file again. Save is disabled during upload. Cancel and the back control remain usable; an unmounted upload cannot apply its result to a later draft. A saved cover can be removed because the form sends an explicit empty string, which the API stores as null. Legacy cover URLs remain usable if they use HTTP/HTTPS or the built-in storage path.

## Security and media processing

The upload mutation requires authentication, creator/admin access and an owned creator profile. Editing requires an existing release owned by the caller. New-release uploads enforce the same Free and Starter limits as creation; existing owned releases can update their artwork. Rate limiting is ten uploads per minute per authenticated owner in each application process.

The server bounds base64 input before decoding, validates canonical encoding, verifies actual decoded image format against the claimed MIME type, and rejects SVG, malformed images, multi-frame images, over-10-MB content, sides over 12,000 pixels and excessive pixel counts. Sharp decodes with a 40-million-pixel limit, applies orientation, preserves aspect ratio/transparency, limits output to 1600×1600 without enlargement, converts to WebP, and removes embedded EXIF/GPS metadata. The storage key is randomized and owner-bound; callers cannot specify another user's key or a filesystem path. Safe API/UI upload errors do not expose storage diagnostics. Invalid script/data URL schemes are rejected in release artwork metadata.

The standard configured storage helper is used; only its returned stable URL is persisted, not bytes. Replacing/removing/cancelling does not delete old objects, because the configured storage helper has no delete API. Unattached or replaced objects may therefore remain in storage; the application does not claim physical deletion.

## Guidance

The form explains formats, size, optionality and save behavior. Help includes a specific upload/replace-cover article and updated Single instructions. The AI assistant supplies deterministic artwork guidance without changing model behavior.

## Validation

**54 focused tests passed**, including 17 new cover-art tests with real generated image bytes. Tests cover actual JPEG/PNG/WebP normalization, transparency/aspect ratio, orientation and metadata stripping, animated content, false MIME types, malformed base64, oversized content/dimensions, authentication, creator role, profile and release ownership, plan gates, rate limits, safe storage error/retry behavior, persisted and cleared artwork, and preservation of unrelated release settings.

The **full suite passed 2,871 tests with 23 skipped and zero failures**. TypeScript, production build (19.50 seconds), diff hygiene and scoped credential/conflict-marker checks passed.

Isolated browser tests passed at 1280 and 390 pixels wide. Every API request was mocked: existing cover preview, invalid/oversized rejection before requests, failed upload preserving the old image, same-file retry, disabled save during upload, saved replacement, saved removal, cancel during upload, clean subsequent draft and new Single with cover art. There were zero real account/release/purchase writes. Unrelated onboarding and consent notices were dismissed only for the mock browser account.

A separate synthetic 16×16 WebP object was uploaded through the real storage helper and retrieved with HTTP 200. The returned URL did not contain a short-lived signature; retrieved bytes decoded as WebP with the correct dimensions. The validation object was never attached to any real record. Its one-use script was removed; the configured storage helper does not expose physical object deletion.

## Publication

Publish the cover-art checkpoint, then verify the live upload controls and updated Help. The creator can use Edit on the newly released Single to add artwork and choose Update Release. Do not attach or replace art on real releases during validation without the creator's explicit instruction. The creator reported that the prior Single/save repair was working; an automated public probe was blocked with HTTP 403, so this record does not assert an independent live authenticated-save check.
