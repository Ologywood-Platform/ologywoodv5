# Ologywood Codebase Audit Report

**Date:** March 4, 2026  
**Scope:** Placeholders, stubs, TODOs, unimplemented routes/APIs, mock data, and dead code

---

## SEVERITY LEGEND

| Level | Meaning |
|-------|---------|
| **CRITICAL** | User-facing feature is broken or returns fake/mock data |
| **HIGH** | Service exists but is entirely stubbed — not wired to real data |
| **MEDIUM** | Partial implementation — works but has TODO gaps |
| **LOW** | Cosmetic or future-feature placeholder — no user impact today |

---

## 1. CRITICAL — User-Facing Stubs Returning Fake Data

### 1.1 `server/services/paymentProcessingService.ts` — Entire service is mock
Every method (`createPaymentIntent`, `createSubscription`, `cancelSubscription`, `getInvoices`, etc.) returns hardcoded mock objects with `pi_${Date.now()}` IDs instead of calling Stripe. This service is **separate** from the working Stripe checkout/webhook integration — it appears to be an older duplicate that was never connected to real Stripe.

**Impact:** If any UI calls this service, users see fake payment data.  
**Fix:** Either delete this file entirely (the real Stripe integration lives in `bookingCheckoutRoutes`, `releaseCheckoutRoutes`, and the webhook handler) or replace with real Stripe API calls.

### 1.2 `client/src/pages/Favorites.tsx` — Hardcoded `user = null`, always shows empty
Line 30: `const user = null; // TODO: Fix TRPC query issues`  
The `trpc.auth.me.useQuery()` call is commented out. The page always shows an empty favorites list regardless of actual data.

**Impact:** Users navigating to `/favorites` see nothing.  
**Fix:** Uncomment the `trpc.auth.me.useQuery()` call and wire up the favorites fetch.

### 1.3 `client/src/pages/BookingCreate.tsx` — Submit handler is a fake `setTimeout`
Line 69: `// TODO: Replace with actual booking API call`  
The form submit does `await new Promise(resolve => setTimeout(resolve, 1000))` then shows a success toast — but **no booking is actually created**.

**Impact:** If users reach this page, they think they booked but nothing happens.  
**Fix:** Wire the submit handler to the `booking.create` tRPC endpoint or remove this route if bookings are created elsewhere (e.g., the booking request flow on artist profiles).

---

## 2. HIGH — Entire Services That Are Stubbed

### 2.1 `server/services/supportTicketService.ts` — All methods return mock data
`createSupportTicket()` returns a random ID. `getUserTickets()` returns `[]`. No database table exists for support tickets.

**Impact:** Support ticket UI (if exposed) does nothing.  
**Fix:** Either implement with a real `support_tickets` table or remove the service and any UI that references it.

### 2.2 `server/services/ai-chat-mock.ts` — AI chat uses canned responses
Returns hardcoded strings for keywords like "booking", "payment", "rider". The real `ai-chat.ts` (with OpenAI) exists but is not active.

**Impact:** The AI chat widget gives generic canned answers instead of intelligent responses.  
**Fix:** Switch to `ai-chat.ts` when OpenAI API key is configured, or clearly label the widget as "FAQ Bot" so users don't expect AI.

### 2.3 `server/contractService.ts` — Template CRUD is all placeholder
- `saveContractTemplate()` returns `Math.floor(Math.random() * 10000)` (line 138)
- `getContractTemplate()` returns `null` (line 151)
- `listContractTemplates()` returns `[]` (line 164)

**Impact:** Contract template management doesn't persist anything. The rider contract system works separately via `riderTemplates` table, so this may be dead code.  
**Fix:** Delete if unused, or implement if needed for a separate contract template feature.

### 2.4 `server/analyticsMetricsService.ts` — All metrics return zeros
`calculateBookingMetrics()` and `calculateUserMetrics()` return hardcoded zero objects without querying the database.

**Impact:** Any admin analytics dashboard using this service shows all zeros.  
**Fix:** Implement real queries against the `bookings` and `users` tables, or remove if the admin dashboard is not active.

### 2.5 `server/services/followNotificationService.ts` — Returns empty arrays
`getRecentFollowers()` returns `[]`. `getFollowerStats()` returns all zeros. The `follows` table exists and works — this service just never queries it.

**Impact:** Follow notification features show no data.  
**Fix:** Wire up real queries against the `follows` table.

---

## 3. MEDIUM — Partial Implementations with TODO Gaps

