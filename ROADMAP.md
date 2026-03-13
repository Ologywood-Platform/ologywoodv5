# Ologywood — Feature Roadmap

**Last Updated:** March 13, 2026  
**Current State:** Production — MVP Golden Path Complete  
**Platform:** [www.ologywood.com](https://www.ologywood.com)

This roadmap organizes upcoming features by priority and documents all completed work. The MVP is fully operational with end-to-end booking, two-phase Stripe payments, rider contract management with e-signatures, in-platform messaging, fan engagement, music release sales, blog management, dispute resolution, and a comprehensive admin dashboard.

---

## Priority 1 — Next Up

These features have the highest impact on platform usability and growth.

| Feature | Description | Effort |
|---------|-------------|--------|
| Bulk Role Assignment | Select multiple users in the admin Users tab and assign them the same role at once, useful for onboarding batches of artists or venues. | Medium |
| Content Calendar for Bloggers | Visual calendar view on the Blogger Dashboard for scheduling posts for future publication with draft-to-publish workflow. | Medium |
| Booking Cancellation Flow | Allow either party to cancel a booking with proper refund handling via Stripe. Currently bookings can only move forward. | Medium |
| Downloadable PDF Invoices | Generate printable PDF invoices for each booking that venues can download. The invoice PDF service exists but is not wired to the UI. | Medium |
| Calendar Integration | Allow artists and venues to export bookings to Google Calendar or iCal. The availability calendar exists but lacks export. | Medium |

---

## Priority 2 — High Value Improvements

These features significantly improve the user experience and platform stickiness.

| Feature | Description | Effort |
|---------|-------------|--------|
| Rider Acknowledgment | Add "Acknowledge Rider" button in the rider modal so artists get notified when the venue has reviewed and accepted rider terms. | Small |
| Booking Status Filters | Add filter tabs (All / Pending / Confirmed / Completed / Cancelled) to both artist and venue dashboard Bookings tabs. | Small |
| Artist Earnings (Real Data) | Wire the earnings dashboard to real booking payment records from Stripe instead of aggregated data. | Medium |
| Booking Negotiation | Allow venues and artists to counter-propose dates, fees, or rider terms within the booking thread before accepting. | Large |
| Blog Post Analytics | Show view counts, read time stats, and most popular posts on the Blogger Dashboard header. | Medium |
| Audit Log Export | Add a CSV export button to the Audit Log tab for compliance and record-keeping. | Small |

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

---

## Priority 4 — Polish and Optimization

Quality-of-life improvements and technical debt cleanup.

| Feature | Description | Effort |
|---------|-------------|--------|
| Consistent Error Handling | Standardize error messages and toast notifications across all pages. Some pages show raw error objects. | Medium |
| Loading State Skeletons | Replace spinner-only loading states with skeleton screens for profile pages, browse, and dashboards. | Medium |
| Image Optimization | Add lazy loading, responsive srcset, and WebP format for all S3-hosted images. | Medium |
| Accessibility Audit | Run a full WCAG 2.1 AA audit and fix any issues. Accessibility page exists but actual compliance needs verification. | Large |
| E2E Testing | Add Playwright or Cypress end-to-end tests for the critical booking and payment flows. | Large |
| Duplicate Table Consolidation | Both `follows` and `artist_follows` tables exist — consolidate into one. | Small |

---

## Completed Features

### March 13, 2026

| Feature | Description |
|---------|-------------|
| **Change Role Dropdown** | Replaced Make Admin/Remove Admin buttons with a full role dropdown (Admin, Blogger, Artist, Venue, User) in the admin Users tab. |
| **Blogger Role** | New lightweight role for blog content management without admin access. Includes dedicated Blogger Dashboard at `/blogger-dashboard`. |
| **Role Change Email Notifications** | Branded email sent to users when their role is changed, showing previous/new role and access description. |
| **Role Change Audit Log** | Dedicated `role_change_audit_log` table and Audit Log tab in Admin Dashboard tracking who changed whose role and when. |
| **Owner Badge Fix** | Owner (garychisolm30@gmail.com) now reliably displays as "Owner" with yellow badge using email-based identification fallback. |
| **Admin Role Management Fix** | Changed promote/demote from owner-only to admin-accessible. Any admin can now manage user roles. |
| **Production Database Sync** | Created missing `booking_disputes` and `role_change_audit_log` tables on production. Updated users role enum to include `fan` and `blogger`. |
| **Codebase Cleanup** | Removed 34 stale temp scripts and 6 outdated documentation files. |
| **Documentation Overhaul** | Rewrote README.md and ARCHITECTURE.md to reflect current 61-table, 62-page, 6-role platform state. |

### March 4, 2026

| Feature | Description |
|---------|-------------|
| **Two-Phase Stripe Payments** | Deposit (50%) + remaining balance, both via Stripe Checkout with auto-verification. |
| **View Rider Shortcut** | Purple "View Rider" button on venue dashboard booking cards with full modal display. |
| **Artist Name on Booking Cards** | Venue dashboard shows artist name and photo instead of "Artist #ID". |
| **Real Invoice Dashboard** | Venue invoices page pulls real booking payment data with summary cards. |
| **Messages Scroll Fix** | Auto-scroll respects manual scrolling, only triggers on new messages. |
| **Self-Follow/Favorite Prevention** | Follow and Favorite buttons hidden on own profile. |
| **Payment Metadata Fix** | Checkout session metadata aligned with webhook handler field names. |

### Earlier (February 2026)

| Feature | Description |
|---------|-------------|
| **Core Booking System** | End-to-end booking flow with request, accept/decline, status tracking. |
| **Rider Builder** | 4 pre-built templates (Solo Artist, Band, DJ, Speaker) with technical, hospitality, stage, and payment sections. |
| **E-Signature System** | Draw or type signatures on rider contracts with certificate verification. |
| **Fan Engagement** | Follow system with email consent, tiered access (free: names, paid: emails + CSV export). |
| **Artist Updates** | Email blast tool for paid-tier artists to notify fans. |
| **Music Releases** | Upload, sell, and review music releases with purchase-gated reviews. |
| **Event Discovery** | Event creation, search, RSVP, recurrence, and photo galleries. |
| **Stripe Connect** | Artist bank account linking for payout processing. |
| **Subscription Tiers** | Free, Pro, Premium plans with feature gating via pricing service. |
| **Blog System** | Full blog with create, edit, publish, delete, cover images, and public display. |
| **Dispute Resolution** | File disputes on bookings, admin review with notes and resolution. |
| **Dark Mode** | Full dark mode toggle with localStorage persistence. |
| **PWA Support** | Installable with service worker, offline support, install prompt. |
| **Dual Authentication** | OAuth (Manus) + Email/Password with email verification and forgot-password flow. |
| **Email System** | 15+ branded email types via SendGrid with user preference management. |

---

## Technical Debt

| Item | Description | Priority |
|------|-------------|----------|
| Duplicate follow tables | Both `follows` and `artist_follows` tables exist — consolidate | Low |
| Duplicate venue routes | Both `/venue/:id` and `/venues/:id` routes exist — consolidate | Low |
| Inline tRPC routes | Several routes defined inline in `routers.ts` instead of dedicated router files | Low |
| Test coverage gaps | Payment flow and webhook handling lack dedicated test coverage | Medium |

---

## Platform Statistics (March 13, 2026)

| Metric | Count |
|--------|-------|
| Database tables | 61 |
| Client pages | 62 |
| UI components | 123 |
| tRPC router files | 18 |
| Vitest tests passing | 1,864 |
| TypeScript errors | 0 |
| User roles | 6 (Owner, Admin, Blogger, Artist, Venue, User) |

---

## Notes

The platform uses Stripe **test mode** (sandbox). To go live with real payments, complete Stripe KYC verification in the Stripe Dashboard, then enter live keys in Settings > Payment. A 99% discount promo code is available in Stripe for live mode testing (minimum order $0.50 USD). Email delivery requires a verified SendGrid sender domain for production use.
