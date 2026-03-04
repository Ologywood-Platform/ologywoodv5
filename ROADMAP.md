# Ologywood — Feature Roadmap

**Last Updated:** March 4, 2026
**Current State:** MVP Golden Path — Complete

This roadmap outlines features and improvements organized by priority. The MVP is fully functional with end-to-end booking, payments, rider management, messaging, and fan engagement.

---

## Priority 1 — Critical for Launch

These items should be addressed before inviting real artists and venues to the platform.

| Feature | Description | Effort |
|---------|-------------|--------|
| Role Switching UI | Users with both artist and venue profiles need an in-app toggle to switch roles without database changes. Currently requires manual DB update. | Medium |
| Stripe Connect Onboarding UX | Add a clear "Connect Bank Account" CTA on the artist dashboard with status indicators (pending, verified, active). Artists cannot receive payouts without this. | Medium |
| Booking Cancellation Flow | Allow either party to cancel a booking with proper refund handling via Stripe. Currently bookings can only move forward. | Medium |
| Payment Receipt Emails | Verify that SendGrid payment receipt emails are delivered correctly for both deposit and final payments. Test with real email addresses. | Small |
| Webhook Reliability | Add idempotency keys and retry logic for Stripe webhook events. Currently relies on `verifyPayment` fallback. | Medium |
| Profile Completeness Validation | Prevent artists from accepting bookings without a complete profile (photo, bio, at least one rider template). | Small |

---

## Priority 2 — High Value Improvements

These features significantly improve the user experience and platform stickiness.

| Feature | Description | Effort |
|---------|-------------|--------|
| Rider Acknowledgment | Add "Acknowledge Rider" button in the rider modal so artists get notified when the venue has reviewed and accepted rider terms. | Small |
| Booking Status Filters | Add filter tabs (All / Pending / Confirmed / Completed / Cancelled) to both artist and venue dashboard Bookings tabs. | Small |
| Downloadable PDF Invoices | Generate printable PDF invoices for each booking that venues can download for their records. Invoice PDF service exists but is not wired to the UI. | Medium |
| Artist Earnings Page (Real Data) | The earnings dashboard exists but may use placeholder data. Wire it to real booking payment records from Stripe. | Medium |
| Notification Center | Build an in-app notification bell with real-time updates for new bookings, payments, messages, and reviews. The `notifications` table and services exist. | Large |
| Calendar Integration | Allow artists and venues to export bookings to Google Calendar / iCal. The availability calendar exists but lacks export. | Medium |
| Booking Negotiation | Allow venues and artists to counter-propose dates, fees, or rider terms within the booking thread before accepting. | Large |

---

## Priority 3 — Growth and Engagement

Features that drive user acquisition, retention, and platform growth.

| Feature | Description | Effort |
|---------|-------------|--------|
| Public Event Pages | Make events discoverable by non-logged-in users with SEO-optimized pages. Event pages exist but require auth. | Medium |
| Artist Verification Badges | Implement the verification badge system (table exists). Verified artists get a badge on their profile and higher search ranking. | Medium |
| Referral Program | Implement the referral system (table exists). Reward users who invite artists or venues to the platform. | Medium |
| Advanced Search Filters | Add filters for availability dates, rating, verified status, and price range to the artist browse page. | Medium |
| Booking Analytics | Dashboard showing booking trends, popular genres, peak booking times, and revenue analytics for admin. | Large |
| Multi-Photo Gallery | Allow artists to upload multiple profile/performance photos in a gallery format with drag-to-reorder. | Medium |
| Venue Reviews by Artists | Allow artists to review venues after completing a booking (reverse of the current venue-reviews-artist flow). | Small |

---

## Priority 4 — Polish and Optimization

Quality-of-life improvements and technical debt cleanup.

| Feature | Description | Effort |
|---------|-------------|--------|
| Disabled Service Cleanup | Remove or properly archive the 15+ `.disabled` service and router files that are no longer needed. | Small |
| Consistent Error Handling | Standardize error messages and toast notifications across all pages. Some pages show raw error objects. | Medium |
| Loading State Skeletons | Replace spinner-only loading states with skeleton screens for profile pages, browse, and dashboards. | Medium |
| Image Optimization | Add lazy loading, responsive srcset, and WebP format for all S3-hosted images. | Medium |
| Accessibility Audit | Run a full WCAG 2.1 AA audit and fix any issues. Accessibility page exists but actual compliance needs verification. | Large |
| E2E Testing | Add Playwright or Cypress end-to-end tests for the critical booking and payment flows. | Large |
| Rate Limiting | Implement rate limiting on public API endpoints (browse, search, profile views) to prevent abuse. | Small |

---

## Completed (March 4, 2026)

These features were recently built and verified working:

- **Two-Phase Stripe Payments** — Deposit (50%) + remaining balance, both via Stripe Checkout with auto-verification
- **View Rider Shortcut** — Purple "View Rider" button on venue dashboard booking cards with full modal display
- **Artist Name on Booking Cards** — Venue dashboard shows artist name and photo instead of "Artist #ID"
- **Real Invoice Dashboard** — Venue invoices page pulls real booking payment data with summary cards
- **Messages Scroll Fix** — Auto-scroll respects manual scrolling, only triggers on new messages
- **Self-Follow/Favorite Prevention** — Follow and Favorite buttons hidden on own profile
- **Payment Metadata Fix** — Checkout session metadata aligned with webhook handler field names
- **Stripe ESM Import Fix** — Replaced `require('stripe')` with proper ESM import

---

## Technical Debt

| Item | Description |
|------|-------------|
| Disabled files | 15+ `.disabled` router and service files should be removed or archived |
| Duplicate follow tables | Both `follows` and `artistFollows` tables exist — consolidate |
| Duplicate venue routes | Both `/venue/:id` and `/venues/:id` routes exist — consolidate |
| Inline tRPC routes | Several routes are defined inline in `routers.ts` instead of dedicated router files |
| Mock data remnants | Some pages may still reference hardcoded data — audit and replace |
| Test coverage gaps | Payment flow and webhook handling lack dedicated test coverage |

---

## Notes

- The platform uses Stripe **test mode** (sandbox). To go live: complete Stripe KYC verification, then enter live keys in Settings → Payment.
- A 99% discount promo code is available in Stripe for live mode testing. Minimum order is $0.50 USD.
- Email delivery requires a verified SendGrid sender domain for production use.
- The `OPENAI_API_KEY` is configured for AI recommendation features but these are not yet active in the UI.
