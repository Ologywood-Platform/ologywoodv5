# Ologywood Platform Gap Analysis

**Date:** March 11, 2026  
**Author:** Manus AI  
**Scope:** Comprehensive audit of all features, user flows, and infrastructure across the three user groups — Artists, Venues/Event Organizers, and Fans/Clients.

---

## Executive Summary

Ologywood has grown into a feature-rich artist booking platform with 41 database tables, 59 frontend pages, 18+ API router namespaces, and 1,664 passing tests. The core booking pipeline — discovery, request, contract, payment, communication — is fully wired end-to-end. However, several gaps remain that would affect real-world usability when artists, venues, and fans begin using the platform at scale. This report categorizes those gaps by severity and user group, and recommends a prioritized action plan.

---

## What's Working Well

Before identifying gaps, it's important to acknowledge the substantial foundation already in place.

| Area | Status | Details |
|------|--------|---------|
| **Artist Discovery** | Solid | Browse page with search, genre/location/fee filters, featured carousel, suggested follows |
| **Booking Pipeline** | Complete | Request → Accept/Decline → Contract → Deposit → Final Payment → Completed |
| **Rider Contract System** | Complete | 4 pre-built templates, custom builder, e-signatures, PDF download, contract dashboard |
| **Payment System** | Complete | Stripe Checkout, Stripe Connect for artist payouts, deposit/balance flow, refund handling |
| **Messaging** | Working | Per-booking conversations, rider sharing via messages, real-time notifications |
| **White Label Releases** | Complete | Upload audio, set pricing, PWYW, purchase flow, download tracking, purchase-gated reviews |
| **Email System** | Robust | 20+ email types, branded templates, preference center, unsubscribe compliance, SendGrid |
| **Auth** | Dual-mode | OAuth + Email/Password with verification, forgot password, password strength indicator |
| **Fan System** | Working | Follow artists, receive email updates, fan role, artist email blasts (paid tier) |
| **Client Booking** | Working | Non-venue users can book artists via 4-step wizard, pay deposits, message artists |
| **Admin Dashboard** | Functional | Overview, Users, Bookings, Payouts, Releases, Blog, Feedback tabs |
| **SEO** | Thorough | OG tags, JSON-LD, sitemap, robots.txt, canonical URLs, breadcrumbs |
| **Mobile** | Optimized | Responsive layouts, bottom nav, PWA, pull-to-refresh, sticky booking bar |
| **Legal** | Complete | Privacy Policy, Terms, Cookies, Accessibility, DMCA — all platform-specific |

---

## Gap Analysis by Priority

### CRITICAL — Blocks Real-World Usage

These are issues that would prevent or seriously impair actual users from completing core workflows.

**1. Venue Onboarding & Profile Flow is Incomplete**

