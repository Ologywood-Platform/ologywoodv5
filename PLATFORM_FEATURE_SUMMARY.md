# Ologywood Platform — Comprehensive Feature Summary

**Date:** March 12, 2026  
**Platform:** Ologywood — Artist Booking Platform  
**User Groups:** Artists, Venues/Event Organizers, Fans/Clients  
**Tech Stack:** React + TypeScript + Tailwind CSS (frontend), Node.js + Express + tRPC (backend), MySQL + Drizzle ORM (database), Stripe Connect (payments), SendGrid (email), S3 (storage)

---

## Platform Statistics

| Metric | Count |
|--------|-------|
| Database tables | 42 |
| Frontend pages | 59+ |
| API router namespaces | 19+ |
| Passing tests | 1,700+ |
| Email notification types | 25+ |
| TypeScript errors | 0 |

---

## 1. Authentication & User Management

**Dual-mode authentication** supporting both OAuth (social login) and email/password registration. The email/password flow includes email verification with database-persisted tokens, a forgot/reset password flow with secure token links, and a password strength indicator (Weak/Fair/Good/Strong). Users can change their password from Account Settings, and OAuth users see a clear message explaining their login method.

**Role-based access control** with four roles: Artist, Venue, Fan, and Admin. New users select their role during onboarding via a clean three-option card layout. Role selection uses optimistic cache updates to prevent redirect loops. Each role has a tailored dashboard and feature set.

**Session management** with JWT-based cookies, persistent login state, and proper non-www to www redirect for consistent sessions across devices.

---

## 2. Artist Features

### Artist Onboarding
A guided multi-step onboarding wizard that walks artists through profile creation: name, genre, location, bio, fee range, profile photo upload, social links, and an introduction to White Label Releases. Duplicate profile creation is prevented with server-side guards.

### Artist Dashboard (V3)
A comprehensive dashboard with quick-action cards for Bookings, Messages, Events, Releases, Contracts, Portfolio, Availability, Riders, and Earnings. Includes:

- **Profile Completeness Card** — weighted score (0-100%) with tier labels (Incomplete, Basic, Good, Excellent) and actionable next steps. Artists below 40% are hidden from search.
- **Upcoming Bookings** — list of confirmed bookings with quick-view links.
- **Calendar Sync** — iCal feed export for Google Calendar, Apple Calendar, and Outlook subscriptions. Uses HMAC-secured tokens for feed authentication.
- **Stripe Connect Integration** — connect Stripe account, view real earnings, manage payouts.

### Artist Profile (Public)
A rich public profile page with:
- Hero image with responsive aspect ratios
- Bio, genre, location, fee range
- Social links (Instagram, Twitter, Spotify, YouTube, SoundCloud, website)
- **Support This Artist** — tip links (Cash App, Venmo, PayPal, Zelle) with auto-generated QR codes and a printable tip card for live shows
- Music releases with 30-second audio preview player and cover art
- Performance portfolio with photo galleries
- Event history
- Reviews from verified purchasers
- Booking dialog (for venues) or "Book This Artist" wizard (for fans/clients)
- Follow/Favorite buttons (hidden on own profile)
- Sticky booking bar on mobile

### Artist Edit Profile
Full editing of all profile fields including name, bio, genre, location, fees, social links, tip links, profile photo upload, and website URL. Accessible from dashboard and public profile (owner only).

---

## 3. Venue Features

### Venue Onboarding
A proper guided onboarding form (replaced the previous dead-end placeholder) that collects venue name, type (Bar, Club, Restaurant, Concert Hall, etc.), capacity, location, description, and contact info. Redirects to the venue dashboard upon completion.

### Venue Dashboard
Dashboard with tabs for Overview, Bookings, Messages, and Profile. Includes:
- Booking management with Accept/Decline buttons
- View Rider shortcut on booking cards
- Artist name display (not just "Artist #ID")
- Quick-access cards for Invoices and Messages
- Profile Completeness Card with venue-specific field weights

### Venue Invoice Dashboard
Real booking payment data from Stripe with:
- Invoice list with date, artist, event, amount, status
- **Download PDF** button — generates professional invoices with artist/venue info, payment breakdown, and terms
- Invoice number, date, parties, event details, amount breakdown

### Venue Verification
Verification badge system for trusted venues.

---

## 4. Booking System

