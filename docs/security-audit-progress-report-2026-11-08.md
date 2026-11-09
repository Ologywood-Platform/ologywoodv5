

### Heartbeat execution finding and correction

Read-only Heartbeat logs showed that the two existing registrations (`credit-expiration` and `contract-expiry-reminders`) were active but failing with HTTP 403 because the deployed handlers required an `x-manus-cron-task-uid` header that Heartbeat does not send. The scheduler authenticates through the signed `cron_` session cookie and exposes the task UID through the verified Manus user identity. The code now uses a shared `requireVerifiedCronTask` boundary: it requires the verified cron session, validates the signed task UID, and validates/matches the optional header when present. Focused scheduled/security regressions passed 18/18; the full suite passed 4,044 tests with 23 skipped; TypeScript passed; and the production build succeeded. The fix is checkpointed but still requires publishing before the Heartbeat logs can be rechecked.


### Post-publish production and provider checks

After publishing checkpoint `514b8438`, both production domains returned `/api/health` HTTP 200 with `runtimeVerified: true`. The custom domain returned HTTP 200 for robots, sitemap, home OG metadata, and Adonis artist OG metadata; the managed `manus.space` domain returned HTTP 200 for sitemap and OG endpoints but its edge-served robots response is `Disallow: /`, so the custom domain remains the canonical crawler domain. Public DNS authentication is present for `ologywood.com`: SPF includes SendGrid, DMARC is `p=quarantine`, and both common SendGrid DKIM selectors resolve.

All five Heartbeat jobs are now enabled: credit expiration, contract expiry reminders, auto-complete bookings, premiere reminders, and 15-minute Ology Live session reminders. The three missing registrations were added after publishing. A post-publish execution result is still pending because the next scheduled runs are future-dated; the earlier active-job failures were pre-publish 403s.


Unauthenticated POST probes to the published credit-expiration, contract-expiry, and session-reminder routes all returned HTTP 403 with a generic cron-cookie permission error, confirming the scheduled surface is not publicly callable. The new session-reminder registration has no run yet; its first scheduled execution is pending.
