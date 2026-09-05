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
