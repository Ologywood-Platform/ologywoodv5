# Workspace Schedule — implementation and validation

**Date:** October 12, 2026  
**Status:** Implemented and validated in development; production publication and post-publication verification remain pending.

## Scope delivered

Schedule lives **inside Workspace**, available from its existing contextual sidebar and `Plan your schedule` card at `/workspace?section=schedule#schedule`. It is not a seventh primary destination. The six approved core destinations and existing account-menu/team routing remain unchanged.

- Named-timezone start/end times, multiple non-overlapping appointments per day, overnight end dates, and a chronological Day/Week agenda.
- Radio interviews, podcasts, appearances, rehearsals, performances, virtual sessions, and other private commitments.
- Private/unpaid appointment creation, editing, and cancellation without checkout or a paid-booking record.
- Optional preparation-before and travel-after buffers included in conflict calculations.
- Explicit all-day appointments reserving the actual local calendar day, with an inclusive final date for multi-day blocks. Timed appointments do not automatically reserve an entire day.
- Shared conflict checks with confirmed/completed ordinary bookings, artist manual unavailability, venue closures/recurring closures, and active Ology Live availability/reservations.
- Read-only booking, Live, and whole-day availability/closure entries with links to their appropriate existing management pages; only private appointment entries expose Schedule edit/cancel controls.
- In-app reminder choices, error/retry states, stale-revision protection, conflict-error draft retention, and mobile-safe layout.
- Help Center articles under **Booking & Contracts** and deterministic AI guidance describing the same capabilities and limitations.

## Timing and legacy compatibility

`shared/schedule.ts` uses `@js-temporal/polyfill` for named-IANA timezone conversion and interval validation. Appointment times persist as UTC epoch milliseconds alongside their timezone/date context. Nonexistent or ambiguous local times are rejected rather than silently guessed. True all-day boundaries handle skipped-midnight and 23/25-hour DST days.

New ordinary booking forms can store reliable timed intervals and buffers. **Existing date-only bookings remain date-level reservations**; their historical rows are not rewritten with invented durations. Calendar feeds use real stored timing when available and retain all-day presentation for legacy date-only bookings. Private appointment notes/location are not exported through those booking feeds.

Ology Live manual slots require explicit-offset timestamps and use the shared conflict engine. Recurring windows are generated in their selected timezone, with invalid DST windows and actual conflicts reported as skips; source outages fail closed rather than becoming conflict skips. Published available slots reserve talent time but do not produce attendee reminders. Occupied/reserved Live commitments use the appropriate existing reservation links. Temporary unpaid checkout holds block capacity but do not generate paid-commitment reminders; paid commitments are eligible.

## Privacy and concurrency

- Calendar access is limited to its owner or collaborators whose parsed permission is exactly `manageCalendar: true`. There is no administrator bypass to another person's private Schedule.
- Unauthorized client contexts do not query the agenda or render private entries.
- Conflict messages are generic and never name another private commitment or reveal its notes/location.
- Scheduling operations use deterministic, sorted `users ... FOR UPDATE` locks and READ COMMITTED transactions. Conflict reads and writes use the same connection; errors roll back.
- Appointment writes require the expected revision to prevent stale edits/cancellations.
- Live reservation/confirmation protects both the talent and the attendee calendar; capacity is derived from active receipts rather than blindly incrementing/decrementing on retries.
- Ordinary booking confirmation/payment/cancellation and availability/closure writes use the same scheduling coordination without changing fee percentages or introducing checkout for private appointments.

## Live checkout hardening found during final review

The independent locking/lifecycle review found that the shared calendar must not retain abandoned Checkout holds or permit confirmation without verified payment. The final implementation closes those gaps without changing prices, the existing **15% Ology Live fee**, or other commerce handlers:

