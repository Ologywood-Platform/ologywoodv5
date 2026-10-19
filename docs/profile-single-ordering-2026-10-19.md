# Creator-controlled profile single ordering

**Date:** October 19, 2026  
**Status:** Original checkpoint 25f74a44 was published, then a real loading regression was reported and repaired. The runtime table has been restored and the live public music endpoint returns all nine uploaded songs. The ownership-query/UI repair still needs its new checkpoint published; authenticated production reorder saving is not claimed.

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

Publish the new repair checkpoint, then verify the real Music Releases list and reorder opening. The runtime-only table restoration already recovered the deployed public music read (HTTP 200, nine songs), but the corrected protected ownership query and explicit list error UI require publication. Continue using non-mutating checks; do not save a real order merely to demonstrate the repair. The creator can then open the appropriate manager, choose Reorder Singles, arrange their real published singles, and Save Order. Local/mock tests are not claimed as authenticated production ordering or purchase verification. No real release order was changed merely to demonstrate the feature.

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
