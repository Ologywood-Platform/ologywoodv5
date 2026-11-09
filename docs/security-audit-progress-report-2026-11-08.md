

### Legacy route log cleanup

Although `socketMetricsRoutes.ts` and `paymentTestingRoutes.ts` are not mounted by the active server bootstrap, their remaining exception logs were normalized to classified error kinds so future reactivation cannot leak raw exception objects. Route-safety and Express-boundary regressions pass 6/6, TypeScript passes, and production build passes with existing chunk-size warnings. No metrics, payment tests, provider calls, or records changed.
