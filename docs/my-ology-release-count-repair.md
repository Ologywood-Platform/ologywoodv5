# My Ology Release Purchase and Music Library Repair

## Expected behavior

My Ology represents two related but different concepts:

| Area | Meaning | Owner’s verified result |
|---|---|---:|
| Release purchases | One row per completed purchase transaction | 2 |
| Music library | One playable item per unique purchased release | 1 |

Buying the same song twice must not delete or merge either purchase record. The player, however, should not show duplicate copies of the same audio.

## Root cause

Both `release.myPurchases` and `release.myLibrary` loaded each purchase and then performed a separate full-row `artist_releases` query. Production logs showed both procedures failing on that full release projection after optional AI disclosure metadata was added. My Ology correctly surfaced its partial-data warning but used empty arrays for failed sections, which produced the misleading zero counts.

The library procedure also returned every visible purchase directly, so once the query succeeded, two purchases of one song would produce two player items.

## Repair

`getUserPurchases` now performs one left join with an explicit stable release summary containing only the fields needed by purchase history and the player. This removes the N-plus-one query pattern and keeps My Ology independent of optional creator metadata columns.

Purchase history remains untouched and returns every matching transaction. A separate pure `selectUniquePlayablePurchases` function chooses the newest visible entitlement for each `releaseId`, excludes hidden or unplayable legacy rows, and returns one player item per song.

No purchase, release, payment, download, hidden-library, owner, or access record is modified by the repair.

## Real-account validation

A one-use read-only real-router validation loaded authenticated user 7 and called the actual `release.myPurchases` and `release.myLibrary` procedures. The result contained **two purchase records**, both for the same `releaseId`, and **one unique playable library item**. Both procedures completed successfully. The validator was removed immediately afterward.

Permanent regressions cover duplicate purchases, distinct releases, newest-entitlement selection, hidden rows, missing legacy release joins, stable joined projections, and separate My Ology summary semantics.

## Automated validation

TypeScript passed with zero errors. The permanent focused My Ology, release, and purchase suite passed **71 tests across four files**. The complete platform suite passed **2,777 tests**, with **23 skipped**, across **158 test files**. The production build completed successfully in **20.53 seconds**. Repository hygiene checks found no whitespace errors, conflict markers, temporary real-account validators, payment-schema changes, or secret exposure.

## Playback follow-up

After checkpoint `f3475db2` was published, the owner confirmed that My Ology displayed the correct **2 release purchases** and **1 music-library item**, but selecting the song produced **“Could not load track.”** Production logs showed the stream, download, and preview paths still used the full `getReleaseById` projection and failed on the same optional disclosure-column runtime drift that had previously hidden the counts.

Customer media delivery now uses a dedicated stable projection containing only the release ID, title, status, audio key, preview key, and format. The protected stream route retains its purchase-owner ID/email check. Downloads retain the five-download limit and increment only after a signed URL is successfully created. Public previews still require a published release.

A narrow, idempotent runtime guard adds only the five already-defined optional AI disclosure columns to legacy `artist_releases` tables. It never updates release or purchase rows, caches successful completion per process, and resets after a DDL failure so a later request can retry safely.

A one-use read-only validation loaded the actual owner account, confirmed **2 purchases** and **1 unique library item**, requested the real protected stream URL, and successfully read media bytes with HTTP 200/206 behavior. A different existing user was denied with `FORBIDDEN`. The validation file was removed immediately afterward. The permanent focused playback and release set passes **100 tests across six files**.

The final complete platform suite passed **2,779 tests**, with **23 skipped**, across **159 test files**. TypeScript passed with zero errors, and the production build completed successfully in **19.81 seconds**. The final hygiene audit found no whitespace errors, conflict markers, temporary validators, schema migration changes, payment or purchase mutations, or exposed secrets.

## Stream versus download allowance

The owner’s first successful live playback revealed that `MyMusic.playTrack` still called the counted `/api/release/download/:purchaseId` endpoint. Production logged that listening request as a download. This was a client transport bug: the protected `release.getStreamUrl` procedure already existed specifically for listening and does not update `downloadCount`.

The player now requests `utils.release.getStreamUrl.fetch({ purchaseId })` and shows actionable refresh/connection guidance if stream loading fails. Explicit **Download** actions continue to call `/api/release/download/:purchaseId`, so the five-download limit remains enforceable only for files downloaded to a device.

A one-use real-account validation called the protected stream procedure twice for the owner’s unique library item, read media bytes successfully, and proved that `downloadCount` was identical before and after both listens. The validator was removed. The permanent focused set passes **101 tests across six files**. The complete platform suite passes **2,780 tests**, with **23 skipped**, across **159 test files**; TypeScript and the **18.40-second** production build also pass.

## Final production verification

Checkpoint `92186039` was published on September 4, 2026. The owner played the live song twice successfully. Production recorded successful `release.getStreamUrl` calls for user 7 at 02:13:00 UTC and 02:17:35 UTC. No new `[Release Download]` request or release error accompanied either play, confirming that listening now uses only the protected stream path and does not consume another explicit-download allowance.
