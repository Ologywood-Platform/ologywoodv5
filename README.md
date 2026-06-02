# Ologywood™ — Artist Booking Platform

**Status:** Production  
**Last Updated:** June 2, 2026  
**Domain:** [www.ologywood.com](https://www.ologywood.com)  
**Mirror:** [ologywood-mp6flm6c.manus.space](https://ologywood-mp6flm6c.manus.space)

Ologywood™ is a subscription-based booking platform connecting performing artists with venues and event organizers. The platform provides an end-to-end booking experience: artist and venue discovery, booking requests, rider contract management with e-signatures and revision workflows, two-phase Stripe payments (deposit + remaining balance), door-split and guarantee-vs-percentage settlement calculations, in-platform messaging, fan engagement tools, music release sales, project previews with audio snippets, merch/shop storefronts, event ticketing, blog content management, referral programs, dispute resolution, calendar management with availability blocking and recurring patterns, and automated email workflows.

---

## Platform Metrics (June 2, 2026)

| Metric | Count |
|--------|-------|
| Database tables | 78 |
| Client pages | 73 |
| UI components (custom + shadcn) | 161 |
| Active tRPC router files | 24 |
| Server files (non-test) | 154 |
| Vitest tests | 2,289 passing (106 files) |
| TypeScript errors | 0 |

---

## User Roles

The platform supports six distinct user roles, each with specific access levels and capabilities. Admins can change any user's role via the Change Role dropdown in the Admin Dashboard, and all role changes are recorded in the Audit Log.

| Role | Description | Dashboard |
|------|-------------|-----------|
| **Owner** | Platform owner (garychisolm30@gmail.com). Full admin access, cannot be demoted. | `/admin` |
| **Admin** | Full platform management: users, bookings, payouts, disputes, blog, analytics. | `/admin` |
| **Blogger** | Blog-only access: create, edit, publish, and delete blog posts. No admin features. | `/blogger-dashboard` |
| **Artist** | Performing artists: manage profile, bookings, riders, releases, projects, merch, earnings, events. | `/dashboard` |
| **Venue** | Event venues: browse artists, create bookings, manage payments, events, calendar, and analytics. | `/venue-dashboard` |
| **User** | Default role (fan/client): browse, follow artists, book artists for private events, purchase music. | — |

---

## Core User Flows

### 1. Artist Onboarding and Profile

Artists sign up via OAuth or email/password, select the "Artist" role, and complete onboarding with profile details (name, genre, bio, fee range, location). They can upload photos to S3, set availability dates, build rider templates, and showcase project previews and merch.

**Pages:** `/get-started` → `/onboarding/artist` → `/dashboard` → `/profile/edit`

### 2. Venue Onboarding and Discovery

Venues sign up, select the "Venue" role, complete onboarding, then browse and search artists by genre, location, and fee range. They can favorite artists, manage calendar availability, block dates, and view detailed profiles.

**Pages:** `/get-started` → `/onboarding/venue` → `/venue-dashboard` → `/browse` → `/artist/:id`

### 3. Booking Flow (End-to-End)

1. Venue creates a booking request from an artist's profile (`/booking/create`)
2. Artist receives the request on their dashboard and accepts/declines
3. Artist's default rider template auto-attaches to the booking
4. Venue reviews the rider and can propose revisions to specific fields
5. Artist approves or rejects proposed revisions (full revision history tracked)
6. Both parties sign the rider contract with e-signatures
7. Deposit payment link auto-generates after both sign (25%, 50%, or 100% upfront)
8. Venue pays the deposit via Stripe Checkout
9. Booking status advances to "Deposit Paid"
10. Venue pays the remaining balance after the event
11. Booking status advances to "Fully Paid" / "Completed"
12. Both parties can leave category-specific reviews

Payment verification uses both Stripe webhooks and a client-side `verifyPayment` fallback to ensure booking status always updates after payment.

### 4. Rider Contract Flow

Artists create rider templates from a simplified universal booking rider covering 5 sections (Booking Details, Payment, Technical, Hospitality, Terms) with 17 fields. Riders auto-attach to new bookings, support venue revision proposals, e-signatures, counter-signing, and PDF export.

**Pages:** `/rider-builder` → `/rider-templates` → `/saved-riders` → (auto-attached to bookings)

### 5. Door-Split and Settlement

Bookings support three payment term types: flat guarantee, door split percentage, and guarantee-vs-percentage (higher of the two). After shows, venues complete a settlement form with actual door revenue and attendance, and the system auto-calculates the final payout.

### 6. Fan Engagement

Users can follow artists with email consent. Artists on paid tiers can send email blasts to their followers. The system is CAN-SPAM compliant with unsubscribe links and double opt-in.

**Pages:** `/following` → `/artist/:id` (Follow button) → `/unsubscribe`

### 7. Music Releases

Artists can upload and sell music releases. Users can purchase, stream, and review tracks. Purchase-gated reviews ensure only verified buyers can leave reviews.

**Pages:** `/sell-music` → `/release-manager` → `/my-purchases`

### 8. Project Previews

Artists on paid tiers can showcase unreleased albums, EPs, and mixtapes with audio snippets. Fans can stream 30–60 second previews, view tracklists and cover art, and share projects on social media with rich OG cards. Play counts are tracked per track.

**Tier Limits:**
- Starter: 1 project, up to 6 tracks, 30-second snippets
- Professional: 3 projects, up to 12 tracks, 60-second snippets

**Pages:** `/projects` → Artist Profile `#projects` section

### 9. Merch / Shop

Artists and venues can create storefronts with product listings (title, description, price, external link, images). Items display on public profiles with hover-to-buy interactions.

**Tier Limits:**
- Starter: 6 items
- Professional: 15 items

**Pages:** `/merch` → Artist/Venue Profile merch section

### 10. Referral Program

Users can generate referral codes and share invite links. Referrers earn $5.00 credit per conversion; referred users get 50% off their first month. Credits expire after 90 days with warning emails at 7 days before expiry.

**Pages:** Dashboard → Referral Section → `/signup?ref=CODE`

### 11. Dispute Resolution

Either party can file a dispute on a booking. Admins review disputes, add notes, and resolve them through the Admin Dashboard Disputes tab. Stripe handles all chargebacks independently.

**Pages:** `/my-disputes` → Admin Dashboard → Disputes tab

---

## Features by Role

### Artist Features

| Feature | Description |
|---------|-------------|
| Profile Management | Photos (S3 CDN), bio, genre tags, fee ranges, location, performance video |
| Rider Builder | Universal booking rider template with 5 sections, auto-attach to bookings |
| E-Signatures | Sign rider contracts with draw or type signature |
| Rider Revisions | Venues propose changes, artist approves/rejects, full history tracked |
| Booking Management | Accept, decline, negotiate booking requests with real-time status |
| Messaging | Direct in-platform messaging with venues per booking thread |
| Earnings Dashboard | Track completed bookings, earnings breakdown, CSV export |
| Availability Calendar | Set and display performance availability by date with booking calendar |
| Fan System | Followers with email consent, tiered access (free: names, paid: emails + CSV) |
| Send Updates | Email blast tool for paid-tier artists to notify fans |
| Subscription Management | View plan, upgrade, downgrade, pause, resume, cancel, yearly billing |
| Events | Create and manage events with photos, recurrence, history |
| Release Manager | Upload and manage music releases with pay-what-you-want pricing |
| Project Previews | Showcase unreleased albums/EPs with audio snippets, play tracking, social sharing |
| Merch Store | Product listings with images, pricing, external links |
| Stripe Connect | Link bank account to receive payouts from venue payments |
| Tax Reporting | View earnings for tax purposes |
| Artist Reviews | Category ratings from venues (reliability, stage presence, crowd engagement, professionalism) |
| Referral Program | Share invite links, earn credits, track conversions |
| Calendar Sync | Export bookings to Google Calendar / iCal |
| Analytics Cards | Monthly bookings, total earnings, average rating with trends |

### Venue Features

| Feature | Description |
|---------|-------------|
| Venue Profile | Organization profiles with contact info, location, venue type, capacity, photos |
| Artist Discovery | Browse/search artists by genre, location, fee range with autocomplete |
| Booking Requests | Create bookings with event details, budget, payment terms selection |
| Payment Terms | Flat guarantee, door split %, or guarantee-vs-percentage |
| Post-Show Settlement | Settlement form with door revenue, attendance, auto-calculation |
| Rider Viewing | View Full Rider button on dashboard + Messages, propose revisions |
| Two-Phase Payments | Pay deposit (25/50/100%) then remaining balance via Stripe Checkout |
| Invoice Dashboard | Track invoices and payment history with real booking data |
| Calendar Management | Monthly/weekly views, color-coded bookings, day popovers |
| Availability Blocking | Block specific dates or recurring days (e.g., "closed every Monday") |
| Google Calendar Import | Import external calendar events as blocked dates (iCal URL) |
| Booking Conflict Warnings | Yellow alerts when new requests overlap confirmed bookings |
| Venue Events | Create events tied to confirmed bookings with flyer, tickets, description |
| Venue Analytics | Profile views, booking funnel (views → requests → confirmed), conversion rates |
| Reviews | Leave and respond to reviews with 1-5 star ratings |
| Venue Reviews | Receive category ratings (professionalism, sound quality, green room, payment timeliness) |
| Messaging | Communicate directly with artists about event details |
| Favorites | Save favorite artists for quick access with quick-book buttons |
| Shop & Offers | Product/service listings with images, pricing, external links |
| Request to Perform | Artists can request to perform at venues directly |

### Blogger Features

| Feature | Description |
|---------|-------------|
| Blog Dashboard | Dedicated dashboard at `/blogger-dashboard` with blog management |
| Post Management | Create, edit, publish, and delete blog posts with cover images |
| Content Tools | Rich text editing, draft/publish workflow |

### Admin Features

| Feature | Description |
|---------|-------------|
| Admin Dashboard | System health, user count, booking stats, financial overview |
| User Management | View all users, change roles via dropdown, search/filter |
| Role Change Audit Log | Track who changed whose role, when, with full accountability |
| Booking Management | View and manage all bookings platform-wide |
| Payout Processing | Review and process artist payouts |
| Dispute Resolution | Review, add notes, and resolve booking disputes |
| Blog Management | Create, edit, publish, delete blog posts |
| Release Management | View all music releases |
| Feedback | View unsubscribe feedback |

### Platform / Shared

| Feature | Description |
|---------|-------------|
| Dual Authentication | OAuth (Manus) + Email/Password with email verification |
| Stripe Payments | Subscriptions (monthly/yearly), deposit/balance payments, Connect, webhooks |
| Subscription Tiers | Free, Starter ($9/mo or $90/yr), Professional ($29/mo or $290/yr) |
| Subscription Pause | Pause billing for up to 90 days, auto-resume, feature revocation |
| Email Notifications | SendGrid with 20+ email types (booking, payment, review, role change, contract, referral) |
| In-App Notifications | Real-time notification bell with unread count, 23 trigger types |
| Dark Mode | Full dark mode toggle with localStorage persistence |
| PWA | Installable with service worker, offline support, install prompt in menu |
| Mobile-First | Responsive layouts, mobile nav, pull-to-refresh, sticky bars |
| SEO | OG tags (artist, venue, event, blog, project), JSON-LD, canonical URLs, sitemap, robots.txt |
| Social Sharing | Share buttons with native Web Share API, Twitter, Facebook, WhatsApp |
| Cookie Consent | GDPR-compliant cookie notice |
| Contact Form | Public contact form with email delivery |
| Referral System | Invite codes, $5 credit per conversion, 50% off first month, 90-day expiry |
| Security Headers | Helmet middleware with CSP, HSTS, X-Frame-Options, Permissions-Policy |
| Trademark Notice | Ologywood™ pending USPTO registration, stated in Terms of Service |

---

## Subscription Tiers

| Feature | Free | Starter ($9/mo) | Professional ($29/mo) |
|---------|------|-----------------|----------------------|
| Artist Profile | ✓ | ✓ | ✓ |
| Booking Management | ✓ | ✓ | ✓ |
| Rider Builder | ✓ | ✓ | ✓ |
| Music Releases | — | 2 singles | Unlimited |
| Project Previews | — | 1 project / 6 tracks / 30s | 3 projects / 12 tracks / 60s |
| Merch Items | — | 6 items | 15 items |
| Fan Email Access | Names only | Full emails + CSV | Full emails + CSV |
| Email Blasts | — | ✓ | ✓ |
| Yearly Billing | — | $90/yr (2 months free) | $290/yr (2 months free) |

---

## Technical Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript + Vite | React 19, Vite 7, TS 5.9 |
| Styling | Tailwind CSS + shadcn/ui | Tailwind 4.x |
| Backend | Node.js + Express + tRPC | Express 4, tRPC 11 |
| Database | AWS RDS MySQL + Drizzle ORM | MySQL 8.0, Drizzle 0.44 |
| Authentication | Manus OAuth + JWT + Email/Password | — |
| Payments | Stripe (Checkout + Connect + Webhooks) | 20.x |
| Email | SendGrid | v3 API |
| Storage | AWS S3 (CDN URLs) | — |
| PDF Generation | PDFKit | 0.17 |
| Testing | Vitest | 2.x |
| Hosting | Manus Platform | — |

---

## Project Structure

```
ologywood/
├── client/                     # React frontend
│   ├── src/
│   │   ├── pages/             # 73 page components
│   │   ├── components/        # 161 custom + shadcn/ui components
│   │   ├── _core/hooks/       # Auth hooks
│   │   ├── types/             # TypeScript type definitions
│   │   └── lib/               # Utilities (trpc, validation, calendar)
│   └── public/                # Static assets, manifest, service worker
├── server/                     # Express + tRPC backend
│   ├── routers/               # 24 active tRPC router files
│   ├── routers.ts             # Main router aggregation + inline routes
│   ├── services/              # Business logic services (23 files)
│   ├── routes/                # Express routes (OG pages, webhooks)
│   ├── webhooks/              # Stripe webhook handler
│   ├── db.ts                  # Database queries (Drizzle)
│   ├── email.ts               # Email templates (SendGrid)
│   ├── stripe.ts              # Stripe client initialization
│   └── storage.ts             # S3 storage helpers
├── shared/                     # Shared types and config
│   └── products.ts            # Stripe product/pricing definitions
├── drizzle/                    # Database schema and migrations
│   ├── schema.ts              # Main table definitions (66 tables)
│   ├── schema-certificates.ts # Certificate and signing tables (6)
│   ├── schema-support.ts      # Support ticket tables (6)
│   └── migrations/            # SQL migration files
├── docs/                       # Developer documentation
│   ├── API.md                 # API reference
│   ├── DEVELOPER_GUIDE.md     # Setup and development guide
│   ├── CI_CD_DEPLOYMENT.md    # Deployment guide
│   └── DISASTER_RECOVERY.md   # Recovery procedures
├── README.md                   # This file
├── ARCHITECTURE.md             # System architecture overview
├── CHANGELOG.md                # Version history
├── ROADMAP.md                  # Feature roadmap and priorities
└── todo.md                     # Development task tracker
```

---

## Database Schema (78 Tables)

**User Management:** `users`, `password_reset_tokens`, `email_preferences`, `notification_preferences`, `notifications`, `user_subscriptions`, `unsubscribe_feedback`

**Artist Features:** `artist_profiles`, `artist_earnings`, `artist_payouts`, `artist_updates`, `artist_releases`, `release_purchases`, `rider_templates`, `availability`, `follows`, `artist_follows`, `profile_views`, `verification_badges`, `project_previews`, `project_preview_tracks`, `merch_items`

**Booking System:** `bookings`, `booking_templates`, `booking_reminders`, `booking_usage`, `booking_disputes`, `messages`, `contracts`, `signatures`

**Venue Management:** `venue_profiles`, `venue_reviews`, `venue_blocked_dates`, `venue_recurring_blocks`, `venue_profile_views`, `invoices`, `favorites`, `saved_artists`

**Events:** `events`, `event_history`, `event_photos`, `event_recurrence`, `saved_events`

**Payments & Subscriptions:** `stripe_connect_accounts`, `subscriptions`

**Referrals:** `referrals`, `referral_codes`, `referral_credits`

**Content & Blog:** `blog_posts`, `reviews`, `track_reviews`, `artist_reviews`, `email_logs`

**Contracts & Certificates:** `certificate_audit_trail`, `contract_reminders`, `contract_signing_sessions`, `contract_verification_requests`, `signature_certificates`, `ryder_contracts`, `ryder_contract_versions`, `ryder_contract_comments`, `venue_contracts`, `venue_contract_signatures`

**Support:** `help_articles`, `support_tickets`, `support_metrics`, `ticket_assignments`, `ticket_responses`

**Admin:** `role_change_audit_log`, `api_keys`, `webhook_endpoints`, `tax_reports`

---

## Environment Variables

All secrets are managed via Manus Settings → Secrets:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL connection string (AWS RDS) |
| `JWT_SECRET` | JWT token signing |
| `STRIPE_SECRET_KEY` | Stripe server-side API key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe client-side key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| `SENDGRID_API_KEY` | Email delivery |
| `SENDGRID_FROM_EMAIL` | Sender email address |
| `AWS_ACCESS_KEY_ID` | S3 storage access |
| `AWS_SECRET_ACCESS_KEY` | S3 storage secret |
| `AWS_REGION` | S3 region |
| `OPENAI_API_KEY` | AI features (recommendations) |

---

## Scripts

```bash
pnpm dev          # Start development server (port 3000)
pnpm build        # Production build (Vite + esbuild)
pnpm start        # Run production server
pnpm check        # TypeScript type checking
pnpm test         # Run vitest test suite
pnpm db:push      # Generate and apply database migrations
```

---

## Testing

**Test card:** `4242 4242 4242 4242` (any future expiry, any CVC)

```bash
npx vitest run                        # Run all tests
npx vitest run --reporter=verbose     # Verbose output
npx vitest run server/routers         # Specific directory
```

**Current:** 2,289 tests passing across 106 test files, 0 TypeScript errors.

---

## Deployment

The platform is hosted on Manus with automatic deployments:

1. Make changes and verify with `npx vitest run`
2. Save a checkpoint via the Manus tools
3. Click **Publish** in the Management UI
4. Live at [www.ologywood.com](https://www.ologywood.com)

For Stripe live payments: complete KYC verification in Stripe Dashboard, then enter live keys in Settings → Payment.

---

## Recent Additions (May–June 2026)

| Feature | Date | Description |
|---------|------|-------------|
| Venue Features Suite | May 23–25 | Calendar views, event creation, artist filtering, door-split settlements, saved artists |
| Calendar Management | May 25 | Weekly/monthly views, availability blocking, recurring patterns, Google Calendar import, conflict warnings |
| Rider Contract Overhaul | May 24 | Universal template, auto-attach, revision workflow, counter-sign, PDF export, deposit auto-trigger |
| Artist & Venue Reviews | May 24 | Category-specific ratings for both artists and venues with response capability |
| Earnings Breakdown | May 25 | Per-booking revenue table, payment type indicators, CSV export |
| In-App Notifications | May 25 | 23 trigger types, real-time bell, notification preferences |
| Booking Funnel Metrics | May 25 | Profile views → requests → confirmed conversion tracking for venues |
| Featured Venues | Jun 1 | Homepage carousel with venue type icons and availability indicators |
| Merch / Shop | Jun 1 | Storefronts for artists and venues with tier-gated item limits |
| Project Previews | Jun 1 | Unreleased music showcase with audio snippets, play tracking, social sharing, OG cards |
| Trademark Notice | Jun 1 | Ologywood™ pending USPTO registration, updated Terms of Service |

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | Platform overview and quick reference |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture and data flow |
| [CHANGELOG.md](./CHANGELOG.md) | Versioned release history |
| [ROADMAP.md](./ROADMAP.md) | Feature roadmap with priorities |
| [docs/API.md](./docs/API.md) | API endpoint documentation |
| [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) | Developer setup and coding standards |
| [docs/CI_CD_DEPLOYMENT.md](./docs/CI_CD_DEPLOYMENT.md) | Deployment and CI/CD procedures |
| [docs/DISASTER_RECOVERY.md](./docs/DISASTER_RECOVERY.md) | Backup and recovery procedures |
| [todo.md](./todo.md) | Development task tracker |

---

## License

Proprietary — Ologywood™ Platform
