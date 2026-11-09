

### Heartbeat execution finding and correction

Read-only Heartbeat logs showed that the two existing registrations (`credit-expiration` and `contract-expiry-reminders`) were active but failing with HTTP 403 because the deployed handlers required an `x-manus-cron-task-uid` header that Heartbeat does not send. The scheduler authenticates through the signed `cron_` session cookie and exposes the task UID through the verified Manus user identity. The code now uses a shared `requireVerifiedCronTask` boundary: it requires the verified cron session, validates the signed task UID, and validates/matches the optional header when present. Focused scheduled/security regressions passed 18/18; the full suite passed 4,044 tests with 23 skipped; TypeScript passed; and the production build succeeded. The fix is checkpointed but still requires publishing before the Heartbeat logs can be rechecked.