### Venue Booking Flow
Venues can browse artists, view profiles, and send booking requests via a dialog with event details, date, time, venue address (broken into Street/City/State/Zip fields), fee, and notes. Booking requests flow through: Pending → Accepted/Declined → Contract → Deposit → Final Payment → Completed.

### Client Booking Flow (Non-Venue Users)
A 4-step wizard at `/book/:artistId` for fans and clients:
1. **Event Info** — event type dropdown (Wedding, Corporate, Birthday, Church, Festival, House Party, Restaurant, Other), date, time, guest count
2. **Location** — venue name, address fields
3. **Budget & Details** — proposed fee, special requests, additional notes
4. **Review & Submit** — confirmation with booking reference number

### Booking Detail Page
Comprehensive booking detail with:
- Status timeline and badges
- Event details, location, fee breakdown
- Messaging thread with the other party
- Rider contract viewing and signing
- Payment section (Pay Deposit 50%, Pay Remaining Balance)
- **Report Issue** button for filing disputes
- Dynamic breadcrumbs based on user role (artist/venue)
- "Add to Portfolio" button on completed bookings

### Payment Flow
Full Stripe-powered payment pipeline:
- **Deposit** — 50% of booking fee via Stripe Checkout
- **Remaining Balance** — pay after event via Stripe Checkout
- **Stripe Connect** — artist payouts with application fee
- **Cancellation Policy** — venue cancels = artist keeps deposit; artist cancels = full refund
- **Webhook handling** — auto-updates booking status on payment success
- **Fallback verification** — server-side Stripe query when webhook doesn't fire

### My Bookings (Client)
Dedicated `/my-bookings` page for fans/clients with upcoming/past sections, artist photos, status badges, Message Artist button, and payment buttons.

---

## 5. Rider Contract System

### Pre-Built Templates
Four professional rider contract templates:
- **Solo Artist** — technical requirements, hospitality, stage setup
- **Band** — multi-member requirements, backline, monitoring
- **DJ** — equipment, sound system, booth requirements
- **Speaker/MC** — AV requirements, presentation setup

### Rider Builder
Custom rider template creation and editing with section management, field customization, and template library.

### E-Signature Flow
Full digital signature workflow:
1. View rider terms
2. Artist signs (drawn or typed signature)
3. Venue countersigns
4. Fully signed status with timestamps
5. PDF download of signed contract with all details

### Contract Dashboard
Standalone `/contracts` page with summary cards, filter tabs (all/pending/signed/fully signed), status badges, and PDF download links.

### Rider via Messages
Artists can pick a rider template and send it as a special message in the booking conversation. View Full Rider modal available on the booking detail page.

---

## 6. Messaging System

Per-booking conversations between artists and venues/clients. Supports text messages and rider sharing. Auto-scroll on new messages with manual scroll detection. Message thread links back to booking context. Accessible from dashboards, booking detail, and My Bookings.

---

## 7. Dispute Resolution System

### Filing a Dispute
"Report Issue" button on booking detail pages (available for confirmed, completed, and cancelled bookings). Report dialog with:
- Issue type: No-show, Quality issue, Payment dispute, Contract violation, Communication issue, Other
- Description text area
- Evidence links

### Dispute Tracking
Dedicated `/disputes` page (accessible from user dropdown menu) showing all user's disputes with status badges (Open, Under Review, Resolved, Dismissed), booking context, and timeline.

### Admin Dispute Management
Full Disputes tab in the admin dashboard with:
- Summary cards (Open, Under Review, Resolved, Dismissed counts)
- Filterable dispute list by status
- Expandable detail view with booking context and evidence
- Admin actions: Start Review, Resolve (with required resolution text), Dismiss
- Internal admin notes field
- Red badge on tab header showing active dispute count

### Dispute Email Notifications
Complete email notification lifecycle:
- **Dispute Filed** — reporter gets confirmation ("Dispute Received"), respondent gets notice ("Dispute Filed Against Your Booking")
- **Status Changes** — both reporter and respondent notified with role-appropriate messaging when status changes to Under Review, Resolved, or Dismissed
- All emails include unsubscribe, manage preferences, and privacy policy links

---

## 8. White Label Releases (Music Sales)

### Release Management
Artists can upload audio tracks, set cover art, configure pricing (fixed or Pay What You Want), add streaming links, and publish releases. Supports draft/published/archived states.

