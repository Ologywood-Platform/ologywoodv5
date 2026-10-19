# Creator-controlled profile single ordering

**Date:** October 19, 2026  
**Status:** Implemented and fully validated in development. Production publication and live owner verification remain pending.

## User experience

The existing Music Releases and Content Releases managers now offer **Reorder Singles** in their list-header actions, not on another page or primary navigation destination. Music Releases arranges uploaded published single-track songs; Content Releases arranges published listings whose release type is Single. Their existing public profile sections stay separate, and non-single content, drafts, and archived releases are not moved.

Creators can drag a single using its handle on desktop or use the always-available Move Up / Move Down controls on mobile or with a keyboard. Local moves do not persist until **Save Order** succeeds. Cancel discards the draft, including safely canceling a pending read-only load; a pending save cannot be dismissed or submitted twice. Successful saves invalidate the matching manager and public-profile queries. Reopening always reads current server state, and cache refetches never silently overwrite an unsaved arrangement.

Failed or unconfirmed saves retain the local draft and expose Retry and explicit Reload current order. A revision conflict cannot overwrite newer changes. Feedback distinguishes unconfirmed persistence from definite success. **Reset to Newest** is available for a saved custom order and requires explicit confirmation; it persists a default-state marker while advancing the revision. The numbered dialog scrolls within mobile viewports and uses the existing above-Terms-notice modal layer so its controls remain reachable.

Without a custom order, each existing newest-first display baseline remains unchanged. Music profile/order previews use publication date with deterministic ID ties; hosted Singles use creation date with deterministic ID ties. In custom mode, saved selections lead, missing/unpublished references are ignored, and newly published singles follow the saved selections. Music manager and public-profile custom ordering agree even where the manager's ordinary creation-date baseline differs from profile publication-date ordering. Hosted non-single rows retain their original slots.

## Security and persistence

Protected `releaseOrder.get` and `releaseOrder.save` derive the profile from the authenticated account; callers cannot select a target profile/user. The service verifies actual artist-profile ownership, excludes non-owner team members and legacy team-member profiles, and has no admin bypass. An admin who actually owns a creator profile remains eligible. The UI separately checks current profile ownership and team context and does not fetch ordering for denied accounts.

Saves use a shared authenticated-user `FOR UPDATE` lock under a same-connection READ COMMITTED transaction. Owner/team tuples and the current eligible source rows are rechecked and locked before writing. Hosted eligibility binds both profile and account identity. Unique positive safe-integer IDs, bounded inputs, the full current published set, and the optimistic revision are verified. Foreign, unpublished, wrong-type, omitted, duplicate, and stale inputs cannot silently replace an order or disclose another creator's titles. Writes affect only the separate presentation table and roll back on error. Corrupt metadata/source outages fail safely rather than silently switching a custom order to newest-first.

Migration `0118_glorious_omega_sentinel.sql` was generated, reviewed, and applied through managed SQL. It creates only the empty `profile_release_orders` table, with unique profile/collection scope, nullable ordered-ID JSON, revision, and UTC epoch-millisecond update time. Metadata-only checks confirmed all columns and the primary/unique indexes. The runtime guard inspects declarations and requires a valid migration; it performs no DDL or destructive repair.

Prices, fee percentages, Stripe/payment flows, releases and publication state, purchases, previews, audio files, downloads, My Ology libraries/playlists, plan limits/grants, private Schedule, fan-email consent, and the six canonical destinations are unchanged. No real creator/profile/release/order/purchase/payment records were intentionally updated during validation; no checkout, upload, or email was performed.

## Exact validation

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

Publish the saved checkpoint, then verify the deployed Help/AI guidance and anonymous private-endpoint rejection without changing records. The creator can then open the appropriate manager, choose Reorder Singles, arrange their real published singles, and Save Order. Local/mock tests are not claimed as authenticated production ordering or purchase verification. No real release order was changed merely to demonstrate the feature.
