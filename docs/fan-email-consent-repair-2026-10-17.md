# Fan email consent and unsubscribe repair

**Date:** October 17, 2026  
**Status:** Implemented and validated in development; publish the latest checkpoint before treating this repair as live production behavior.

## Corrected behavior

Following a creator and purchasing music, merchandise, books, or other content do not create email-marketing permission. Existing followers are not automatically opted in. A fan must explicitly choose the optional creator-email permission, with a valid verified email address and a current artist follow. The disclosure explains that an eligible paid creator profile owner can see and export the fan's name and email and contact them outside OlogyWood.

Consent is separately stored for the fan/creator pair, defaulting to false, and bound to the disclosure version, current normalized email hash, and optimistic revision. Changing the email address invalidates old consent. Fans can revoke permission without unfollowing; unfollowing revokes the creator permission atomically. A global creator-update switch does not create per-creator consent. Existing global `never`, unsubscribe timestamp, and disabled fan-update preferences suppress contacts and delivery.

Creator contact lists, fresh CSV exports, sender previews, manual fan updates, and automatic creator event/profile emails now use the same eligibility rules. Social follower and following APIs no longer return private emails. Paid contact tools require the caller's actual creator profile and existing plan permission; non-owner team-member accounts and no-profile accounts do not gain contact access through an admin role or UI visibility.

Manual updates retain the once-per-24-hour limit and a 10,000-recipient cap. CSV exports are limited to 10,000 eligible contacts per export and correctly escape quotes, separators, line breaks, and spreadsheet formulas. Each email is rechecked under the fan's shared transaction lock before the bounded provider call; follow, consent, and global-preference writers use the same user-row lock. Campaign reservation prevents duplicate simultaneous sends. HTML and message text are escaped.

## Secure unsubscribe and truthful feedback

Fan emails include a signed, creator-scoped browser unsubscribe link that works without login after explicit confirmation. GET does not mutate preferences. RFC 8058 headers target the matching POST route. Tokens contain no raw email, are scope/revision/address-bound, and cannot revoke a newer re-consent. Invalid token inputs cannot fall back to global unsubscribe. Legacy opaque global tokens retain a separate confirmed POST flow; bare email/user identifiers are not authority.

Provider work is abort-bounded to eight seconds. Acceptance counts do not promise inbox delivery. Failures, skips, and unconfirmed preference writes are not reported as successful delivery or persistence. Recipient-source outages produce retryable errors, not invented empty lists or permissive fallback recipients. In-app follower notifications remain independent of email opt-in.

Previously exported external mailing lists cannot be recalled. Creators remain responsible for honoring removals in those lists. The UI, Help, Privacy Policy, and deterministic AI guidance state these boundaries.

## Database and preservation

Generated and reviewed migration `0117_fan_email_consents.sql` was applied through managed SQL. It contains additive DDL only: the empty `fan_email_consents` table, unique fan/creator scope, creator/opt-in index, and the global `email_preferences.fanUpdates` category column. Metadata-only verification confirmed every column/default and index, including default-false creator opt-in. The global category defaults to true but grants no creator consent by itself. A narrow idempotent runtime guard handles missing declarations; it does not reset or backfill records.

No real fan, creator, profile, purchase, payment, contract, or consent records were intentionally written during validation, and no emails were sent. There was no mass opt-in or consent backfill. Fee percentages, subscriptions, complimentary grants, Stripe flows, product fulfillment, six canonical destinations, and the existing Workspace Schedule implementation were not changed by this repair.

## Exact validation

| Check | Result |
|---|---|
| Focused fan consent/email plus affected book/privacy/layout regressions | 251 passed, 0 failed, 0 skipped across 14 files |
| Full platform Vitest suite | 3,315 passed, 0 failed, 23 existing skipped; 3,338 total |
| `pnpm check` | Passed |
| `pnpm build` | Passed; Vite 18.37 seconds; existing bundle-size warnings remain |
| `git diff --check` and scoped credential/conflict/artifact scan | Passed |
| Managed database verification | Schema metadata only; additive declarations/defaults/indexes confirmed |
| Independent read-only review | No blocking production defect found; later error-handling hardening covered by final tests |
| Isolated desktop/mobile workflow | Passed at 390px and 1440px; all API operations intercepted; no real mutations or page errors, no horizontal overflow |

The browser workflow covered follow-only behavior, lazy unchecked opt-in, separate save, conflict retry with retained draft, revocation while globally blocked, fresh export failure/retry/download, explicit send confirmation and Cancel, zero-accepted/skipped feedback, actual saving of `never`, signed-out scoped unsubscribe, invalid tokens, and rejected legacy identifier authority. The generated mobile consent dialog was visually reviewed. Disposable scripts and screenshots are outside the repository and removed before checkpointing.

## Publish and verify

Publish the latest saved checkpoint. Then perform non-mutating production checks: Help/Privacy/AI guidance match this record; anonymous protected fan-contact endpoints reject access; signed-out unsubscribe without a valid capability makes no change; ordinary follow remains separate from optional email permission. Authenticated owner/fan opt-in, revoke, CSV export, and real-provider delivery are not claimed as production-verified by these local/mocked checks. Do not create real follows/consents, send marketing emails, or revoke real preferences merely for validation without the account owner's authorization.