### Purchase Flow
Stripe Checkout for release purchases with:
- Purchase confirmation email with download instructions
- `/purchase-success` page with auto-verification fallback
- `/my-purchases` page with download buttons and download count tracking
- Purchase-gated track reviews (1-5 stars, 280-char text)

### Release Analytics
Per-release sales analytics on the artist earnings page: total revenue, total sales, per-release breakdown with cover art.

### Audio Preview
30-second audio preview player on release cards with progress bar, time display, seek functionality, and cover art thumbnail.

---

## 9. Events System

### Event Creation
Artists can create events with title, description, date/time, location, event type, capacity, pricing, and photos.

### Event Discovery
Public `/events` page with search, filters, and event cards. Wired to real tRPC API.

### Event Detail
Full event detail page with all information, artist link, and messaging.

### Performance Portfolio
Artist history page with dual-mode (public portfolio grid + owner edit view). Photo upload gallery with captions. "Add to Portfolio" button on completed bookings.

---

## 10. Email Notification System

### 25+ Email Types
Comprehensive branded email templates for:
- Account: verification, password reset, welcome
- Booking: request, confirmation, cancellation, reminder
- Payment: receipt, refund, deposit confirmation
- Contract: sent for signature, signed notification
- Fan: artist updates, new events, profile changes
- Client: booking confirmation, artist notification
- Dispute: filed confirmation, status updates (reporter + respondent)
- Marketing: newsletter subscription, trial ending
- Admin: venue verification

### Email Compliance
- **Unsubscribe links** on all marketing/notification emails
- **Manage Preferences** link to `/settings` page
- **Privacy Policy** link in all email footers
- **List-Unsubscribe** header for email client integration
- All URLs use dynamic `ENV.baseUrl` (no hardcoded domains)

### Email Preferences Center
Standalone `/settings` page with:
- Frequency controls (daily digest, weekly digest, never)
- Content category toggles (booking updates, messages, marketing, etc.)
- Accessible from user dropdown menu and email footer links

### Unsubscribe Flow
Best-practice unsubscribe experience:
1. **Confirmation step** — "Before You Go..." warning with what they'll lose
2. **Alternatives** — "Just Reduce My Emails" option (essential only, no marketing)
3. **Granular control** — link to Settings for per-category toggles
4. **Feedback form** — 6 selectable reasons + optional comment after unsubscribing
5. **Easy reversal** — "Changed your mind? Resubscribe" button
6. **Feedback analytics** — admin dashboard Feedback tab with reason breakdown chart

---

## 11. Notification System

### In-App Notifications
Bell icon in site header with unread badge, dropdown list, mark as read, and polling for real-time updates. Triggers for booking, message, review, contract, and payment events.

### Browser Notifications
Desktop notification integration via the Notification API. Auto-triggers when new in-app notifications arrive. Permission management via `useBrowserNotifications` hook.

---

## 12. Search & Discovery

### Browse Page
Artist search with filters:
- Text search (name, genre, location)
- Genre dropdown
- Location text
- Fee range (min/max)
- **Available on Date** — single date picker that cross-references the availability table (excludes booked/unavailable dates)
- **Verified Artists Only** — toggle that filters by verification badge status
- Collapsible filter panel (collapsed by default on mobile)
- Reset all filters button
- Loading skeleton for perceived performance

### Featured Artists Carousel
Homepage carousel with responsive aspect ratios and object-top for face prioritization.

### Suggested Follows
Personalized artist recommendations for logged-in users (based on follows), with fallback to popular artists for new users.

### Artist Following
Follow/unfollow with real follower counts, Following page with followed artists list and suggested follows section.

---

## 13. Calendar & Availability

### Availability Management
Artists can set their availability by date (available, unavailable, booked). Calendar view with date selection.

### Auto-Blocking
Confirmed bookings automatically block the artist's availability for that date. Cancelled bookings automatically unblock.

### iCal Feed Export
Subscribable iCal feed at `/api/calendar/:artistId/bookings.ics` with:
- HMAC-secured token authentication
- All confirmed/completed bookings as calendar events
- CalendarSync UI component on artist dashboard
- One-click subscription for Google Calendar, Apple Calendar, and Outlook

---

## 14. Subscription & Pricing

### Tier System
- **Free** — basic profile, limited features
- **Starter** — enhanced features, 2 release uploads, PWYW pricing
- **Professional** — unlimited releases, analytics, priority support, fan email blasts