### 3.1 `server/services/socketService.ts` — Notifications not persisted
Lines 4, 139, 243: The `notifications` table import is commented out. Real-time socket notifications are sent but never saved to the database, so users can't see missed notifications.

**Fix:** Create the `notifications` table in the schema and uncomment the insert/update logic.

### 3.2 `server/services/smsVerificationService.ts` — SMS sending is stubbed
Lines 62, 197, 216: All SMS sending is commented out with `// TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)`. The verification code is generated but never actually sent.

**Fix:** Integrate Twilio/AWS SNS or remove 2FA/SMS verification from the UI until implemented.

### 3.3 `server/services/emailMarketingService.ts` — Email sending is stubbed
Line 355: `// TODO: Integrate with SendGrid or similar service`. The email marketing service composes emails but never sends them. Note: The main `emailService.ts` DOES work with SendGrid — this is a separate marketing email service.

**Fix:** Wire up to SendGrid (already configured in env) or remove marketing email features.

### 3.4 `server/services/newsletterDoubleOptInService.ts` — No schema column
Lines 100, 120: `// TODO: Add newsletter subscription tracking to users table`. The unsubscribe/stats functions have no backing column.

**Fix:** Add `newsletterSubscribed` column to users table or remove newsletter features.

### 3.5 `server/services/riderReminderService.ts` — Missing tables
Line 3: `// TODO: riderAcknowledgments and riderModificationHistory tables need to be created`. The reminder processing function is empty.

**Fix:** Create the tables or remove the reminder service.

### 3.6 `server/routers.ts` line 2077 — Refund not recorded in DB
The Stripe refund is processed successfully, but the comment says `// Record refund in database (stub for now)` with no implementation.

**Fix:** Add a refund record to the database for audit trail.

---

## 4. LOW — "Coming Soon" UI Placeholders

### 4.1 `client/src/components/AccountSettings.tsx`
- Line 399: "Payment method management coming soon"
- Line 410: "Invoice viewer coming soon"
- Line 418: "Plan upgrade coming soon"

These are toast messages on button clicks — buttons exist but do nothing.

### 4.2 `client/src/components/AIChatWidget.tsx`
- Line 195: "Support feature coming soon" tooltip on the send button

---

## 5. Dead/Orphaned Code

### 5.1 `server/db-stubs.ts` — No longer imported
This file contains ~20 stub functions but is not imported anywhere. The comment in `db.ts` line 4 confirms: "All stubs have been replaced with real implementations."

**Fix:** Delete `server/db-stubs.ts`.

### 5.2 `server/db.ts` lines 1180-1397 — "STUB FUNCTIONS FOR NON-MVP ROUTERS"
A large block of stub functions for commented-out routers. Some may have been superseded by real implementations below line 1398.

**Fix:** Audit which are still referenced and remove the rest.

### 5.3 `client/src/components/_deprecated/` — 130+ deprecated components
This folder contains over 130 deprecated components. None are imported by active code (verified by grep). They add significant codebase noise.

**Fix:** Delete the entire `_deprecated` folder to reduce codebase size and confusion.

### 5.4 22 commented-out tRPC routers in `server/routers.ts` (lines 98-136)
Including: `system`, `analytics`, `contracts`, `contractManagement`, `contractAudit`, `referrals`, `verification`, `templates`, `testdata`, `support`, `aiChat`, `depositPayments`, `helpAndSupport`, `supportTickets`, etc.

**Fix:** Remove the commented-out router registrations and their associated imports/files if not planned for near-term implementation.

### 5.5 `server/middleware/fileUploadSecurity.ts` — Virus scan is a no-op
The `scanFileForViruses()` function always returns `true` unless `ENABLE_VIRUS_SCAN=true` is set (which it isn't).

**Fix:** Acceptable as-is for now, but document that virus scanning is not active.

---

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| **CRITICAL** | 3 | Fix immediately — users see fake data or broken features |
| **HIGH** | 5 | Implement or remove — entire services returning nothing |
| **MEDIUM** | 6 | Wire up or remove — partial implementations with gaps |
| **LOW** | 2 | Cosmetic — "coming soon" toasts on buttons |
| **Dead Code** | 5 | Clean up — unused files and 130+ deprecated components |

**Recommended priority order:**
1. Fix the 3 CRITICAL items (Favorites page, BookingCreate stub, mock payment service)
2. Delete dead code (db-stubs.ts, deprecated folder, commented-out routers)
3. Decide on HIGH items: implement or remove each stubbed service
4. Address MEDIUM TODOs based on feature roadmap
