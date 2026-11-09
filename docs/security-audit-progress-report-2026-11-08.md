

## Cross-domain payment-history check — 2026-11-09

The managed deployment-domain My Purchases URL was checked read-only while the browser had the custom-domain session. It returned the unauthenticated application shell rather than exposing purchase history, which is consistent with domain-scoped session cookies. No cross-domain purchase-data leakage was observed. A fully authenticated second-domain comparison remains optional/open because it would require a separate sign-in on that domain; the custom domain remains the verified launch surface.
