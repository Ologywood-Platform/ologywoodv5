# Ologywood Platform Audit Findings
## Date: March 5, 2026

---

## Phase 1: Codebase Structure

### Dead Code / Disabled Files
- **48 disabled files** (.ts.disabled) across server/routers, server/services, server/routes, server/tests
- **6 deprecated test files** in `client/src/components/__tests__/_deprecated/`
- These should be removed — they add noise and confusion to the codebase

### Duplicate / Redundant Code
- **ArtistEarnings.tsx (379 lines) vs ArtistEarningsDashboard.tsx (378 lines)** — nearly identical, both routed at `/earnings` and `/earnings-dashboard`
- **Multiple email service files**: `server/email.ts`, `server/email-service.ts`, `server/services/emailService.ts`, `server/services/emailBrandingTemplates.ts`, `server/services/email-templates.ts`
- **Stub endpoints**: `getArtistEarnings` and `getRecentTransactions` return null/empty — dead stubs

### Large Monolithic Files (need refactoring consideration)
- `server/db.ts` — 2,263 lines (all DB queries in one file)
- `server/routers.ts` — 2,162 lines (main router with inline endpoints)
- `server/email.ts` — 1,057 lines (all email templates)
- `client/src/pages/RiderBuilder.tsx` — 1,023 lines

---

## Phase 2: Functional Flow Audit

### Working Endpoints (Verified)
| Endpoint | Status | Notes |
|----------|--------|-------|
| Health check | OK | Returns `{"status":"ok"}` |
| Auth login | OK | Cookie set correctly |
| Auth.me | OK | Returns user with hasPassword |
| Artist search | OK | Returns artists |
| Booking.getMyArtistBookings | OK | Returns bookings |
| Message.getTotalUnreadCount | OK | Returns count |
| Subscription.getStatus | OK | Returns null (no subscription) |
| EmailPreferences.getPreferences | OK | Returns preferences |
| Release.getMyReleases | OK | Returns releases |
| Sitemap.xml | OK | Dynamic sitemap |

### Broken / Misconfigured Endpoints
| Endpoint | Issue |
|----------|-------|
| `contract.getMyContracts` | NOT_FOUND — route doesn't exist at this path |
| `rider.list` | NOT_FOUND — route doesn't exist (correct: rider.getMyTemplates) |
| `follows.getFollowing` | Requires `userId` param, not null — input validation error |

### Pages Audit (55 pages total)
- All pages are routed in App.tsx
- Duplicate routes: `/privacy-policy` and `/privacy` both go to PrivacyPolicy
- Duplicate routes: `/terms-of-service` and `/terms` both go to TermsOfService (acceptable aliases)

### Email Flows
- Email verification: Working (SendGrid)
- Password reset: Working (SendGrid)
- Unsubscribe: Route exists at `/api/email/unsubscribe-page`
- Need to verify: booking confirmations, rider notifications, fan notifications

### Express Routes (Non-tRPC)
| Route | Status |
|-------|--------|
| Stripe webhook | Mounted |
| Sitemap | Working |
| Email routes | Mounted |
| Event routes | Mounted |
| Release upload/download/checkout | Mounted |
| Booking checkout | Mounted |
| Contract PDF | Mounted |
| Unsubscribe | Mounted |

---

## Phase 3: Issues to Fix

### Critical
1. Remove 48 disabled files — dead weight
2. Remove 6 deprecated test files
3. Fix `follows.getFollowing` — frontend may be calling with wrong params
4. Verify `contractDashboard` vs `contract` namespace confusion

### Important
5. Consolidate duplicate ArtistEarnings pages into one
6. Remove stub endpoints (getArtistEarnings, getRecentTransactions)
7. Consolidate email service files

### Nice to Have
8. Consider splitting db.ts into domain-specific files
9. Consider splitting routers.ts into smaller files
10. Add missing email unsubscribe links to all outgoing emails

---

## Phase 4: Test Suite Status
- To be run after cleanup

## Phase 5: UX/Navigation
- To be audited after fixes
