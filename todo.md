
## STATIC IMAGE AUDIT — 2026-11-12
- [x] Audited frontend image references. The three homepage category images and the CRM badge were the active inline assets using fragile storage paths; homepage category images were already localized and the Browse CRM filter badge now uses the bundled badge asset.
- [x] Confirmed dynamic artist, venue, release, merch and portfolio media should remain storage-backed because they are user-uploaded or database-driven.
- [x] Confirmed the remaining storage reference is the social OG image, which is metadata-only rather than an in-page mobile asset; the old venue demo paths are in an unused mock detail component, not the active `/venues/:id` route.
- [x] Validation passed: CRM badge plus homepage tests (7 total), TypeScript, and production build. Existing large-chunk warnings remain only.

## SOCIAL OG IMAGE MIGRATION — 2026-11-12
- [x] Migrated the default Open Graph and Twitter/X image from the legacy `f734dc76` storage URL to the permanent versioned asset `ologywood-platform-og-2026-10-10_b5a657bf.png` across client SEO, server crawler metadata, OG routes/proxy, and the static HTML fallback.
- [x] Updated the homepage sharing documentation and confirmed the new asset responds with HTTP 200 as a 1200 × 630 PNG.
- [x] Final validation passed: 190 focused metadata/sharing tests, TypeScript, production build, `git diff --check`, and repository scan confirming the old social-card URL is absent. Existing large-chunk warnings remain only.

## SEO INITIAL HTML AND SITEMAP — 2026-11-15
- [x] Added server-rendered, route-specific title, description, canonical, Open Graph, Twitter, and applicable breadcrumb/Organization/WebSite JSON-LD metadata for public landing pages before React hydration.
- [x] Added early `noindex, nofollow` metadata for private/account routes, including the intentionally blocked media-kit route, so crawlers do not rely on client-side JavaScript to receive indexation rules.
- [x] Added `/edu` to the public sitemap and corrected dynamic event sitemap URLs to use the numeric IDs consumed by `/events/:id`; legacy `/privacy` and `/terms` now resolve to canonical metadata for their official routes.
- [x] Validation passed: 277 focused SEO/sitemap tests, TypeScript, production build, `git diff --check`, and preview smoke checks for public metadata, private noindex, and sitemap inclusion. Existing large JavaScript-chunk warnings remain and should be handled in the next performance pass.

## PERFORMANCE BUNDLE AND LOADING AUDIT — 2026-11-15
- [x] Limited the Manus preview/editor runtime to Vite serve mode so production HTML no longer embeds the preview payload.
- [x] Deferred the homepage route with `React.lazy()` and confirmed route-specific dashboard/profile/PDF chunks remain off the homepage initial path.
- [x] Production build comparison: HTML shell 371,981 → 5,169 bytes; main application chunk 644,700 → 575,499 bytes; homepage deferred to a 47,834-byte chunk.
- [x] Measured the published baseline at `https://www.ologywood.com/`: desktop TTFB 1,564 ms / FCP 4,736 ms / LCP 4,780 ms; mobile TTFB 745 ms / FCP 1,264 ms / LCP 1,264 ms. Repeat curl TTFB was 2.116–2.734 s from the sandbox network location.
- [x] Optimized local production build measured 4 ms TTFB / 588 ms FCP / 888 ms LCP desktop and 2 ms TTFB / 144 ms FCP / 472 ms LCP mobile; hosted post-publish measurement remains required.
- [x] Added `server/performanceOptimization.test.ts`; 101 focused tests, TypeScript, production build, diff check, preview restart, and LSP validation passed. Full suite recorded 4,431 passed, 26 skipped, and one unrelated pre-existing `server/releaseSectionLayout.test.ts` assertion failure.
- [x] Published checkpoint `2175e796`, verified both live domains serve the optimized shell, and repeated desktop/mobile Chrome measurements; final results are recorded in `docs/performance-audit-2026-11-15.md`.

## FOLLOW-UP DASHBOARD CHUNK AND HOMEPAGE LOADING PASS — 2026-11-15
- [x] Fixed the stale `releaseSectionLayout.test.ts` assertion to verify the current responsive ProfileJourneyActions grid contract.
- [x] Deferred artist dashboard analytics, revenue, and booking-calendar panels behind lazy imports and Suspense placeholders; reduced the ArtistDashboardV3 route chunk from 247,971 to 233,180 bytes.
- [x] Deferred venue dashboard analytics, booking funnel, and calendar panels behind lazy imports and Suspense placeholders; reduced the VenueDashboard route chunk from 192,326 to 142,075 bytes.
- [x] Added an accessible OlogyWood-branded animated homepage skeleton for the lazy-loaded Home route, with `aria-busy`, accessible labeling, and regression coverage.
- [x] Updated the venue feature regression for the intentional lazy VenueCalendar import.
- [x] Validation passed: 100 focused tests, TypeScript, production build, `git diff --check`, and full suite with 367 test files passed, 4,434 tests passed, and 26 skipped.
