# Clean-Slug OG Sharing Fix — 2026-11-08

## Problem

The public artist and venue pages use clean URLs such as `/artist/adonis` and `/venue/the-velvet-room-jazz-lounge`, but the social-preview endpoint only extracted numeric IDs or IDs appended to a slug. A crawler request to `/api/og-page/artist/adonis` therefore returned HTTP 400 with an instruction to use the obsolete `artist-name-ID` format.

## Fix

`server/routes/ogPage.ts` now supports three artist/venue profile-preview forms:

- clean display-name slug (`/api/og-page/artist/adonis`),
- slug plus numeric ID for backward-compatible share links, and
- numeric ID for legacy callers.

For name-only slugs, the route performs a read-only lookup of profile IDs and compares the normalized display name with the requested slug. Once resolved, it generates entity-specific metadata and uses the clean public profile URL as both the canonical URL and `og:url`. Unknown slugs return a safe JSON 404 instead of a misleading format error. Venue behavior follows the same contract.

The same name-only resolution now covers public events, matching the existing slug-aware `EventDetail` route. Private or unknown event slugs return a safe 404, while numeric and slug-ID event links remain compatible.

## Verification

- Preview Facebook-crawler request for the clean artist slug: HTTP 200, entity title `Adonis | Book on Ologywood`, clean canonical and `og:url`.
- Preview Facebook-crawler request for the clean venue slug: HTTP 200, entity title `The Velvet Room Jazz Lounge | Ologywood`, clean canonical and `og:url`.
- Unknown artist and venue slugs: safe HTTP 404 JSON responses.
- Preview Facebook-crawler request for a real public event name-only slug: HTTP 200, event-specific title, and clean `/events/<slug>` canonical and `og:url`.
- Public event name-only slugs use the same clean canonical/`og:url` contract; private/unknown event slugs are not exposed.
- Focused OG, metadata, social-sharing, homepage-sharing, and image tests: 144 passed.
- TypeScript check and production build: passed.
- No production records, payments, shares, or user data were changed.

## Publication boundary

The production custom domain still served the pre-fix 400 response during this session because the new code is only in the preview checkpoint. Publish the checkpoint, then re-run the three crawler requests and refresh Facebook/Messenger debuggers if their caches retain the old response. Do not treat preview validation as production verification.
