# Changelog

All notable changes to the Ologywood platform are documented in this file. Versions correspond to Manus checkpoint milestones.

---

## [0.9.5] - February 28, 2026

### Documentation & Cleanup
- Removed legacy `Dockerfile` and `docker-compose.yml` from project root
- Moved 13 legacy scripts (backup, deploy, rollback) to `scripts/legacy/`
- Rewrote `DEVELOPER_GUIDE.md` aligned with `ARCHITECTURE.md`
- Rewrote `CI_CD_DEPLOYMENT.md` for Manus hosting (removed Docker/Kubernetes/GitHub Actions references)
- Rewrote `DISASTER_RECOVERY.md` for Manus + AWS RDS (6 recovery scenarios with RTOs)
- Created `ARCHITECTURE.md` with folder structure, data flow, and new-feature guidance
- Updated `README.md` with current metrics (36 tables, 46 pages, 1,233 tests, 0 TS errors)
- Updated `docs/API.md` with all 30 tRPC namespaces and Express routes
- Deleted obsolete `PRODUCTION_DEPLOYMENT_FIX.md` and `PLATFORM_AUDIT_2026-02-24.md`
- Cleaned up stale Known Issues in `todo.md`

---

## [0.9.4] - February 28, 2026

### SEO & Sitemap Fix
- Fixed sitemap.xml returning old static file instead of dynamic route handler
- Removed static `/public/robots.txt` conflicting with dynamic route
- Verified sitemap returns proper XML with only public pages (13 static + dynamic artist/venue/event pages)
- Fixed Google Search Console "Duplicate without user-selected canonical" issue
- Added `CanonicalUpdater` component for global route-change canonical URL updates
- Added server-side 301 redirect for trailing slashes
- Ensured www prefix consistency across sitemap, robots.txt, and canonical URLs

---

## [0.9.3] - February 27, 2026

### Dark Mode & Theme
- Added dark mode toggle (sun/moon icon) in site header and dashboard header
- Created switchable `ThemeProvider` with `DarkModeToggle` component
- Applied 40+ global CSS dark mode overrides for backgrounds, text, gradients, shadows, borders, and hover states
- Dark-aware artist and venue dashboards, footer variant

### Mobile Venue Dashboard
- Added venue-dashboard mode to `MobileBottomNav` with 5 tabs (Overview, Bookings, Messages, Artists, More)
- Integrated responsive layout fixes for smaller padding, text, and icons on mobile

---

## [0.9.2] - February 27, 2026

### PWA & Mobile Messaging
- Added `manifest.json` with 7 icon sizes for Progressive Web App support
- Created service worker with network-first navigation and stale-while-revalidate for assets
- Built `usePWAInstall` hook with 7-day dismiss cooldown and `PWAInstallBanner` component
- Converted messaging page to single-column mobile view with slide-in/slide-out chat panel
- Added back button, touch-friendly inputs, and safe-area-bottom padding for mobile messaging

### Mobile Artist Experience
- Added sticky "Request Booking" bar on artist profiles (appears when scrolling past hero)
- Built mobile-optimized artist dashboard with bottom navigation bar (Overview, Bookings, Messages, Earnings, More)
- Added pull-to-refresh on Browse and VenueBrowse pages with native-feeling touch interaction

---

## [0.9.1] - February 26, 2026

### Mobile Responsive Overhaul
- Responsive homepage hero, search bar, and featured artists carousel
- Mobile hamburger menu with slide-out navigation panel
- Touch-friendly booking dialog (full-screen sheet on mobile, centered dialog on desktop)
- Mobile-optimized artist profiles, venue profiles, and dashboard layouts
- Responsive footer with stacked columns on mobile

---

## [0.9.0] - February 26, 2026

### Fan & Follow System
- Built fan/follow system allowing users to follow artists
- Created "Following" page showing followed artists
- Added follow/unfollow buttons on artist profiles
- Built "Send Update" email blast feature for artists to notify fans
- Added similar events recommendations on event detail pages

### Subscription & Payments
- Integrated Stripe checkout for subscription plans (Free, Pro, Premium)
- Built pricing page with tier comparison
- Created payment history page at `/orders`
- Implemented Stripe webhook handler for `checkout.session.completed`

### Events System
- Built events discovery page with search and filtering
- Created event detail pages with JSON-LD structured data
- Added event creation and management for artists/venues

---

## [0.8.0] - February 25, 2026

### Rider Contract System
- Built 4 pre-built rider templates (Solo Artist, Band/Ensemble, DJ, Speaker)
- Created full-form Rider Builder UI with section navigation, field editing, and live preview
- Implemented PDF generation (server-side PDFKit + client-side html2pdf.js)
- Added e-signature workflow (draw or type signatures, artist/venue countersigning)
- Built contract verification with signature integrity and IP address logging
- Automated email notifications for contract signing events

### Booking System
- Built booking request flow with date selection, event details, and pricing
- Created booking management dashboard for artists and venues
- Added booking status workflow (pending, confirmed, completed, cancelled)
- Integrated rider templates with booking contracts

---

## [0.7.0] - February 24, 2026

### Messaging System
- Built real-time messaging between artists and venues
- Created conversation list and chat interface
- Added unread message indicators and notifications

### Reviews & Ratings
- Built review submission and display system
- Added star ratings with average calculation
- Created review moderation for platform admin

### Admin Dashboard
- Built admin panel for platform management
- Added user management, content moderation, and analytics views
- Created admin-only routes with role-based access control

---

## [0.6.0] - February 24, 2026

### Platform Audit & Fixes
- Fixed all 56 TypeScript compilation errors (reduced to 0)
- Resolved OAuth login flow and callback handling
- Fixed database schema migration issues with TiDB
- Cleaned up test data and seeded production-quality artists and venues

### Artist & Venue Profiles
- Built artist profile pages with bio, gallery, pricing, and availability
- Built venue profile pages with capacity, amenities, and location
- Added profile editing and S3 photo uploads
- Created browse pages with search, filtering, and sorting

---

## [0.5.0] - February 19, 2026

### Initial Platform
- Scaffolded React + Vite frontend with Tailwind CSS and shadcn/ui
- Built Express + tRPC backend with Drizzle ORM
- Configured AWS RDS MySQL database (36 tables)
- Integrated Manus OAuth authentication
- Set up Stripe payment processing
- Configured SendGrid email delivery
- Created S3 file storage integration
- Built homepage with hero, search, and featured artists carousel

---

**Platform Metrics (as of February 28, 2026):**

| Metric | Value |
|--------|-------|
| Database tables | 36 |
| Client pages | 46 |
| Test suite | 1,233 passing (46 files) |
| TypeScript errors | 0 |
| tRPC router namespaces | 30 |
| Production domain | www.ologywood.com |
