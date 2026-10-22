# Video Portfolio title editing and ordering

**Date:** October 22, 2026  
**Status:** Implemented and validated; production publication is pending.

## What talent can do

In **Artist Dashboard → Video Portfolio**, choose **Edit title** beside a saved clip, correct its title, and choose **Save title**. A new upload is not required. Titles are trimmed and limited to 255 characters; blank titles cannot be saved.

Choose **Reorder videos** to arrange the public portfolio. Desktop users can drag the grip handle. Phone and keyboard users can use **Move Up** and **Move Down**. **Save Order** applies the arrangement; **Cancel** discards unsaved moves. The static **How this works** guide links to the expanded Help article at `/help?article=video-portfolio-manage-guide`. Deterministic assistant guidance explains the same controls.

Errors retain the title or order draft. Reloading a changed draft requires confirmation before discarding it. Dialogs prevent closing or submitting twice during a save. Preparing clips can be arranged, but continue through the existing processing workflow before public playback. Removed clips cannot be edited or included in an order.

## Scope and safety

Only an authenticated account that actually owns the creator profile can use the new management APIs. Generic administrator status does not confer another creator's access. Non-owner team memberships and legacy standalone team-member profiles are denied. The UI waits for a fresh owner context, hides cached controls after permission errors, and keys the private owner list by the current account; the server rejects an account input that differs from the session.

Title saves update only `title`. Order saves update only `sortOrder`. Neither operation replaces files or changes thumbnails, categories, duration, visibility, moderation status, playback pages, or existing ID-based share links. Existing upload/conversion limits, removal behavior, viewer reporting, fees, payments, plan behavior, and six primary navigation destinations remain unchanged. This feature adds no pre-screening and does not restore moderated clips.

Writes use one pooled connection with READ COMMITTED transactions and user → profile → membership → video locks. Title edits compare the frozen expected title. Ordering validates a frozen SHA-256 snapshot and the exact current nonremoved ID set. Video locks and updates are deterministic; exceptions roll back. Unchanged rows are not rewritten, avoiding driver-dependent affected-row conflicts. A confirmed reread includes concurrently committed new clips without renumbering or removing them. Existing upload and moderation writers are not represented as sharing the new owner-lock protocol.

## Database and compatibility

The existing `video_portfolio` title and sort fields are reused. **No new schema, migration, or backfill was needed.** Managed and actual-runtime schema metadata were checked without reading private video content. Existing owner/public lists retain their filters and now use the stable tie-breaker `sortOrder ASC, createdAt DESC, id DESC`.

## Exact validation

| Check | Result |
| --- | --- |
| Focused management/upload/playback/share regressions | 76 passed across 10 files; zero failed |
| Full platform suite | 3,604 passed; 23 existing skipped; zero failed (3,627 total across 236 files) |
| TypeScript | Passed |
| Production build | Passed; Vite build 18.22 seconds |
| Scoped diff/credential/conflict/artifact hygiene | Passed |
| Anonymous context, management state, and account-bound owner list | HTTP 401 |

Fully intercepted browser workflows passed at **320×620, 390×900, and 1440×900**: source-error retry, retained title/order conflict drafts, confirmed reload acceptance and cancellation, title saves, explicit order saves and Cancel, actual desktop dragging, keyboard movement, pending-save Escape protection and double-submit prevention, guide/expanded Help navigation, preparing-clip status preservation, and denied-context suppression without management-state reads. There were zero page errors, horizontal overflows, or real API mutations. Final mobile title and reorder views were visually inspected.

All new write tests used mocks or synthetic intercepted responses. **No real creator, video, profile, moderation, payment, or permission records were changed during validation.** No actual video was uploaded, replaced, removed, played, or shared to an external platform. Disposable verification scripts and screenshots are removed before checkpointing.

## Publication handoff

Publish the latest validated checkpoint, then verify the deployed controls and Help non-mutatively. Authenticated production editing or rearrangement is not asserted by local/mocked validation; the creator can perform their real correction after publication. External social-preview caches may need a recrawl after a title change, but existing share links continue to identify the same clip.