### Pricing Page
Responsive pricing cards with tab switcher, tier comparison, FAQ section, and JSON-LD structured data.

### Subscription Management
Stripe-powered subscription management with upgrade/downgrade and cancellation.

---

## 15. Admin Dashboard

Seven tabs for platform management:

| Tab | Features |
|-----|----------|
| **Overview** | Platform stats, user counts, booking metrics |
| **Users** | User list with role, status, and management actions |
| **Bookings** | All bookings with status filters and detail view |
| **Payouts** | Stripe Connect payout tracking |
| **Releases** | Release moderation with takedown/restore |
| **Blog** | Create/edit/publish/archive blog posts with cover image upload |
| **Feedback** | Unsubscribe feedback analytics with reason breakdown chart |
| **Disputes** | Dispute management with status filters, detail view, review/resolve actions, admin notes |

---

## 16. Blog System

Full blog CMS with:
- Admin create/edit/publish/unpublish/archive workflow
- Markdown rendering with syntax highlighting
- Cover image upload to S3
- Category filtering and pagination
- Social sharing buttons (Twitter/X, LinkedIn, copy link)
- SEO meta tags and JSON-LD

---

## 17. Legal & Compliance

| Page | Route |
|------|-------|
| Privacy Policy | `/privacy-policy` |
| Terms of Service | `/terms-of-service` |
| Cookie Policy | `/cookies` |
| Accessibility Statement | `/accessibility` |
| DMCA Takedown Policy | `/dmca` |

Cookie consent banner with localStorage dismissal. RobotsMetaTag component adds noindex/nofollow to 30+ private pages.

---

## 18. SEO & Performance

- **Open Graph tags** on all public pages
- **JSON-LD** structured data (Organization, FAQPage, MusicRecording)
- **Static sitemap.xml** with 16 public pages + dynamic artist/venue/event pages
- **Canonical URLs** for duplicate pages
- **Code splitting** — React.lazy() reduced initial bundle from 3,402 KB to 1,001 KB (70% reduction)
- **Vendor chunk splitting** — react (30 KB), ui (80 KB), pdf (983 KB)
- **Rate limiting** on all public endpoints (contact, newsletter, auth)

---

## 19. Mobile & Responsive Design

- Responsive layouts across all pages with Tailwind breakpoints
- Mobile bottom navigation bar
- PWA manifest and service worker (caching)
- Collapsible filters on Browse page
- Sticky booking bar on artist profiles
- Hamburger menu with full navigation
- Aspect-ratio-based image containers with object-top for face prioritization

---

## 20. Infrastructure & Security

- **Stripe Connect** for marketplace payments with application fee
- **S3 storage** for all file uploads (profile photos, cover art, audio, blog images)
- **SendGrid** for transactional and marketing emails
- **bcrypt** password hashing
- **Zod** input validation on all API endpoints
- **CORS** and security headers configured
- **Rate limiting** per IP and per email on public endpoints
- **Honeypot fields** on contact form for bot prevention
- **HMAC tokens** for calendar feed authentication

---

## Remaining Open Items

| Item | Priority | Status |
|------|----------|--------|
| OAuth users can't set email/password | Medium | Schema ready, UI not built |
| Stripe test mode banner | Low | Not implemented |
| Full Web Push with VAPID keys | Medium | Deferred — browser notifications working |
| Artist analytics dashboard (profile views, conversion rates) | Medium | Schema exists, UI not built |
| Referral system | Medium | Schema exists, no UI |
| Booking templates in creation flow | Low | Schema exists, not surfaced |
| "Add to Calendar" button on individual bookings | Low | iCal feed works, per-booking not built |
| Admin dispute email notifications on status change | Low | Reporter + respondent both notified |
| Review moderation queue | Low | Reviews post directly |
| Multi-language support | Low | English only |
| Bulk booking / tour routing | Low | Each booking independent |

---

## Summary

Ologywood is a production-ready artist booking platform with a complete end-to-end flow from discovery through payment and dispute resolution. The platform serves three distinct user groups — artists, venues, and fans — with tailored experiences for each. The codebase is well-tested (1,700+ tests, 0 TypeScript errors), properly structured (42 database tables, 19+ API routers), and optimized for performance (70% bundle size reduction, lazy loading, vendor splitting). All critical and high-priority gaps have been addressed, and the remaining open items are enhancement-level features that can be built incrementally post-launch.
