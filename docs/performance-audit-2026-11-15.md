# OlogyWood Performance Audit — 2026-11-15

## Scope

Measured the published homepage at `https://www.ologywood.com/` with Chrome DevTools Protocol using desktop (1280 × 900, DPR 1) and mobile (390 × 844, DPR 2) emulation. The local optimized production build was measured at `http://127.0.0.1:4010/` through the same forwarded-HTTPS path.

## Published baseline

The published build was still the pre-optimization build during this audit.

| Profile | TTFB | FCP | LCP | LCP element | HTML encoded/body observation |
|---|---:|---:|---:|---|---:|
| Desktop | 1,564 ms | 4,736 ms | 4,780 ms | Hero image (`ologywood-cinematic-hero-1280.webp`) | 106,128 bytes in Chrome; 372,170 bytes from the uncompressed curl response |
| Mobile | 745 ms | 1,264 ms | 1,264 ms | Hero image (`ologywood-cinematic-hero-1280.webp`) | 372,170 bytes from the navigation entry |

Repeated curl requests to the published homepage measured 2.116–2.734 seconds TTFB and 3.614–4.318 seconds total time from the sandbox network location. The response was gzip-compressed when `Accept-Encoding: gzip, br` was supplied, but the HTML shell itself was unnecessarily large.

## Implemented optimizations

1. The Manus preview/editor runtime is now limited to Vite `serve` mode. Production builds no longer embed the preview runtime and its large inline payload in every HTML response.
2. The homepage is now loaded with `React.lazy()` as `Home-*.js`, keeping the application shell smaller while preserving the same route and UI.
3. Added regression coverage in `server/performanceOptimization.test.ts` for both safeguards.

## Build comparison

| Artifact | Before | After |
|---|---:|---:|
| Production `dist/public/index.html` | 371,981 bytes | 5,169 bytes |
| Main application chunk | 644,700 bytes | 575,499 bytes |
| Deferred homepage chunk | bundled in main | 47,834 bytes (`Home-CR84IW-z.js`) |
| Preview runtime in production HTML | present | absent |

The PDF chunk remains approximately 983 KB, but it is already a deferred `vendor-pdf` chunk used for PDF export and is not part of the homepage initial request. Other large dashboard, chart, schedule, and profile chunks are route-specific lazy chunks and remain off the public homepage critical path.

## Local optimized build measurement

The optimized production build served locally measured:

| Profile | TTFB | FCP | LCP | LCP element | HTML body |
|---|---:|---:|---:|---|---:|
| Desktop | 4 ms | 588 ms | 888 ms | Hero image | 5,169 bytes |
| Mobile | 2 ms | 144 ms | 472 ms | Hero image | 5,169 bytes |

These local values are not a production guarantee because they remove the hosted network and cold-start path. They validate that the optimized server/build no longer spends response time transferring or parsing the preview runtime payload.

## Validation

- 101 focused performance/app/SEO/sitemap tests passed.
- TypeScript validation passed.
- Production build passed.
- `git diff --check` passed.
- Preview restarted successfully with no language-service or TypeScript errors.
- Full suite result: 4,431 passed, 26 skipped, and 1 unrelated pre-existing failure in `server/releaseSectionLayout.test.ts`; the failing assertion expects an older ProfileJourneyActions grid class and is not touched by this performance work.

## Follow-up

After publishing this checkpoint, re-run the same desktop/mobile measurement on `https://www.ologywood.com/`. The expected production improvement is primarily a much smaller HTML response and lower main-thread parsing; the hosted LCP should then be compared against the 4,780 ms desktop and 1,264 ms mobile baseline above.