The venue side of the platform has significantly less polish than the artist side. While venue profiles can be created, the onboarding experience lacks the guided, step-by-step flow that artists enjoy. The `VenueOnboarding.tsx` page exists but the venue profile creation and editing workflow has had bugs (the profile create button was previously non-functional, and while fixed, the overall venue setup experience hasn't been tested end-to-end as thoroughly as the artist path). Venues are the paying customers who book artists — their experience must be frictionless.

**Recommendation:** Conduct a full venue-side E2E test (this is already listed as an open TODO item but never completed). Walk through: signup → role selection → venue onboarding → profile creation → browse artists → send booking request → sign contract → pay deposit → pay balance → leave review. Fix every friction point found.

**2. No Dispute Resolution or Cancellation Policy Enforcement**

The platform handles cancellations (venue cancels = artist keeps deposit; artist cancels = venue gets full refund), but there is no formal dispute resolution mechanism. When a booking goes wrong — artist no-shows, venue changes terms last minute, quality complaints — there is no way for either party to escalate. The admin dashboard shows bookings but has no dispute queue or mediation tools.

**Recommendation:** Add a lightweight dispute system: a "Report Issue" button on completed/cancelled bookings that creates a support ticket visible in the admin dashboard. Include fields for issue type (no-show, quality, payment, other), description, and evidence upload. This doesn't need to be complex — even a simple flagging system with admin review would suffice for MVP.

**3. No Calendar/Scheduling Integration**

Artists have an availability management page, but there is no calendar sync (Google Calendar, Apple Calendar, iCal). For working musicians who juggle multiple gigs, manually updating availability on yet another platform is a significant friction point. Additionally, there is no automatic blocking of dates when a booking is confirmed — an artist could theoretically double-book.

**Recommendation:** At minimum, implement automatic date blocking when a booking is confirmed (update availability to "booked" for that date). For a future phase, add iCal feed export so artists can subscribe to their Ologywood bookings in their preferred calendar app.

---

### HIGH — Significantly Impacts User Experience

**4. Search and Discovery Needs Improvement for Venues**

The Browse page is artist-centric. Venues searching for artists lack some key filters that would be essential for real booking decisions: availability on a specific date, distance/radius from venue location, verified/badge status, and price range combined with genre. The current filters (genre, location text, fee range) are basic. There is no "available on [date]" filter, which is arguably the most important filter for a booking platform.

**Recommendation:** Add an "Available on Date" filter to the Browse page that cross-references the availability table. Add a "Verified Artists Only" toggle. Consider adding a map view for location-based discovery in a future phase.

**5. Invoice System is Minimal**

The `VenueInvoiceDashboard` was rewritten to show real booking payment data from Stripe, but there is no proper invoice generation. Venues and artists both need downloadable invoices for tax and accounting purposes. The `invoices` table exists in the schema but the invoice generation and management workflow is not fully built out.

**Recommendation:** Build automatic invoice generation when a payment is completed (deposit or final). Include invoice number, date, parties, event details, amount breakdown (fee, platform fee, tax), and payment status. Allow PDF download. This is a legal/financial necessity for professional bookings.

**6. Notification System Lacks Push Notifications**

The in-app notification system works (bell icon, dropdown, polling), but there are no push notifications. The `notificationPreferences` table has a `pushNotifications` boolean field, but no push notification infrastructure exists. For a mobile-first audience (musicians and venue managers), push notifications are essential for time-sensitive booking requests and messages.

**Recommendation:** Implement web push notifications using the existing PWA service worker. The infrastructure is already partially there (service worker exists, manifest exists). Add push subscription management and send push notifications alongside in-app notifications for booking requests, messages, and payment events.

**7. No Onboarding Completion Tracking**

There is no way to know if an artist or venue has completed their profile setup. The artist dashboard shows "Complete Your Profile" when no profile exists, but there's no progress indicator showing what percentage of their profile is filled out. Artists with incomplete profiles (no photo, no bio, no rider template) will appear in search results but provide a poor experience for venues browsing.

**Recommendation:** Add a profile completeness score (0-100%) visible on the dashboard. Highlight missing fields (photo, bio, genre, location, fee range, rider template, Stripe Connect). Consider hiding artists from public search until they reach a minimum completeness threshold (e.g., 60%).

---

### MEDIUM — Important for Platform Maturity

**8. Analytics for Artists and Venues are Limited**

Artists can see earnings and release sales, but there are no profile analytics (profile views over time, booking conversion rate, search appearance count). The `profileViews` table exists but isn't surfaced in any dashboard. Venues have no analytics at all. For paid-tier artists, analytics are a key value proposition.

**Recommendation:** Build a simple analytics card on the artist dashboard showing: profile views (last 7/30 days), booking requests received, booking conversion rate, and follower growth. Use the existing `profileViews` table data. Gate detailed analytics behind the Professional tier.

**9. Referral System is Schema-Only**

The `referrals` table exists with `referralCode`, `status`, and `rewardAmount` fields, but there is no referral system UI, no referral code generation, and no reward logic. This is a powerful growth lever for a marketplace platform.

**Recommendation:** Defer to post-launch. The schema is ready when needed.

**10. Booking Templates are Underutilized**

The `bookingTemplates` table exists and allows venues to save reusable booking request templates, but the feature isn't prominently surfaced. Venues that book artists regularly (bars, restaurants, event companies) would benefit from being able to quickly re-use a template with pre-filled event details, fee, and deposit amount.

**Recommendation:** Add a "Use Template" option to the booking creation flow. Show saved templates as a dropdown when creating a new booking request.

**11. Event Discovery Needs More Content**

The Events page exists and is wired to real data, but the platform likely has very few events posted. The page will feel empty for new users. There is no event promotion or featured events system.

**Recommendation:** Encourage artists to post events during onboarding. Add a "Post Your Next Gig" prompt to the artist dashboard. Consider featuring events on the homepage.

**12. Blog Needs Regular Content**

The blog system is fully built with admin management, but only has one inaugural post. A blog with one post looks worse than no blog at all.

**Recommendation:** Either commit to regular content (1-2 posts per month covering booking tips, artist spotlights, platform updates) or hide the blog link from navigation until there are at least 3-5 posts.

---

### LOW — Nice-to-Have for Future Phases

**13. No Multi-Language Support**

The platform is English-only. For a platform targeting diverse music communities, multi-language support could expand the addressable market.

**14. No Bulk Booking / Tour Routing**

Artists who tour can't create a series of bookings across multiple venues/dates. Each booking is independent.

**15. No Venue-to-Venue or Artist-to-Artist Messaging**

Messaging is booking-scoped. There's no general messaging between users outside of a booking context.

**16. No Review Moderation**

Reviews are posted directly without admin approval. There's no flagging or moderation queue for inappropriate reviews.

**17. Stripe Test Mode Banner Not Implemented**

The todo lists a "Test Mode Banner" feature as incomplete. When Stripe is in test mode, users should see a clear banner indicating payments are simulated.

---

## Open Bugs (from todo.md)

The following items are marked as incomplete in the todo and represent known bugs or unfinished work:

| Item | Severity | Notes |
|------|----------|-------|
| Email verification flow mismatch (sends link, page asks for code) | Medium | Listed but marked as fixed via DB-persisted tokens |
| OAuth users can't log in with email/password | Medium | No "Set Password" flow for existing OAuth users |
| Artist profile "not found" from email links (post-publish) | High | May still be occurring on production |
| tRPC "Failed to fetch" on homepage | Low | Intermittent, likely network/timing related |
| Stripe test mode banner | Low | Not implemented |
| Generate downloadable PDF of signed rider with full details | Medium | Partially working, full version incomplete |
| Release purchase emails not received | Medium | Webhook timing issue, fallback exists |
| Artist edit profile button on dashboard | Low | Listed but appears to have been fixed |

---

## Recommended Action Plan

The following table prioritizes the gaps into a phased roadmap, respecting the lean MVP philosophy.

| Phase | Items | Effort | Impact |
|-------|-------|--------|--------|
| **Immediate (This Week)** | Venue E2E test + fixes, Auto-block dates on confirmed booking, Fix remaining open bugs | 2-3 days | Unblocks venue testing |
| **Pre-Launch (Next 2 Weeks)** | Invoice generation, Profile completeness score, "Available on Date" filter, Push notifications | 5-7 days | Makes platform professional-grade |
| **Post-Launch (Month 1)** | Dispute resolution, Artist analytics dashboard, Booking templates in flow, Event promotion | 5-7 days | Builds trust and retention |
| **Growth Phase** | Referral system, Blog content strategy, Review moderation, Multi-language | Ongoing | Scales the marketplace |

---

## Summary

Ologywood's core booking pipeline is solid and production-ready. The platform's strength lies in its complete end-to-end flow from discovery through payment, with strong supporting features like rider contracts, e-signatures, messaging, and email notifications. The primary gaps fall into three categories:

1. **Venue-side polish** — The venue experience needs the same level of testing and refinement that the artist side has received.
2. **Professional-grade tooling** — Invoice generation, calendar integration, and profile completeness tracking are table-stakes for a professional booking platform.
3. **Discovery and engagement** — Date-based availability search, push notifications, and analytics would significantly improve the platform's value proposition for both artists and venues.

None of these gaps are architectural — the database schema, API layer, and frontend patterns are all well-established. Each gap can be addressed incrementally without refactoring existing code.
