# Portfolio photo viewer and compact profile sections

**Status:** Implemented and validated locally on October 24, 2026 UTC. The new checkpoint must be published before these controls are claimed as live production behavior.

## What changed

Portfolio thumbnails on public talent profiles now open a dark, responsive photo viewer. It displays the original stored image URL with `object-contain`, preserving the full image rather than cropping it. Previous/Next buttons and left/right arrow keys move through loaded photos. Escape, the close button and the backdrop close the viewer and restore thumbnail focus. Navigation stops at the first/last loaded photo. Failed image loads show an explicit retry control without changing the original URL. The viewer fits short phones and wider desktop displays, wraps captions, and sits above the existing Terms notice.

Uploaded Music Releases initially show three songs. Video Portfolio initially shows six clips. Longer lists have reversible **Show all** and **Show less** buttons. They keep the creator's saved order, original IDs, existing player components and purchase/share controls. The full music list remains available to the existing structured metadata. Extra music cards unmount when collapsed; their existing audio cleanup stops playback. A narrow abort/mounted guard also prevents a delayed preview response from starting audio after its card has disappeared. The first three cards remain mounted when expanding/collapsing.

The controls reset when navigating to another talent profile. A selected photo that disappears after refresh is cleared rather than reopening unexpectedly after a retry. Existing hosted Content Releases, the full Portfolio page, uploads, video processing/moderation, purchases, fan playlists, fees, plans, signatures and primary navigation are unchanged.

## Missing fifth photo: confirmed cause

The prior profile called `events.getRecentPhotos` with an explicit **limit of four**, and the existing database helper honored it. The fifth photo was not deleted.

The profile now uses a bounded `events.getPortfolioPhotos` infinite query: 12 photos per page, at most 24 per API request, descending photo-ID keyset pagination and a total count independent of cursor. Every matching history entry for the selected artist is joined; overlapping pages are deduplicated by stored photo ID. Additional images are reachable through **Load more photos**. Initial and subsequent-page errors have distinct retry controls, without pretending an outage is an empty gallery.

The real tRPC v11 client adds `direction: "forward"`. A non-mocked development check exposed its rejection by the initial strict input contract. The finalized API explicitly accepts that forward field while continuing to reject unsupported directions and unknown fields. Permanent tests cover both first/subsequent requests and invalid inputs.

The photo service performs reads only and matches the existing public profile lookup boundary. No schema migration, image upload, deletion, reordering or data backfill was required.

## Exact validation

| Check | Result |
|---|---|
| Focused profile/photo/music/video regressions | 111 passed across 11 files; zero failed |
| Full platform suite | 3,719 passed; 23 existing skipped; zero failed; 3,742 total across 250 files |
| TypeScript | Passed |
| Production build under Node.js 22.23.4 | Passed; 18.31 seconds |
| Changed-file credential/conflict/diff hygiene | Passed |
| Intercepted browser workflows | Passed at 320×620, 390×900 and 1440×900 |

Browser workflows cover all five thumbnails, uncropped portrait images, wide desktop sizing, keyboard/buttons/boundaries, backdrop/Escape/close and focus restoration, Show all/Show less, first-page and pagination failures/retries, stopping collapsed previews and aborting late preview responses. No page errors, horizontal overflow or real API mutations occurred in these synthetic workflows.

**Actual Adonis development data, read-only:** artist profile 11 returned five stored photos; stats/page/total all agreed on five and there was no remaining cursor. All five original references returned HTTP 200 with image MIME types. The real profile subsequently displayed five loaded thumbnails and opened its fifth original at 2000×1116 using `object-contain`. Music expanded from three to nine cards and collapsed again. At the inspected development browser viewport, collapsed height was 7,684 px versus 11,953 px with the music list expanded—a 4,269 px reduction. The real profile had six videos, so it correctly needed no extra-video toggle; nine-video expansion was exercised synthetically.

These real-data checks were reads/view-only interactions. No creator, photo, video, release, payment, permission or other application record was modified; no real playback, purchase or upload was initiated.

## Help and publication

Help includes `profile-photos-and-sections`, and deterministic assistant guidance explains the viewing controls separately from creator edit/reorder tools.

Publish the validated checkpoint, then verify the public Adonis profile's five thumbnails, viewer and compact lists without creating or changing content. Production behavior remains unconfirmed until that publication check. Previous upload/security tasks remain closed and are not part of this release.
