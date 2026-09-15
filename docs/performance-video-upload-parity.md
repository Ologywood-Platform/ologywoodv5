# Performance Video Upload Parity

## Scope

The Artist Dashboard **Performance Video** section now offers the same simple source choices as **Video Portfolio** while remaining a separate single main-video feature. No booking, profile, portfolio-catalog, payment, or unrelated dashboard behavior was changed.

| Creator choice | Behavior |
|---|---|
| Paste URL | Accepts and normalizes supported YouTube, Vimeo, or direct MP4, MOV, and WebM links |
| Upload File | Accepts MP4, MOV, WebM, AVI, and MKV through authenticated 4 MiB chunks |

## Preserved Performance Video policy

The existing **Video Guidelines** approval dialog remains the gate before either source choice. Its Allowed Content, Prohibited Content, Community Policy, **five-minute maximum**, and **500 MB maximum** remain intact. The format line now includes AVI and MKV because those are available through the reused secure conversion path.

Videos continue to go live immediately and remain reportable by the community. Existing flagged, rejected, and taken-down status messaging and the existing Remove/Replace controls remain in place.

## Secure upload behavior

File uploads now use a separate Performance Video session contract built on the proven Video Portfolio protections. Each session is signed, expires after 15 minutes, and is bound to the authenticated artist user and profile. Every chunk index and byte length is verified before owner-scoped storage. Final assembly validates the actual media container before the profile is updated, and replayed finalization is rejected for both local proxy and deployed CloudFront URLs.

Browser-compatible MOV files are safely relabeled for browser metadata and thumbnail capture without changing their bytes. MOV files the browser cannot read, plus AVI and MKV files, use the existing bounded FFmpeg/FFprobe conversion path to produce browser-ready H.264/AAC MP4 and a 1200×630 JPEG thumbnail. Video Portfolio retains its existing two-minute and 100 MB policy; Performance Video uses a separate five-minute and 500 MB conversion policy.

Starter, Professional, and Enterprise subscriptions can use Performance Video. Free-tier and unauthenticated requests remain blocked.

## Public playback

Direct uploaded media continues to render in the existing inline video player with poster, preload, sharing, and reporting behavior. Supported YouTube and Vimeo Performance Video URLs now render as embeds in the same public profile section. The separate short-form Video Portfolio upload, thumbnail, sharing, capacity, and playback systems are unchanged.

## Validation

The actual component was inspected at 390-pixel mobile and desktop widths through a temporary development-only preview. The preserved guidelines, Paste URL state, Upload File state, action order, supported-format guidance, and responsive containment were confirmed. The preview route and props were removed, and onboarding plus Terms consent defaults were restored before validation.

The focused Performance Video and Video Portfolio set passed **59 tests across nine files**. It covers format and duration validation, signed-session expiry, exact chunks, owner binding, replay rejection, free-tier and authentication boundaries, conversion, thumbnail generation, URL normalization, CSP, sharing, public playback, and existing portfolio behavior. The complete platform suite passed **2,791 tests**, with **23 skipped**, across **162 test files**. TypeScript passed with zero errors, and the production build completed successfully in **18.09 seconds**.

No real artist video, profile, portfolio item, subscription, report, or moderation record was created, changed, or deleted during validation.

## Production verification

Checkpoint `800eb260` was published. The owner confirmed that the live Artist Dashboard Performance Video section displays both **Paste URL** and **Upload File** behind the preserved Video Guidelines step. Production logged successful authenticated `artist.getPerformanceVideoStatus` requests for user 7 with no Performance Video error. No test upload or replacement was performed.
