

### Reachable Express-route exception-log sweep

The active route inventory confirmed `/api/email` and `/api/release/checkout` are reachable. Their raw exception logs were hardened: email-test failures now record only error kind, while release-checkout logs no longer expose Stripe account IDs, artist user IDs, Checkout session IDs, release IDs, or raw exceptions. Unmounted payment-testing and socket-metrics modules were not treated as active production surfaces. Reachable-route, boundary, release-checkout, and commerce regressions pass 17/17; TypeScript and production build pass with existing chunk-size warnings. No emails, Checkout sessions, payments, or records changed during validation.
