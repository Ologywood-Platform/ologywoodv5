# Creator-controlled profile single ordering

**Date:** October 19, 2026  
**Status:** After repair checkpoint dccb4cb4, the owner confirmed "Its working thanks looks good" at 10:35:48. This records user-reported confirmation, not an independent authenticated production-save test. A new quick-guide update is validated and awaits its checkpoint publication. Earlier runtime/public checks returned all nine uploaded songs without changing records.

## User experience

The existing Music Releases and Content Releases managers now offer **Reorder Singles** in their list-header actions, not on another page or primary navigation destination. Music Releases arranges uploaded published single-track songs; Content Releases arranges published listings whose release type is Single. Their existing public profile sections stay separate, and non-single content, drafts, and archived releases are not moved.

Creators can drag a single using its handle on desktop or use the always-available Move Up / Move Down controls on mobile or with a keyboard. Local moves do not persist until **Save Order** succeeds. Cancel discards the draft, including safely canceling a pending read-only load; a pending save cannot be dismissed or submitted twice. Successful saves invalidate the matching manager and public-profile queries. Reopening always reads current server state, and cache refetches never silently overwrite an unsaved arrangement.

Failed or unconfirmed saves retain the local draft and expose Retry and explicit Reload current order. A revision conflict cannot overwrite newer changes. Feedback distinguishes unconfirmed persistence from definite success. **Reset to Newest** is available for a saved custom order and requires explicit confirmation; it persists a default-state marker while advancing the revision. The numbered dialog scrolls within mobile viewports and uses the existing above-Terms-notice modal layer so its controls remain reachable.

Without a custom order, each existing newest-first display baseline remains unchanged. Music profile/order previews use publication date with deterministic ID ties; hosted Singles use creation date with deterministic ID ties. In custom mode, saved selections lead, missing/unpublished references are ignored, and newly published singles follow the saved selections. Music manager and public-profile custom ordering agree even where the manager's ordinary creation-date baseline differs from profile publication-date ordering. Hosted non-single rows retain their original slots.

## Security and persistence

Protected `releaseOrder.get` and `releaseOrder.save` derive the profile from the authenticated account; callers cannot select a target profile/user. The service verifies actual artist-profile ownership, excludes non-owner team members and legacy team-member profiles, and has no admin bypass. An admin who actually owns a creator profile remains eligible. The UI separately checks current profile ownership and team context and does not fetch ordering for denied accounts.

Saves use a shared authenticated-user `FOR UPDATE` lock under a same-connection READ COMMITTED transaction. Owner/team tuples and the current eligible source rows are rechecked and locked before writing. Hosted eligibility binds both profile and account identity. Unique positive safe-integer IDs, bounded inputs, the full current published set, and the optimistic revision are verified. Foreign, unpublished, wrong-type, omitted, duplicate, and stale inputs cannot silently replace an order or disclose another creator's titles. Writes affect only the separate presentation table and roll back on error. Corrupt metadata/source outages fail safely rather than silently switching a custom order to newest-first.

Migration `0118_glorious_omega_sentinel.sql` was generated, reviewed, and applied through managed SQL. It creates only the empty `profile_release_orders` table, with unique profile/collection scope, nullable ordered-ID JSON, revision, and UTC epoch-millisecond update time. The initial metadata-only checks confirmed columns/indexes in the managed SQL target, not the actual application database. After the reported regression, direct mysql2 checks proved the runtime table was absent. The guard now restores only the entirely absent declared table with idempotent CREATE TABLE IF NOT EXISTS, then reinspects its columns/indexes. Existing incomplete tables and permission failures fail closed; no ALTER, DROP, data rewrite, or unrelated migration is performed.

Prices, fee percentages, Stripe/payment flows, releases and publication state, purchases, previews, audio files, downloads, My Ology libraries/playlists, plan limits/grants, private Schedule, fan-email consent, and the six canonical destinations are unchanged. No real creator/profile/release/order/purchase/payment records were intentionally updated during validation; no checkout, upload, or email was performed.

## Original implementation validation (before runtime repair)

| Validation | Result |
|---|---|
| New permanent ordering/helper/guidance/router/service/schema/UI regressions | 67 passed across 6 files |
| Expanded affected release/commerce/navigation suite | 176 passed across 13 files; zero failed |
| Full platform Vitest suite | 3,382 passed, zero failed, 23 existing skipped; 3,405 total across 211 files |
| TypeScript | Passed |
| Production build | Passed; Vite 16.01 seconds; pre-existing bundle/dependency advisory warnings remain |
| Diff / credential / conflict / artifact hygiene | Passed |
| Schema verification | Metadata only; columns and unique scope confirmed |
| Anonymous development ordering read | HTTP 401 |
| Fully intercepted browser workflow | Passed for both managers at 390px and 1440px; no page errors, horizontal/dialog overflow, or real API mutations |

Browser checks used synthetic admin-owner data and covered lazy reads, cancel during a pending load, arrow movement, desktop handle drag/drop, unsaved Cancel, generic conflict with retained draft, Retry success, confirmed persistence/read-back, reset rejection/confirmation, collaborator denial, and missing-profile-admin denial without ordering queries. The final mobile dialog was visually inspected. Disposable scripts/screenshots were removed.

## Publication

Publish the latest quick-guide checkpoint, which retains the repaired ordering implementation. Verify How to reorder beside Reorder Singles, the visible dialog movement/save tips, and the full-guide Help link without saving a real order merely to demonstrate the UI. The owner already reported the repaired feature working; local/mock guide tests are not claimed as authenticated production saves or purchase verification. No real release order was changed during validation.