- Verified Live Checkout events are dispatched to the Live receipt table before ordinary booking/subscription handlers. Live PaymentIntent metadata cannot accidentally update an ordinary booking with a coincidentally matching ID.
- Payment proof re-fetches current mode-specific Checkout and PaymentIntent/charge state outside calendar locks and validates session binding, participants, experience/slot, USD, exact persisted cents, and refund state. Older sessions lacking PaymentIntent metadata require an already-bound Checkout receipt; they cannot use the null-attachment race exception.
- Paid state remains pending for the existing talent confirmation action. Unpaid confirmation is rejected server-side and labeled **Awaiting payment** in the talent dashboard.
- Expired/unpaid and definitively failed async holds are released under both participant locks, with capacity recomputed. Open/processing payments remain held; provider uncertainty fails closed.
- Signed-in calendar/Live reads and reservation attempts perform scoped, bounded stale-hold reconciliation before acquiring their own scheduling locks. No worker, cron, or new external event configuration is required for this recovery path. A deadline prevents starting further provider/batch work; in-flight database transactions are allowed to complete safely rather than being raced against a timer.
- Full-refund state is reflected idempotently, including refund-before-completion ordering; partial refunds preserve paid status. No refund/payment is created by the repair or its tests.
- Cancellation, checkout attachment, system release, and confirmation re-read the participant tuple on the locked connection; stale tuples are rejected, not used to check an unlocked attendee calendar.

These lifecycle regressions and webhook-dispatch checks use fully mocked provider/database operations. No real Live purchase, refund, booking, or cancellation was performed.

## Reminder delivery boundary

> Reminders are **in-app, refresh-driven notices while signed in**. They are not email reminders, device push notifications, cron jobs, or guaranteed offline/background delivery.

Schedule refreshes while open; existing notification reads also materialize eligible reminders. Reminder receipts deduplicate delivery, honor existing preferences, and apply only to the signed-in user's own commitments—not an owner's commitments viewed by a collaborator. Pending ordinary booking requests and unbooked Live availability do not generate commitment reminders. Reminder notification content does not include private appointment notes/location.

## Managed schema verification

Additive migration **0116** was reviewed and applied in the managed database. Narrow, idempotent runtime compatibility guards cover missing declared Schedule/timing schema, including restoration of the declared Live slots table when drift left it absent. No broad/destructive migration or legacy-record rewrite is required.

Metadata-only checks on the final state confirmed:

| Schema area | Verified |
| --- | --- |
| `schedule_appointments` | All 19 declared columns; owner/time and owner/status indexes |
| `schedule_reminder_receipts` | All 9 declared columns; unique `dedupKey`; owner/source index |
| Ordinary booking timing | Nullable UTC start/end, timezone, all-day metadata; preparation/travel columns |
| `ology_live_time_slots` | All 10 declared columns including nullable `scheduleTimezone` |
| Existing Live receipts | Required amount, payment/binding, paid/refunded/cancelled timestamps and reason columns verified; no further migration |

The verification queries inspected schema metadata, not private calendar content. No real appointment, booking, creator/venue profile, contract, payment, subscription, or user record was intentionally modified during validation.

## Exact-state validation

| Check | Result |
| --- | --- |
| Focused Schedule/booking/Live/UI suite | **180 passed**, 10 test files |
| Full platform suite | **3,216 passed**, 23 skipped, **0 failed**; 3,239 total tests |
| `pnpm check` | Passed |
| `pnpm build` | Passed; existing bundle-size warnings remain non-blocking |
| `git diff --check` | Passed |
| Changed-file conflict-marker/credential/artifact scan | Clean |
| Isolated browser workflows | Passed at **390 px and 1440 px** |

The browser fixture intercepted every API operation: conflict/retry preserved the draft, timed creation submitted timezone/buffers, edit/cancel used revisions, all-day creation omitted timed inputs, Day/Week switching worked, Live availability was distinguished from reservations, denied access never requested the agenda, and page width equaled viewport width with zero page errors. **These were synthetic/mocked interactions, not production appointment or payment tests.** Anonymous development context/agenda endpoints returned HTTP 401, and Workspace preview HTTP 200 was checked locally and publicly. Live unpaid-versus-paid confirmation controls also passed at both widths. Generated verification screenshots were visually inspected; disposable scripts/screenshots are not product files and are removed before checkpointing.

## Publication and verification

1. Save the validated development checkpoint and publish it through the project's existing Publish control.
2. Confirm deployed Help/AI Schedule instructions and the new production bundle.
3. Verify signed-out Workspace does not expose private entries or notes.
4. The account owner can inspect **Workspace → Schedule** after signing in. Authenticated production behavior has not yet been claimed as verified.
5. Do not create/cancel a real appointment, reserve a Live slot, alter availability, or initiate payment during verification unless the owner explicitly authorizes that real action.
6. Record non-mutating production verification and a closeout checkpoint after publication.

Existing payment/Stripe behavior, marketplace fee percentages, profile data, plan behavior, specialized URLs, Athlete-only NIL/readiness boundaries, and the approved navigation structure remain in scope for preservation—not redesign.
