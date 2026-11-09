

### Operational logging, rate-limit, and recovery audit

The active server mounts structured request logging and in-process request metrics; slow requests, failed requests, durations, status codes, and aggregate error analytics are available without intentionally logging raw exception payloads or sensitive identifiers. Public/authenticated/expensive endpoints use bounded rate limiters, and the shared limiter supports an atomic Redis sorted-set window when `REDIS_URL` or `REDIS_HOST` is configured, with a bounded local fallback when Redis is unavailable. This implementation is covered by the existing rate-limit and logger security regressions. No production Redis connection or provider dashboard was changed in this read-only pass.

The disaster-recovery documentation identifies Manus checkpoints/GitHub for code, AWS RDS automated backups for database recovery, S3 durability for files, and Stripe/SendGrid as system-of-record providers. Backup retention, restore drills, autoscaling capacity, external dashboards, and provider-level alerting remain deployment-owner/provider verification gates; no backup, restore, autoscaling, or monitoring configuration was changed.
