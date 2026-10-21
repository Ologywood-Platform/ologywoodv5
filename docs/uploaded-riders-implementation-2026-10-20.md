# Private Uploaded Riders — Implementation and Release Record

**Date:** October 20, 2026  
**Status:** Implemented and validated in development; awaiting publication and production verification.

## Artist and manager workflow

The existing My Riders screen now includes **Uploaded Riders → Upload PDF**, alongside the structured Rider Builder. Talent can name and upload their own plain PDF rider, preview or download it, replace it with a new version, select a default, clear that default, or archive it. The existing platform header, builder templates, booking controls, and six primary destinations remain available.

The feature is available to every supported talent type under the existing Starter-and-above rider entitlement. New uploads, replacements, and selecting a new default require the **owner’s** eligible plan. Authorized users can still read retained documents, archive them, and clear a default after downgrade. No subscription price or transaction fee changed.

An actual talent profile owner can grant or revoke **Manage Riders** for an existing member in Team Management. A manager then opens their talent owner’s rider library from Team Workspace. Existing members without the explicit permission remain denied; role names, arbitrary admin access, and invitation-created legacy artist profiles do not grant access. New manager invitations include the persisted rider permission in their existing role defaults. No real member was granted access during implementation, including DJ Ronnie G’s team.

## Documents, booking versions, and privacy

Uploads are limited to **10 MB and 100 pages**. The server validates actual bytes, strict base64, safe PDF filenames, document structure, completeness, and page limits. Encrypted/password-protected files, scripts, embedded attachments, interactive forms, non-empty annotations, and linked/active content are rejected. Users with such documents should export or print a plain PDF first. Page content and geometry are copied into a clean PDF and source identity metadata is removed. This is structural validation/sanitization, **not a claim of comprehensive antivirus scanning**.

PDFs are encrypted with randomized **AES-256-GCM**, bound to the owner and storage key. A separate persistent project secret, `RIDER_DOCUMENT_ENCRYPTION_KEY`, is configured and validated; no login/JWT credential was changed. Login-secret rotation does not affect retained rider files. Keep the dedicated key backed up and do not replace it after uploads without an explicit key migration.

Only opaque encrypted objects reach storage. Client responses expose same-origin authenticated PDF routes, never storage keys, signed object URLs, or decrypted public objects. Downloads recheck ownership or actual booking-participant/explicit-manager access, use private no-store responses, distinguish attachment downloads from inline previews, and apply content-type, sandbox, and framing protections. Storage reads reject redirects/untrusted origins, enforce the exact private key namespace and streamed byte limits, and have bounded provider work.

New bookings capture the current default PDF version atomically with booking creation. Authorized owners/managers can also attach a current library version to a booking. Every attachment references an immutable version and frozen title; replacement, default changes, or archiving do not rewrite older booking attachments. Archive is not permanent deletion. PDF attachments supplement the existing rider/contract workflow and do not automatically imply acceptance or an e-signature.

## Implementation safeguards

The additive migration `drizzle/0119_nebulous_sleeper.sql` was generated and reviewed. Its three declared tables and indexes were applied non-destructively: `rider_documents`, `rider_document_versions`, and `booking_rider_document_links`. Actual runtime table/column metadata and immutable-version/link unique indexes were verified, not merely the separate managed database. The narrow runtime guard creates missing declared tables, validates required metadata/unique scopes, caches successful checks per pool, and never repairs data by rewriting application rows.

Library and booking operations use same-connection transactions, READ COMMITTED isolation, deterministic sorted participant user locks, permission rechecks, and optimistic document revisions. Default PDF snapshots and booking inserts commit or roll back together. Expensive uploads are rate-limited by actor and owner. Errors do not become false empty lists; failed drafts survive retry, and replacement conflicts require a fresh explicit version review. Upload, replacement, and archive dialogs remain reachable on short phones and above the existing Terms notice.

## Exact validation

| Check | Result |
|---|---|
| Final focused rider suite | 77 passed, 0 failed; 11 files |
| Final full platform suite | 3,558 passed, 23 existing skipped, 0 failed; 3,581 total tests, 231 files |
| TypeScript | Passed |
| Production build | Passed; 17.65 seconds |
| Real dedicated-key validation | 3 tests passed, including decryptability after login-secret rotation |
| Actual storage verification | One synthetic encrypted PDF uploaded/read/decrypted successfully; trusted CDN source and exact safe-PDF match |
| Isolated browser workflows | Passed at 320×620, 390×900, and 1440×900; zero real API mutations, page errors, or horizontal overflow |
| Anonymous development privacy boundary | PDF download, library context, and booking document list returned HTTP 401 |
| Scoped hygiene | Diff, merge-marker, credential, and artifact checks passed |

The browser checks intercepted every API operation and covered list-error/retry, invalid-file recovery, upload-error/draft/retry, replacement conflict/reload/retry, private version URLs, default/clear, archive Cancel/confirm, manager-owner context, denied-context non-fetch, and retained reads after downgrade. The final short-phone upload dialog and mobile library were visually inspected.

No real account, profile, booking, rider, contract, payment, consent, or permission row was changed during validation. No checkout, payment, signature, or email was sent. One synthetic encrypted storage object remains unreferenced; the storage provider has no deletion helper, and no plaintext or real document was used.

## Publication and production check

Publish the validated checkpoint, then verify My Riders/Team Management/booking PDF controls, Help and assistant guidance, and signed-out privacy boundaries on production. Authenticated production upload, owner permission grant, and real booking attachment are not asserted by local/mocked checks and should be performed only at the user’s initiative. Existing uploaded files depend on retaining the configured encryption key.
