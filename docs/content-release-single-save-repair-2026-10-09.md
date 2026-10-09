# Content Release Single and Save Repair

Date: October 9, 2026

## Reported issue

A creator attempted to publish one externally hosted song from `/content-releases`, had to select Other because Single was absent, and received a raw failed INSERT query instead of a usable save result.

## Audit findings

- The Content Release option catalog did not include `single`. Public labels and music icons also lacked that type.
- The managed database had the declared `releases` table and all five optional AI-disclosure columns. Its release and purchase counts were both zero.
- A separate read-only runtime database inspection returned `Table 'ologywood.releases' doesn't exist`. The runtime did not have parity with existing release migrations. The published public release listing also returned an internal failed-query error before publication of this repair.
- The Content Release router had no runtime compatibility guard, unlike other established platform modules. Full-table selects and INSERTs depend on the release table plus optional AI metadata.
- The form rendered raw server messages. Errors left entries in memory, but there was no durable inline retry explanation. The list could show a false empty state after a failed load.
- Behavioral tests uncovered a separate partial-update defect: Zod create defaults were applied during a type-only edit, resetting access, publication, and extras. The update contract now omits these defaults.

## Implementation

1. **Single support:** one shared catalog supplies the API, form fallback, creator list label, and public card label. Single uses the existing string-valued type column, so no new type migration or conversion of existing Other releases is needed.
2. **Narrow runtime repair:** `ensureContentReleaseSchema` restores only tables already declared in migration 0102 and the five optional AI columns already declared in migration 0111. Missing tables use `CREATE TABLE IF NOT EXISTS`; existing tables use explicit column inspection before `ADD COLUMN`. The guard is shared by every database-backed Content Release procedure.
3. **No destructive schema/data work:** no DROP, rename, broad migration replay, or release/purchase/user/payment row mutation. Existing table creation is a no-op. Readiness is cached per database object, concurrent calls share one check, failed checks can retry, and only duplicate-column races are tolerated.
4. **Safe error handling:** a release-only API boundary replaces internal diagnostics with a safe message. Logging records operation and error code, not SQL or creator input. Authorization, not-found, plan-limit, and other expected application errors remain intact. The form also filters legacy raw SQL errors, keeps entries on failure, shows an inline alert, and remains editable/retryable.
5. **Preserved partial edits:** changing an existing release from Other to Single does not silently reset publication/access/extras. An owner can explicitly change those fields through the existing form. Another owner's release remains unavailable for modification.
6. **Form improvements:** shared Single fallback, bounded title/genre/duration inputs, correct post-update return to the list, and explicit loading-error retry instead of a false empty collection.
7. **Support guidance:** contextual Single instructions, an accessible Help article, updated supported-type guidance, and deterministic AI assistance distinguish externally hosted singles from uploaded/downloadable Music Releases.

## Validation

- **37 focused tests passed** across the new schema/save tests and existing AI disclosure/navigation regressions.
- **2,854 full-suite tests passed; 23 skipped; zero failures.**
- TypeScript: `pnpm check` passed.
- Production build: `pnpm build` passed on the exact final code state (16.72 seconds).
- `git diff --check` and exact conflict-marker checks passed.
- The runtime guard was executed twice against the development runtime database. The complete 32-column release projection succeeded, with zero release rows and zero purchase rows afterward. No creator release was inserted or changed.
- Development public artist release reads now return HTTP 200 with an empty collection instead of a query error.
- Isolated Playwright checks passed at **1280×900** and **390×844**: select Single, fill a draft, receive two simulated database save failures, retain title/link/type/price, avoid raw SQL text, and succeed on a third simulated attempt. Every browser API request was intercepted; no real account, release, purchase, or publication mutation occurred. Both layouts remained within viewport width.
- No real song was published, no original failed submission was reconstructed, and no real payment was initiated. All platform fee percentages and existing Music Release behavior remain unchanged.

## Rollout boundary

The development/runtime repair is validated. Production was still serving the older application during this task's pre-publication probe and continued to fail its public release listing. Publish the new checkpoint, then verify the live options endpoint contains Single, the public release listing no longer reports a database error, and the Help/AI guidance reflects the new type.

The creator should then retry their own submission using **Single**. Do not silently create or publish the creator's song during verification. An authenticated real save is the creator's action; mocked save tests and non-mutating runtime queries are the validation evidence recorded here.
