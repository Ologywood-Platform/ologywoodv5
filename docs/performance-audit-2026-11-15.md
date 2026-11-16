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

- 101 focused performance/app/SEO/sitemap tests passed before the follow-up dashboard split; the follow-up focused set passed 100/100.
- TypeScript validation passed.
- Production build passed.
- `git diff --check` passed.
- Preview restarted successfully with no language-service or TypeScript errors.
- Full suite result after the follow-up fixes: 4,434 passed, 26 skipped across 367 passing test files and 2 skipped files.

## Final live verification after publishing

Both `https://www.ologywood.com/` and `https://ologywood-mp6flm6c.manus.space/` now serve the optimized shell. The live response is approximately 5.3 KB, contains no `manus-runtime` or `__MANUS_HOST_DEV__` preview payload, and has the new publication timestamp.

| Profile | TTFB | FCP | LCP | LCP element | HTML encoded/body observation |
|---|---:|---:|---:|---|---:|
| Desktop repeat | 661 ms | 4,448 ms | 5,004 ms | Hero image (`ologywood-cinematic-hero-1280.webp`) | 1,659 encoded bytes in Chrome |
| Mobile | 396 ms | 668 ms | 1,004 ms | Hero image (`ologywood-cinematic-hero-1280.webp`) | 5,336 bytes in Chrome |

The desktop LCP is within normal run-to-run network variance of the earlier baseline, while TTFB and FCP improved in the repeat measurement. Mobile FCP improved from 1,264 ms to 668 ms and mobile LCP improved to 1,004 ms. The strongest deterministic improvement is the reduction of the server HTML shell from roughly 372 KB to roughly 5 KB and removal of the preview runtime from the production response.

## Follow-up dashboard optimization — 2026-11-15

The dashboard route chunks were re-measured after deferring analytics and calendar panels behind `Suspense` boundaries:

| Route chunk | Before | After | Reduction |
|---|---:|---:|---:|
| `ArtistDashboardV3` | 247,971 bytes | 233,180 bytes | 14,791 bytes / 6.0% |
| `VenueDashboard` | 192,326 bytes | 142,075 bytes | 50,251 bytes / 26.1% |

The homepage lazy-load fallback now presents a dark OlogyWood-branded hero/search skeleton with a smooth pulse animation instead of a generic spinner. The fallback is accessible with `aria-busy`, an accessible label, and regression coverage. The dashboard panel split preserves existing tab behavior and shows bounded skeleton placeholders while deferred panels load.

The responsive layout assertion was corrected to verify the current `grid-cols-1 sm:grid-cols-2 lg:grid-cols-5` contract, and the venue feature test now verifies the intentional lazy import. TypeScript, production build, focused tests, full suite, and `git diff --check` all pass.
