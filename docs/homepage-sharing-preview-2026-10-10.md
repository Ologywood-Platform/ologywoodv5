# Homepage-aligned platform sharing preview

## Completed update

The platform's default sharing preview now matches the cinematic homepage design and headline:

> Your Talent. Your Platform. Your Next Opportunity.

The Open Graph and Twitter/X description starts with the homepage's discovery, opportunity, audience and earning message while retaining OlogyWood's creator-owned audience and external-hosting positioning.

A new branded promotional image includes musician, athlete and filmmaker imagery, the brand mark, headline and `ologywood.com`. The image uses fictional promotional subjects, not registered profile data. The full image was resized with containment to **1200 × 630 PNG**, preserving all text and artwork.

- Local image: `/home/ubuntu/webdev-static-assets/ologywood-platform-og-2026-10-10.png`
- Versioned public image: https://www.ologywood.com/manus-storage/ologywood-platform-og-2026-10-10_f734dc76.png
- Verified response: HTTP 200, `image/png`, 1,213,479 bytes, 1200 × 630 pixels.

## Metadata coverage

Updated the static HTML fallback, homepage client SEO preset, alternate meta hook, main crawler middleware, legacy home sharing endpoint and global fallback image references in the SPA server and image proxy. Static and main crawler responses include large-image cards, secure image metadata, descriptive alt text and the existing canonical homepage.

**Entity-specific sharing remains intact.** Artist/venue profile photos, event artwork, merchandise photos, portfolio-video thumbnails and Sandbox Post imagery continue using their existing routing and overrides. Only their generic missing-image fallback changed. No homepage layout, navigation, fees, billing, entitlements, privacy gates, schema or creator records were changed.

## Verification

- 10 new behavioral/source regressions cover six crawler families, regular-browser pass-through, consistent global defaults and artist/venue-specific overrides.
- 182 focused tests passed across four files.
- Complete suite: **3,090 passed, 23 skipped, zero failures**.
- TypeScript, production build and `git diff --check` passed.
- Scoped credential/conflict-marker review passed; no media was placed inside the source repository.
- Local HTTP 200 checks confirmed the new title/image for Facebook and LinkedIn crawler requests, ordinary HTML and legacy home sharing.
- Local real-profile checks confirmed Adonis retains `/api/og-image/artist/11` and The Velvet Room Jazz Lounge retains `/api/og-image/venue/3`, with their own titles and alt text.
- The new artwork is already publicly retrievable; the published homepage metadata still points to the old preview until this checkpoint is published.

## Publication and social cache follow-up

Publish the sharing checkpoint, then verify the live homepage's crawler-visible title, description, Open Graph image and Twitter/X image. Existing social posts or conversations may retain platform-specific caches. The distinct image URL avoids reusing the old image cache, but it does not force every service to recrawl an already shared page immediately.

If Facebook still shows the old card after publication, use https://developers.facebook.com/tools/debug/ for `https://www.ologywood.com/` and choose **Scrape Again**. For LinkedIn use https://www.linkedin.com/post-inspector/. No immediate refresh of old posts or third-party caches is guaranteed.
