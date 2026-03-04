# Ologywood — Artist Booking Platform

**Status:** Production
**Last Updated:** March 4, 2026
**Domain:** [www.ologywood.com](https://www.ologywood.com)
**Mirror:** [ologywood-mp6flm6c.manus.space](https://ologywood-mp6flm6c.manus.space)

Ologywood is a subscription-based booking platform connecting performing artists with venues. The platform provides an end-to-end booking experience: artist discovery, booking requests, rider contract management, two-phase Stripe payments (deposit + remaining balance), in-platform messaging, fan engagement tools, and automated email workflows.

---

## Platform Metrics (March 4, 2026)

| Metric | Count |
|--------|-------|
| Database tables | 40 |
| Client pages | 53 |
| UI components (custom + shadcn) | 122 |
| Active tRPC router namespaces | 18 |
| Dedicated router files | 16 |
| Service files | 91 |
| Vitest tests | 1,403 passing (56 files) |
| TypeScript errors | 0 |

---

## Core User Flows

### 1. Artist Onboarding and Profile

Artists sign up via OAuth, select the "Artist" role, and complete onboarding with profile details (name, genre, bio, fee range, location). They can upload photos to S3, set availability dates, and build rider templates.

**Pages:** `/get-started` → `/onboarding/artist` → `/dashboard` → `/profile/edit`

### 2. Venue Onboarding and Discovery

Venues sign up, select the "Venue" role, complete onboarding, then browse and search artists by genre, location, and fee range. They can favorite artists and view detailed profiles.

**Pages:** `/get-started` → `/onboarding/venue` → `/venue-dashboard` → `/browse` → `/artist/:id`

### 3. Booking Flow (End-to-End, Verified Working)

1. Venue creates a booking request from an artist's profile (`/booking/create`)
2. Artist receives the request on their dashboard and accepts/declines
3. Artist sends their rider template via the messaging thread
4. Venue reviews the rider (via "View Rider" shortcut on dashboard or in Messages)
5. Venue pays the 50% deposit via Stripe Checkout
6. Booking status advances to "Deposit Paid"
7. Venue pays the remaining 50% balance
8. Booking status advances to "Fully Paid" / "Completed"
9. Both parties can leave reviews

Payment verification uses both Stripe webhooks and a client-side `verifyPayment` fallback to ensure booking status always updates after payment.

### 4. Rider Contract Flow

Artists create rider templates from 4 pre-built types (Solo Artist, Band, DJ, Speaker) covering technical requirements, hospitality, stage setup, and financial terms. Riders are sent as rich messages within booking threads and can be viewed in full detail via modals.

**Pages:** `/rider-builder` → `/rider-templates` → `/saved-riders` → (sent via Messages)

### 5. Fan Engagement

Users can follow artists with email consent. Artists on paid tiers can send email blasts to their followers. The system is CAN-SPAM compliant with unsubscribe links and double opt-in.

**Pages:** `/following` → `/artist/:id` (Follow button) → `/unsubscribe`

---

## Features by Role

### Artist Features

| Feature | Description | Status |
|---------|-------------|--------|
| Profile Management | Photos (S3 CDN), bio, genre tags, fee ranges, location | Active |
| Rider Builder | 4 pre-built templates with technical, hospitality, stage, payment sections | Active |
| Booking Management | Accept, decline, negotiate booking requests with real-time status | Active |
| Messaging | Direct in-platform messaging with venues per booking thread | Active |
| Earnings Dashboard | Track completed bookings and earnings | Active |
| Availability Calendar | Set and display performance availability by date | Active |
| Fan System | Followers with email consent, tiered access (free: names, paid: emails + CSV) | Active |
| Send Updates | Email blast tool for paid-tier artists to notify fans | Active |
| Subscription Management | View plan, upgrade, cancel, reactivate from dashboard | Active |
| Events | Create and manage events with photos, recurrence, history | Active |
| Release Manager | Upload and manage music releases | Active |
| Stripe Connect | Link bank account to receive payouts from venue payments | Active |
| Tax Reporting | View earnings for tax purposes | Active |

### Venue Features

| Feature | Description | Status |
|---------|-------------|--------|
| Venue Profile | Organization profiles with contact info, location, venue type | Active |
| Artist Discovery | Browse/search artists by genre, location, fee range with autocomplete | Active |
| Booking Requests | Create bookings with event details, budget, rider attachment | Active |
| Rider Viewing | View Full Rider button on dashboard + Messages, modal display | Active |
| Two-Phase Payments | Pay 50% deposit then remaining balance via Stripe Checkout | Active |
| Invoice Dashboard | Track invoices and payment history with real booking data | Active |
| Reviews | Leave and respond to reviews with 1-5 star ratings | Active |
| Messaging | Communicate directly with artists about event details | Active |
| Favorites | Save favorite artists for quick access | Active |

### Fan Features

| Feature | Description | Status |
|---------|-------------|--------|
| Follow Artists | Follow with email consent for updates | Active |
| Following Page | View all followed artists in one place | Active |
| Email Updates | Receive artist announcements (CAN-SPAM compliant) | Active |

### Platform / Shared

| Feature | Description | Status |
|---------|-------------|--------|
| OAuth Authentication | Manus OAuth with role-based access (artist, venue, admin) | Active |
| Stripe Payments | Subscriptions, deposit/balance payments, Connect, webhooks | Active |
| Email Notifications | SendGrid with 15+ email types (booking, payment, review, contract, fan) | Active |
| Dark Mode | Full dark mode toggle with localStorage persistence | Active |
| PWA | Installable with service worker, offline support, install prompt | Active |
| Mobile-First | Responsive layouts, mobile nav, pull-to-refresh, sticky bars | Active |
| SEO | OG tags, JSON-LD, canonical URLs, sitemap, robots.txt | Active |
| Admin Dashboard | User management, analytics, payout processing | Active |
| Blog | Platform blog with rich content posts | Active |

---

## Technical Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript + Vite | React 19, Vite 7, TS 5.9 |
| Styling | Tailwind CSS + shadcn/ui | Tailwind 4.x |
| Backend | Node.js + Express + tRPC | Express 4, tRPC 11 |
| Database | AWS RDS MySQL + Drizzle ORM | MySQL 8.0, Drizzle 0.44 |
| Authentication | Manus OAuth + JWT | — |
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
│   │   ├── pages/             # 53 page components
│   │   ├── components/        # 68 custom + 54 shadcn/ui components
│   │   ├── _core/hooks/       # Auth hooks
│   │   └── lib/               # Utilities (trpc, validation, calendar)
│   └── public/                # Static assets, manifest, service worker
├── server/                     # Express + tRPC backend
│   ├── routers/               # 16 active tRPC router files
│   ├── routers.ts             # Main router aggregation + inline routes
│   ├── services/              # 91 business logic services
│   ├── webhooks/              # Stripe webhook handler
│   ├── db.ts                  # Database queries (Drizzle)
│   ├── email.ts               # Email templates (SendGrid)
│   └── stripe.ts              # Stripe client initialization
├── drizzle/                    # Database schema and migrations
│   ├── schema.ts              # 40 table definitions
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

## Database Schema (40 Tables)

**User Management:** `users`, `emailPreferences`, `notificationPreferences`, `notifications`

**Artist Features:** `artistProfiles`, `artistEarnings`, `artistPayouts`, `artistUpdates`, `artistReleases`, `releasePurchases`, `riderTemplates`, `availability`, `follows`, `artistFollows`, `profileViews`, `verificationBadges`

**Booking System:** `bookings`, `bookingTemplates`, `bookingReminders`, `bookingUsage`, `messages`, `contracts`, `signatures`

**Venue Management:** `venueProfiles`, `venueReviews`, `invoices`, `favorites`

**Events:** `events`, `eventHistory`, `eventPhotos`, `eventRecurrence`, `savedEvents`

**Payments & Subscriptions:** `stripeConnectAccounts`, `subscriptions`, `userSubscriptions`

**Content & System:** `reviews`, `referrals`, `emailLogs`, `blogPosts`

---

## Environment Variables

All secrets are managed via Manus Settings → Secrets:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL connection string |
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
npx vitest run                        # Run all 1,403 tests
npx vitest run --reporter=verbose     # Verbose output
npx vitest run server/routers/follows.test.ts  # Specific file
```

**Current:** 1,403 tests passing across 56 test files, 0 TypeScript errors.

---

## Deployment

The platform is hosted on Manus with automatic deployments:

1. Make changes and verify with `npx vitest run`
2. Save a checkpoint via the Manus tools
3. Click **Publish** in the Management UI
4. Live at [www.ologywood.com](https://www.ologywood.com)

For Stripe live payments: complete KYC verification in Stripe Dashboard, then enter live keys in Settings → Payment.

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | This file — platform overview and quick reference |
| [ROADMAP.md](./ROADMAP.md) | Feature roadmap with priorities |
| [CHANGELOG.md](./CHANGELOG.md) | Versioned release history |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture and data flow |
| [docs/API.md](./docs/API.md) | API endpoint documentation |
| [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) | Developer setup and coding standards |
| [docs/CI_CD_DEPLOYMENT.md](./docs/CI_CD_DEPLOYMENT.md) | Deployment and CI/CD procedures |
| [docs/DISASTER_RECOVERY.md](./docs/DISASTER_RECOVERY.md) | Backup and recovery procedures |
| [todo.md](./todo.md) | Development task tracker (all completed and pending work) |

---

## License

Proprietary — Ologywood Platform
