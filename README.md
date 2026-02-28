# Ologywood — Artist Booking Platform

**Status:** Production  
**Last Updated:** February 28, 2026  
**Domain:** [www.ologywood.com](https://www.ologywood.com)

Ologywood is a subscription-based booking platform connecting performing artists with venues. The platform provides an end-to-end booking experience with rider contract management, e-signatures, availability calendars, Stripe payments, fan engagement tools, and automated email workflows.

---

## Platform Metrics

| Metric | Count |
|--------|-------|
| Database tables | 36 |
| Client pages | 46 |
| UI components | 255 |
| tRPC router namespaces | 30 |
| Dedicated router files | 13 |
| Service files | 80+ |
| Vitest tests | 1,233 passing |
| TypeScript errors | 0 |
| Database migrations | 53 |

---

## Features

### For Artists

- **Profile Management** — Artist profiles with photos (S3 CDN), bio, genre tags, fee ranges, and location
- **Rider Builder** — Create and manage performance rider templates from 4 pre-built types (Solo Artist, Band, DJ, Speaker) with technical, hospitality, stage, and payment sections
- **E-Signatures** — Draw or type signatures on rider contracts with countersigning workflow and IP logging
- **Booking Management** — Accept, decline, or negotiate booking requests with real-time status tracking
- **Messaging** — Direct in-platform messaging with venues per booking thread
- **Earnings Dashboard** — Track completed bookings, earnings, and tax reporting
- **Availability Calendar** — Set and display performance availability by date
- **Fan System** — Followers list with email consent, tiered access (free: names only, paid: full emails + CSV export)
- **Send Update** — Email blast tool for paid-tier artists to notify fans (rate-limited, with history tracking)
- **Subscription Management** — View current plan, upgrade, cancel, or reactivate from the dashboard
- **Events** — Create and manage events with photos, recurrence, and history

### For Venues

- **Venue Profile** — Organization profiles with contact info, location, and venue type
- **Artist Discovery** — Browse and search artists by genre, location, and fee range with live autocomplete
- **Booking Requests** — Create booking requests with event details, budget, and rider attachment
- **Rider Viewing** — Access artist rider templates and sign contracts digitally
- **Reviews** — Leave and respond to reviews with 1-5 star ratings
- **Invoice Dashboard** — Track invoices and payment history
- **Messaging** — Communicate directly with artists about event details

### For Fans

- **Follow Artists** — Follow favorite artists with email consent for updates
- **Following Page** — View all followed artists in one place
- **Email Updates** — Receive artist announcements and event notifications (CAN-SPAM compliant)

### Shared / Platform

- **OAuth Authentication** — Manus OAuth with role-based access control (artist, venue, fan, admin)
- **Stripe Payments** — Subscription checkout (Starter $9/mo, Professional $29/mo), deposit payments, and webhook handling
- **Email Notifications** — SendGrid integration with 15+ email types (booking, payment, review, contract, fan updates)
- **Dark Mode** — Full dark mode toggle with localStorage persistence
- **Progressive Web App** — Installable PWA with service worker, offline support, and install prompt
- **Mobile-First Design** — Responsive layouts, mobile bottom navigation, hamburger menu, pull-to-refresh, sticky booking bar, full-screen booking sheet
- **SEO** — Dynamic OG tags, JSON-LD structured data (MusicGroup, EventVenue, Event, Organization, BreadcrumbList, FAQPage), canonical URLs, XML sitemap, robots.txt
- **Admin Dashboard** — User management, platform analytics, payout processing

---

## Technical Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript + Vite | React 19, Vite 7, TS 5.9 |
| Styling | Tailwind CSS | 4.x |
| Backend | Node.js + Express + tRPC | Express 4, tRPC 11 |
| Database | AWS RDS MySQL + Drizzle ORM | MySQL 8.0, Drizzle 0.44 |
| Authentication | Manus OAuth + JWT | — |
| Payments | Stripe | 20.x |
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
│   │   ├── pages/             # 46 page components
│   │   ├── components/        # 255 reusable UI components
│   │   │   └── ui/            # shadcn/ui primitives
│   │   ├── _core/hooks/       # Auth hooks
│   │   └── lib/               # Utilities (trpc, validation, calendar, etc.)
│   └── index.html
├── server/                    # Node.js backend
│   ├── _core/                 # Server bootstrap, OAuth, tRPC, Vite, env
│   ├── routers/               # 13 dedicated tRPC router files
│   ├── routers.ts             # Main router aggregating 30 namespaces
│   ├── routes/                # Express routes (events, email, sitemap, etc.)
│   ├── services/              # 80+ business logic services
│   ├── middleware/             # Rate limiting, OG tags, security, caching
│   ├── handlers/              # Image upload handler
│   ├── templates/             # Email and rider contract templates
│   ├── db.ts                  # Database query functions
│   └── stripe.ts              # Stripe integration
├── drizzle/                   # Database schema and 53 migrations
│   └── schema.ts              # 36 table definitions
├── docs/                      # Developer documentation
├── public/                    # Static assets and legal pages
├── todo.md                    # Feature tracking (single source of truth)
└── package.json
```

---

## Database Schema (36 Tables)

**User Management:** users, email_preferences, notification_preferences

**Artist Features:** artist_profiles, artist_earnings, artist_payouts, artist_updates, rider_templates, availability, follows, artist_follows, profile_views, verification_badges

**Booking System:** bookings, booking_templates, booking_reminders, booking_usage, messages, contracts, signatures

**Venue Management:** venue_profiles, venue_reviews, invoices

**Events:** events, event_history, event_photos, event_recurrence, saved_events

**Payments & Subscriptions:** stripe_connect_accounts, subscriptions, user_subscriptions

**Content:** reviews, notifications, referrals, favorites, email_logs

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

**Test card:** 4242 4242 4242 4242 (any future expiry, any CVC)

```bash
pnpm test                    # Run all 1,233 tests
pnpm test <filename>         # Run specific test file
npx vitest run --reporter=verbose  # Verbose output
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [todo.md](./todo.md) | Feature tracking — single source of truth for all completed and pending work |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, folder structure, and data flow |
| [docs/API.md](./docs/API.md) | API endpoint documentation |
| [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) | Developer setup and coding standards |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Deployment procedures |
| [docs/DISASTER_RECOVERY.md](./docs/DISASTER_RECOVERY.md) | Backup and recovery procedures |
| [server/templates/riderContractTemplate.md](./server/templates/riderContractTemplate.md) | Rider contract template specification |

---

## Deployment

The platform is hosted on Manus with automatic deployments from checkpoints. Custom domain `www.ologywood.com` is configured with SSL.

To deploy:
1. Save a checkpoint via the Manus Management UI
2. Click the Publish button in the Management UI header

---

## License

Proprietary — Ologywood Platform
