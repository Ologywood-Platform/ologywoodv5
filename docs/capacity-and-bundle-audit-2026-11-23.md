# Bounded capacity and JavaScript bundle audit — 2026-11-23

## Safety statement

This is a read-only validation artifact. It did not create or modify records, send messages, initiate payments, run migrations, alter schedules, or change provider settings. Production testing was intentionally bounded to the unauthenticated health endpoint.

## Bounded health capacity results

| Target | Request pattern | Result | Latency sample |
|---|---:|---:|---:|
| Local dev server | 60 requests, 10 workers | 60/60 HTTP 200 | p50 7.85 ms; p95 198.52 ms; max 206.92 ms |
| `www.ologywood.com` | 60 requests, 10 workers | 0/60 successes; HTTP 403 responses during burst | p50 1,293.67 ms; p95 1,572.84 ms; max 1,984.61 ms |
| `www.ologywood.com` | 20 requests, 5 workers with explicit readiness user agent | 20/20 HTTP 200 | p50 1,621.4 ms; p95 2,178.9 ms; max 2,200.7 ms |
| `ologywood-mp6flm6c.manus.space` | 20 requests, 5 workers with explicit readiness user agent | 20/20 HTTP 200 | p50 88.9 ms; p95 180.2 ms; max 206.1 ms |

A single read-only request to both deployed hostnames returned HTTP 200 with `{"status":"ok","runtimeVerified":true}`. The 403s appeared only during the larger custom-domain burst and cleared under the smaller controlled burst. This is consistent with an edge/WAF burst or bot-protection behavior, but it is not enough evidence to identify the exact provider rule. The custom domain's slower sample should be checked in a normal regional browser or monitoring probe before public launch; do not infer a code or database performance defect from this isolated test.

## JavaScript chunk decision

No manual chunk refactor was applied. The application already lazy-loads route pages, PDF generation is dynamically imported, and the enforced budgets pass:

- Application shell: 577,664 bytes against a 600,000-byte budget.
- Homepage route: 48,001 bytes against a 60,000-byte budget.
- Artist dashboard route: 233,253 bytes against a 240,000-byte budget.
- Venue dashboard route: 142,116 bytes against a 160,000-byte budget.
- PDF vendor chunk: approximately 983 KB, but it is on-demand and not part of the initial route shell.

The remaining size warning is therefore advisory rather than a failed gate. A broad manual-chunk rewrite would have a higher regression risk than the likely first-load benefit at this stage. Revisit after collecting real-user Web Vitals or route-level performance traces; prioritize the application shell and dashboard dependency graph, not the on-demand PDF chunk.

## Release follow-up

- Keep the production migration ledger read-only. All 147 production rows map to local files after normalization, while 38 local SQL files are absent from the normalized ledger. A DBA/release owner must reconcile deployment history before any metadata repair or SQL replay.
- Capture the custom-domain health latency and burst behavior from a normal browser/monitoring region and inspect edge/WAF configuration if the slower result reproduces.
- Obtain an authorized provider-capacity baseline for authenticated and write endpoints separately; this health-only probe does not certify booking, checkout, messaging, or upload capacity.
