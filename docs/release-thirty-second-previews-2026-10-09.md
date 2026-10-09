# Thirty-second release previews

## Completed implementation — October 9, 2026

Release previews now work across both existing release systems, without changing prices, fees, subscriptions, purchases or creator release records during validation.

### Uploaded Music Releases

- The public preview route returns a **separate encoded audio clip**, never a signed URL for the full song.
- Existing uploaded songs generate their sample on the first preview request; subsequent requests reuse the stored clip. No creator re-upload or release-row rewrite is required.
- Existing dedicated preview sources are also normalized and clipped before public delivery.
- Playback and seeking are capped at thirty seconds on the client as an additional safeguard.
- Public music metadata no longer exposes full audio keys or signed source URLs. Owner editing and purchase-authorized streaming/download routes remain separate and intact.
- The first uncached request can take longer while the clip is prepared. Conversion failures are retryable and do not fall back to exposing the full song.

### Externally hosted Content Releases

In **Content Releases → New Release / Edit Release → 30-Second Preview**, creators can upload a public audio or video sample.

Supported formats: **MP3, WAV, FLAC, AAC, M4A, MP4, MOV and WebM**. Maximum input: **20 MB and five minutes**. The server keeps the first thirty seconds, or the full sample if shorter. Uploading prepares a separate clip; saving the release explicitly attaches it. Replacement and removal likewise take effect only when saved. Cancelling or a failed upload does not modify the existing release.

Published cards show **Preview (0:30)** independently of the purchase button. Preview delivery is requested only when clicked. Native audio/video controls provide capped playback, clear/retry states and no autoplay. The creator's full-source action is clearly labelled **Open full release** rather than being confused with a sample.

**Existing hosted releases are not removed or prevented from publishing.** They show **Preview not added yet** until the creator supplies a sample. OlogyWood cannot manufacture a safe preview from an arbitrary private YouTube, Spotify or other hosting link; the creator must upload the sample. Preview support is available for every release category, but an existing hosted release does not automatically gain a sample.

## Access and processing boundaries

- Authenticated creator profile and owner checks precede upload. Existing plan limits remain in effect.
- Six preview uploads per minute per account and one active media conversion per process bound work.
- File bytes, container, readable media streams, dimensions, input duration and output size/duration are validated; MIME declarations alone are not trusted.
- FFmpeg runs without a shell, with restricted demuxers and local-only protocols, bounded output/time, one encoding thread and metadata removal. Text playlists are rejected. Temporary local source files are removed.
- Only the newly clipped bytes are stored for hosted samples. Paid external content URLs are never passed to FFmpeg or the public preview player.
- Signed, owner-bound preview references cannot be forged or attached by a different account. Public listing responses expose only preview availability, not the signed reference.
- Published previews are public. Draft previews are retrievable only by their creator through the authenticated endpoint.
- A sample grants no paid entitlement and consumes no counted download. Purchase/refund guards and owner complimentary access are unchanged.

## Schema

Reviewed migration `0115_nifty_madame_masque.sql` adds only nullable `releases.previewMedia`. The existing narrow MySQL/TiDB runtime guard inspects this column and adds it only if missing. No destructive DDL or release/receipt row writes were used.

Managed schema migration succeeded. Runtime verification confirmed the column was available and the four existing runtime releases and zero hosted receipts had unchanged counts. Counts are point-in-time verification evidence, not a statement that no later user changes can occur.

## Validation evidence

- **88 focused tests** passed, covering real synthetic FFmpeg conversion, malicious/fake input rejection, size/duration limits, token tampering and owner binding, public/draft authorization, partial-update preservation, public audio redaction and existing release/AI/cover compatibility.
- **3,022 full-platform tests passed**, with **23 skipped** and no failures.
- TypeScript passed; production build passed (**16.42 seconds**); diff and changed-file credential/conflict-marker checks passed.
- Isolated browser tests at **1280 px and 390 px** verified safe failure feedback, retry of the same upload, a thirty-second seek clamp, explicit save attachment, on-demand public preview requests, clear-preview and preserved purchase buttons. Every API call was intercepted, so the tests could not write a real account, release or payment.
- Real storage smoke tests used synthetic tones only: a clipped sample returned HTTP 200 and matching bytes; a first-request generated music preview returned HTTP 200 with about 30.04 seconds including MP3 encoder padding, and a repeat request reused the clip. The playable sample is capped at thirty seconds. Synthetic storage validation objects are unreferenced by any creator record; local sources and one-use scripts were removed.
- No real song, hosted release, purchase, subscription or account record was created, replaced, deleted or charged during validation.

## Publication handoff

Save and publish the completed checkpoint before treating the feature as live. Then verify the live Music Release preview control and the owner Content Release preview uploader without changing real content unless the creator intends to save it. Hosted samples must be added by their creator; there is no automatic extraction from private hosting links.