## Reported loading regression and repair — October 19, 2026

The creator reported a blank/empty Music Releases manager and no singles appearing in Reorder Singles. Runtime logs showed both `release.getMyReleases` and `releaseOrder.get` failing. A direct read through the application mysql2 pool found zero columns/indexes for `profile_release_orders`, despite the managed SQL target reporting the expected declarations. The ordinary list had already read real songs but its presentation helper then failed at the missing ordering table. The UI coerced that failed query into an empty array and displayed “No releases yet.”

A second definite failure was concealed behind the first: raw ownership SQL used `role` on `artist_team_members`, while the physical database column is `teamRole` (the TypeScript property is named role). The correction applies to both protected reads and locked saves, retaining the exact prior owner/collaborator restrictions. Tests now compare the physical Drizzle column and reject nonexistent raw SQL columns rather than accepting any membership query.

The narrow missing-table guard was exercised against the real application driver. After restoring only the declared table, actual owner and public music helpers both returned nine records; the protected music-order service returned nine eligible titles at revision zero/default order. Both kinds of protected service reads succeeded. Browser requests to the production public music endpoint returned HTTP 200 with nine songs; there was no remaining public music loading/error state. No release, profile, purchase, payment, user, or real order rows were rewritten. The previously read-only schema guard now has this explicitly documented additive missing-table exception.

The Music Releases list now distinguishes pending, failed, and successfully empty results and offers Retry loading releases with a safe explanation rather than implying songs were removed. The existing reorder dialog’s failed-read Retry/Cancel flow was tested along with successful recovery and local move cancellation.

| Repair validation | Result |
|---|---|
| Additional regression coverage | 11 new tests: 7 schema cases, 1 physical membership-column case, 3 music loading UI cases |
| Expanded focused suite | 187 passed across 14 files, zero failed |
| Exact full platform suite | 3,393 passed, zero failed, 23 existing skipped; 3,416 total across 212 files |
| TypeScript and production build | Passed; Vite 16.45 seconds |
| Intercepted browser checks | 390px/1440px: failure is not empty; list retry recovers; reorder source failure/retry recovers; local move/Cancel; no mutations, page errors, or overflow |
| Actual runtime read verification | Owner list, public list and protected order state each returned nine existing music releases without order mutation |
| Production public verification | Normal browser GET returned HTTP 200 and nine published music entries; authenticated production reorder still awaits repaired-code publication |
| Hygiene | Scoped credential/conflict/artifact scan and diff checks clean; disposable diagnostic/browser fixtures removed |

The original mocked tests passed because they always provided a complete order table and accepted any team-membership query. They did not verify the application’s actual runtime database. The new regressions cover absent-table recovery, upper-case mysql2/TiDB metadata, incomplete existing schema, concurrent creation, permission errors/retry, no broad/data-changing repair, the real teamRole column, and UI error ordering. A separate fan-contact load error seen in existing logs was not part of this release-order repair and was not modified here.

## Artist quick guide — October 19, 2026

At 10:35:48, after checkpoint dccb4cb4, the owner reported the repaired feature working and looking good. At 10:36:50 the owner requested a quick guide or tooltip. Added a reusable **How to reorder** control beside **Reorder Singles** in both existing managers. It opens a click/touch/keyboard-accessible popover rather than hover-only help. Its three steps cover opening the published-single list, desktop grip dragging or mobile/keyboard Move Up/Move Down, and explicit Save Order versus Cancel. It also explains confirmed published-single Reset to Newest, new singles following the saved order, owner-only saving, and unchanged prices/purchases/fan playlists.

Opening the quick guide is entirely static: it triggers no order fetch, mutation, storage, or dismissal of a saved/local arrangement. The component stays within the existing owner gate. Visible movement/save tips inside the reorder dialog and movement-button hover titles reinforce the instructions without changing any existing load/move/save/cancel/reset callbacks or API/schema/security rules.

The guide's full-article link opens Help in a separate tab with the known ordering FAQ selected, expanded, scrolled into view, and keyboard focused. Help resolves only IDs from its existing FAQ catalog and ignores unknown/malformed selectors; no redirect or arbitrary content rendering is introduced. Normal search/category/accordion controls remain functional, with accessible expanded/controlled-answer states. Updated the existing Help answer and deterministic AI guidance to point to the quick guide. No new primary navigation, assets, database changes, order writes, fees, checkout, emails, or real user/content mutations.

| Quick-guide validation | Result |
|---|---|
| New permanent tests | 13 passed: touch/keyboard/static guide, owner gating, save/cancel/reset scope, Help-link safety, catalog selector cases, movement titles, AI discoverability |
| Focused ordering/support suite | 100 passed across 9 files; zero failed |
| Exact full platform suite | 3,406 passed, zero failed, 23 existing skipped; 3,429 total across 213 files |
| TypeScript / production build | Passed; Vite 17.05 seconds |
| Intercepted browser workflow | Both managers at 390px/1440px; actual phone tap, keyboard open/Escape/focus return, zero guide-triggered order reads, expanded in-view Help popup, dialog tips/local movement/Cancel, denied-account hidden guide, zero mutations/page errors/overflow |
| Visual/hygiene | Mobile popover reviewed; diff/credential/conflict/artifact scan clean; disposable fixtures/screenshots removed |

Publish the guide checkpoint before describing the new help UI as live. This release does not claim an authenticated production save; the owner confirmation for the previous repair and fully intercepted development checks for this addition are recorded separately.
