# Video Portfolio Blocked Content Repair

## Root cause

The deployed Content Security Policy allowed Stripe frames only:

`frame-src 'self' https://js.stripe.com https://hooks.stripe.com`

Video Portfolio correctly converted saved YouTube and Vimeo links to their official embed players, but the browser was required to block those iframes because `www.youtube.com`, `www.youtube-nocookie.com`, and `player.vimeo.com` were absent from `frame-src`. This produced the user-facing **“This content is blocked. Contact the site owner to fix the issue.”** message. The uploaded CloudFront MP4 path was not affected.

## Scope and repair

The repair adds only the official YouTube and Vimeo child-frame origins to `frame-src`. It does not add wildcards, permit insecure HTTP frames, broaden scripts or media, or change `frame-ancestors`. OlogyWood therefore keeps its existing clickjacking, script, object, form, and transport protections.

The active catalog contained one direct CloudFront MP4 for Adonis and five YouTube clips for Tenguu Vision. Source checks confirmed the MP4 returns partial video bytes with `video/mp4`, while every official YouTube embed endpoint returns HTTP 200.

## Browser verification

The corrected development response emits the narrow frame allowlist. Tenguu Vision’s first YouTube portfolio card opened in the embedded player without a Content Security Policy violation or the OlogyWood blocked-content message. The automated sandbox received YouTube’s separate “Sign in to confirm you’re not a bot” interstitial, which is a YouTube automation safeguard rather than an OlogyWood frame block; a normal viewer’s YouTube session determines whether that provider interstitial appears.

A full-page 390 × 844 mobile capture confirmed the five Tenguu Vision Video Portfolio cards remain visible in a compact two-column grid with readable labels and centered play controls. The profile, Connect section, calendar, events, portfolio, reviews, and footer continue to stack without horizontal overflow or creator-data changes.
